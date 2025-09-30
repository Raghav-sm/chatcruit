import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from config import UPLOAD_DIR, VECTORSTORE_PATH, CACHE_PATH
from rag.document_processor import process_and_store_documents
from rag.chain import initialize_rag_chain, create_rag_pipeline
from utils.cache import load_cache, save_cache, get_cache_key
from utils.file_utils import clear_upload_directory

load_dotenv()

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])


rag_chain = None
text_chunks = []
vectorstore = None

@app.route('/upload', methods=['POST'])
def upload_files():
    global rag_chain, vectorstore, text_chunks
    
    if 'files' not in request.files:
        return jsonify({"error": "No files part in the request."}), 400
    
    files = request.files.getlist('files')
    if not files or all(file.filename == '' for file in files):
        return jsonify({"error": "No files selected for uploading."}), 400

    clear_upload_directory(UPLOAD_DIR)

    successful_uploads = 0
    for file in files:
        if file and file.filename.endswith('.pdf'):
            filename = file.filename
            file.save(os.path.join(UPLOAD_DIR, filename))
            successful_uploads += 1
    
    if successful_uploads == 0:
        return jsonify({"error": "No valid PDF files uploaded."}), 400

    try:
        vectorstore, embeddings, text_chunks = process_and_store_documents(UPLOAD_DIR, VECTORSTORE_PATH)
        
 
        groq_api_key = os.environ.get("GROQ_API_KEY")
        rag_chain = create_rag_pipeline(vectorstore, text_chunks, embeddings, groq_api_key)
        
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