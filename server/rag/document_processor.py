import os
import pickle
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings.huggingface import HuggingFaceEmbeddings
from langchain.vectorstores.faiss import FAISS
from langchain.schema import Document

def process_and_store_documents(upload_dir, vectorstore_path="vectorstore.pkl"):
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

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'}
    )
    
    vectorstore = FAISS.from_texts(texts, embedding=embeddings)
    
    with open(vectorstore_path, "wb") as f:
        pickle.dump({
            'vectorstore': vectorstore,
            'text_chunks': text_chunks,
            'embeddings': embeddings
        }, f)
        
    return vectorstore, embeddings, text_chunks