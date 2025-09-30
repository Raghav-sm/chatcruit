import os
import pickle
import shutil
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.huggingface import HuggingFaceEmbeddings
from langchain.vectorstores.faiss import FAISS
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain.cache import InMemoryCache
from langchain.globals import set_llm_cache
from langchain.schema import Document
from langchain.schema.retriever import BaseRetriever
from rank_bm25 import BM25Okapi
import hashlib
import json

# --- ADD THIS LINE FOR CPU STABILITY ---
os.environ["OMP_NUM_THREADS"] = "1"
# ---------------------------------------

load_dotenv()
set_llm_cache(InMemoryCache())


app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])


UPLOAD_DIR = "uploaded_files"
VECTORSTORE_PATH = "vectorstore.pkl"
CACHE_PATH = "query_cache.json"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Global variables
rag_chain = None
text_chunks = []
vectorstore = None


class HybridRetriever(BaseRetriever):
    """Custom retriever combining vector search and BM25."""
    
    def __init__(self, vectorstore, texts, embeddings):
        super().__init__()
        self.vectorstore = vectorstore
        self.bm25 = BM25Okapi([text.split() for text in texts])
        self.texts = texts
        self.embeddings = embeddings
    
    def _get_relevant_documents(self, query: str):
        """Get documents relevant to a query."""
        return self.get_relevant_documents(query, k=3)
    
    async def _aget_relevant_documents(self, query: str):
        """Async version - not implemented."""
        return self._get_relevant_documents(query)
    
    def get_relevant_documents(self, query, k=3):
        # Vector similarity search
        vector_docs = self.vectorstore.similarity_search(query, k=k*2)
        
        # BM25 search
        bm25_scores = self.bm25.get_scores(query.split())
        bm25_indices = np.argsort(bm25_scores)[::-1][:k*2]
        
        # Combine and re-rank
        all_docs = []
        doc_set = set()
        
        # Add vector results
        for doc in vector_docs:
            if doc.page_content not in doc_set:
                all_docs.append((doc, 'vector'))
                doc_set.add(doc.page_content)
        
        # Add BM25 results
        for idx in bm25_indices:
            if idx < len(self.texts) and self.texts[idx] not in doc_set:
                doc = Document(page_content=self.texts[idx])
                all_docs.append((doc, 'bm25'))
                doc_set.add(self.texts[idx])
        
        # Re-rank by hybrid score
        scored_docs = []
        for doc, source in all_docs:
            vector_score = 0.5
            bm25_score = 0.5
            
            if source == 'vector':
                vector_score = 1.0
            if doc.page_content in self.texts:
                text_idx = self.texts.index(doc.page_content)
                raw_bm25_scores = self.bm25.get_scores(query.split())
                bm25_score = raw_bm25_scores[text_idx]
                # Normalize BM25 score
                min_score = np.min(raw_bm25_scores)
                max_score = np.max(raw_bm25_scores)
                if max_score - min_score > 1e-8:
                    bm25_score = (bm25_score - min_score) / (max_score - min_score)
                else:
                    bm25_score = 0.5
            
            hybrid_score = 0.7 * vector_score + 0.3 * bm25_score
            scored_docs.append((doc, hybrid_score))
        
        # Sort by hybrid score and return top k
        scored_docs.sort(key=lambda x: x[1], reverse=True)
        return [doc for doc, score in scored_docs[:k]]


def load_cache():
    if os.path.exists(CACHE_PATH):
        with open(CACHE_PATH, 'r') as f:
            return json.load(f)
    return {}


def save_cache(cache):
    with open(CACHE_PATH, 'w') as f:
        json.dump(cache, f)


def get_cache_key(query):
    return hashlib.md5(query.encode()).hexdigest()


def process_and_store_documents(upload_dir, vectorstore_path="vectorstore.pkl"):
    global text_chunks
    
    doc_texts = []
    for file_name in os.listdir(upload_dir):
        if file_name.endswith('.pdf'):
            pdf_path = os.path.join(upload_dir, file_name)
            try:
                pdf_reader = PdfReader(pdf_path)
                text = "".join(page.extract_text() or "" for page in pdf_reader.pages)
                if text.strip():
                    doc_texts.append(text)
                    print(f"Processed {file_name}: {len(text)} characters")
                else:
                    print(f"Warning: No text extracted from {file_name}")
            except Exception as e:
                print(f"Error processing {file_name}: {str(e)}")
                continue


    if not doc_texts:
        raise ValueError("No valid PDF documents found or no text could be extracted.")


    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000, 
        chunk_overlap=150,
        length_function=len
    )
    
    texts = text_splitter.split_text("\n\n".join(doc_texts))
    text_chunks = texts
    
    print(f"Created {len(texts)} text chunks")
    
    # --- Ensure embeddings are re-initialized each time documents are processed ---
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'}
    )
    # --------------------------------------------------------------------------
    
    vectorstore = FAISS.from_texts(texts, embedding=embeddings)
    
    # Save vectorstore with embeddings and text chunks
    with open(vectorstore_path, "wb") as f:
        pickle.dump({
            'vectorstore': vectorstore,
            'text_chunks': text_chunks,
            'embeddings': embeddings
        }, f)
        
    return vectorstore, embeddings


