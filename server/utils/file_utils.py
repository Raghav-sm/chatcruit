import os
import shutil
from config import UPLOAD_DIR

def clear_upload_directory(upload_dir):
    if os.path.exists(upload_dir):
        shutil.rmtree(upload_dir)
    os.makedirs(upload_dir)