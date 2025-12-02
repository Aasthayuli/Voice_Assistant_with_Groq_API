from flask import Flask, request
from werkzeug.datastructures import FileStorage
import os
from datetime import datetime

app = Flask(__name__)

UPLOAD_FOLDER = 'static/audio/uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/test', methods=['POST'])
def test_upload():
    file = request.files.get('audio')
    
    if not file:
        return "No file", 400
    
    # Save file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"test_{timestamp}.webm"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    
    print(f"Saving to: {os.path.abspath(filepath)}")
    
    file.save(filepath)
    
    # Check if saved
    if os.path.exists(filepath):
        size = os.path.getsize(filepath)
        return f"SUCCESS! File saved: {size} bytes at {filepath}", 200
    else:
        return "FAILED! File not found", 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)