def create_rag_pipeline(vectorstore, text_chunks, embeddings, groq_api_key: str):
    llm = ChatGroq(
        temperature=0,
        groq_api_key=groq_api_key, 
        model_name="llama3-8b-8192"
    )
    
    # Create hybrid retriever with all required components
    retriever = HybridRetriever(vectorstore, text_chunks, embeddings)
    
    prompt_template = """
You are an HR assistant. Use the following context from HR policies and documents to answer the question accurately and helpfully.


Context: {context}


Question: {question}


Instructions:
- Answer based only on the provided context
- If the context doesn't contain relevant information, say "I don't have enough information in the HR documents to answer this question accurately."
- Keep answers concise and professional
- Focus on HR-related queries about policies, procedures, and guidelines


Answer:
"""
    
    PROMPT = PromptTemplate(
        template=prompt_template, 
        input_variables=["context", "question"]
    )
    
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,  # Use the hybrid retriever
        return_source_documents=True,
        chain_type_kwargs={"prompt": PROMPT}
    )
    
    return qa_chain


def initialize_rag_chain():
    global rag_chain, vectorstore, text_chunks
    
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        raise ValueError("GROQ_API_KEY environment variable not set.")
    
    if os.path.exists(VECTORSTORE_PATH):
        with open(VECTORSTORE_PATH, "rb") as f:
            data = pickle.load(f)
            if isinstance(data, dict):
                vectorstore = data['vectorstore']
                text_chunks = data['text_chunks']
                embeddings = data['embeddings']
            else:
                # Fallback for old format (if vectorstore was saved directly without other data)
                vectorstore = data
                text_chunks = [] # This might lead to issues if BM25 needs actual text_chunks
                print("Warning: Old vectorstore format detected. Re-initializing embeddings and text_chunks for compatibility.")
                embeddings = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2",
                    model_kwargs={'device': 'cpu'}
                )
        
        # Ensure embeddings are always present and properly initialized before creating the RAG chain
        if 'embeddings' not in locals() or embeddings is None:
             embeddings = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2",
                    model_kwargs={'device': 'cpu'}
                )

        rag_chain = create_rag_pipeline(vectorstore, text_chunks, embeddings, groq_api_key)
        print("RAG chain initialized successfully.")
    else:
        print("Vector store not found. Waiting for file upload.")


@app.route('/upload', methods=['POST'])
def upload_files():
    global rag_chain, vectorstore, text_chunks
    
    if 'files' not in request.files:
        return jsonify({"error": "No files part in the request."}), 400
    
    files = request.files.getlist('files')
    if not files or all(file.filename == '' for file in files):
        return jsonify({"error": "No files selected for uploading."}), 400


    # Clear previous uploads
    if os.path.exists(UPLOAD_DIR):
        shutil.rmtree(UPLOAD_DIR)
    os.makedirs(UPLOAD_DIR)


    successful_uploads = 0
    for file in files:
        if file and file.filename.endswith('.pdf'):
            filename = file.filename
            file.save(os.path.join(UPLOAD_DIR, filename))
            successful_uploads += 1
    
    if successful_uploads == 0:
        return jsonify({"error": "No valid PDF files uploaded."}), 400


    try:
        # Process new files and create a new vector store
        # This function now correctly re-initializes embeddings each time
        vectorstore, embeddings = process_and_store_documents(UPLOAD_DIR, VECTORSTORE_PATH)
        
        # Re-initialize the RAG chain with the new vector store
        groq_api_key = os.environ.get("GROQ_API_KEY")
        rag_chain = create_rag_pipeline(vectorstore, text_chunks, embeddings, groq_api_key)
        
        # Clear cache when new documents are uploaded
        if os.path.exists(CACHE_PATH):
            os.remove(CACHE_PATH)
        
        return jsonify({
            "message": f"{successful_uploads} files uploaded and processed successfully.",
            "chunks_created": len(text_chunks)
        }), 200
    except Exception as e:
        import traceback
        print(f"Error during upload: {traceback.format_exc()}")
        return jsonify({"error": f"An error occurred during processing: {str(e)}"}), 500


@app.route('/query', methods=['POST'])
def query_endpoint():
    if not rag_chain:
        return jsonify({"error": "RAG chain not initialized. Please upload documents first."}), 400
        
    data = request.get_json()
    query_text = data.get('query')
    if not query_text:
        return jsonify({"error": "Query text is required."}), 400
    
    # Check cache
    cache = load_cache()
    cache_key = get_cache_key(query_text)
    if cache_key in cache:
        print("Returning cached response")
        return jsonify(cache[cache_key])
        
    try:
        result = rag_chain({"query": query_text})
        response = {
            "answer": result["result"],
            "sources": [doc.page_content for doc in result["source_documents"]]
        }
        
        # Cache the response
        cache[cache_key] = response
        save_cache(cache)
        
        return jsonify(response)
    except Exception as e:
        import traceback
        print(f"Error during query: {traceback.format_exc()}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "rag_initialized": rag_chain is not None,
        "vectorstore_exists": os.path.exists(VECTORSTORE_PATH),
        "chunks_loaded": len(text_chunks)
    })


if __name__ == '__main__':
    initialize_rag_chain()
    app.run(host='0.0.0.0', port=5000, debug=True)