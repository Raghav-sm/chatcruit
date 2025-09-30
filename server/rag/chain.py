import os
import pickle
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA
from langchain.embeddings.huggingface import HuggingFaceEmbeddings

from rag.retrievers import HybridRetriever
from config import VECTORSTORE_PATH


rag_chain = None
text_chunks = []
vectorstore = None

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
                # Fallback for old format
                vectorstore = data
                text_chunks = []
                print("Warning: Old vectorstore format detected. Re-initializing embeddings and text_chunks for compatibility.")
                embeddings = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2",
                    model_kwargs={'device': 'cpu'}
                )
        
        if 'embeddings' not in locals() or embeddings is None:
             embeddings = HuggingFaceEmbeddings(
                    model_name="sentence-transformers/all-MiniLM-L6-v2",
                    model_kwargs={'device': 'cpu'}
                )

        rag_chain = create_rag_pipeline(vectorstore, text_chunks, embeddings, groq_api_key)
        print("RAG chain initialized successfully.")
    else:
        print("Vector store not found. Waiting for file upload.")

def create_rag_pipeline(vectorstore, text_chunks, embeddings, groq_api_key: str):
    llm = ChatGroq(
        temperature=0,
        groq_api_key=groq_api_key, 
        model_name="llama3-8b-8192"
    )
    
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
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": PROMPT}
    )
    
    return qa_chain