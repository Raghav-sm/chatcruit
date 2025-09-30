import os
import json
import hashlib
from config import CACHE_PATH

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