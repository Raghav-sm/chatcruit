import os
os.environ["OMP_NUM_THREADS"] = "1"

UPLOAD_DIR = "uploaded_files"
VECTORSTORE_PATH = "vectorstore.pkl"
CACHE_PATH = "query_cache.json"
os.makedirs(UPLOAD_DIR, exist_ok=True)