from flask import Flask, request
from flask_cors import CORS # permitir requests de outros ips alem do servidor

from src.utils.file import process_file
from src.evaluate import evaluate

from src.algorithms import tesseract, easy_ocr

app = Flask(__name__)   # Aplicação em si
CORS(app)

@app.route('/submitFile/Tesseract', methods=['POST'])
def submit_file_tesseract():
    try:
        file = request.files['file']
        text = process_file(file, tesseract.get_text)
        return {"success": True, "text": text, "score": 0}
    except:
        return {"success": False, "error": "[SUBMIT] Something went wrong"}

@app.route('/submitFile/Pero-OCR', methods=['POST'])
def submit_file_pero_ocr():
    try:
        file = request.files['file']
        # text = process_file(file, pero_ocr.get_text)
        text = "Pero OCR"
        return {"success": True, "text": text, "score": 0}
    except:
        return {"success": False, "error": "[SUBMIT] Something went wrong"}

@app.route('/submitFile/EasyOCR', methods=['POST'])
def submit_file_easy_ocr():
    # try:
    file = request.files['file']
    text = process_file(file, easy_ocr.get_text)
    return {"success": True, "text": text, "score": 0}
    # except Exception as e:
        # print(e)
        # return {"success": False, "error": "[SUBMIT] Something went wrong"}

@app.route("/submitText", methods=["POST"])
def submitText():
    try:
        text = request.json["text"] # texto corrigido
        filename = request.json['filename'] # nome do pdf original

        filename_txt = "file_fixed/" + filename.split(".")[0] + ".txt"

        with open(filename_txt, "w", encoding="utf-8") as f:
            f.write(text)
        
        return {"success": True}
    except:
        return {"success": False, "error": "[FIXING] Something went wrong"}

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)