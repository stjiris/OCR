from flask import Flask, request, escape
from flask_cors import CORS # permitir requests de outros ips alem do servidor

from src.utils.file import process_file
from src.evaluate import evaluate

from src.algorithms import tesseract, easy_ocr
from src.elastic_search import ElasticSearchClient, create_document

ES_URL = 'http://localhost:9200/'
ES_INDEX = "jornais.0.1"

mapping = {
    "properties": {
        "Id": {
            "type": "keyword"
        },
        "Jornal": {
            "type": "keyword"
        },
        "Page": {
            "type": "integer"
        },
        "Text": {
            "type": "keyword"
        },
        "Imagem Página": {
            "enabled": False
        },
    }
}

client = ElasticSearchClient(ES_URL, ES_INDEX, mapping)

app = Flask(__name__)   # Aplicação em si
CORS(app)

@app.route('/submitFile/<algorithm>', methods=['POST'])
def submit_file(algorithm):
    algorithm = escape(algorithm)
    file = request.files['file']

    if algorithm == "Tesseract":
        text = process_file(file, tesseract.get_text)
    elif algorithm == "Pero-OCR":
        return {"success": False, "error": "[SUBMIT] Something went wrong"}
    elif algorithm == "EasyOCR":
        text = process_file(file, easy_ocr.get_text)

    return {"success": True, "text": text, "score": 0}

@app.route("/submitText", methods=["POST"])
def submitText():
    try:
        text = request.json["text"] # texto corrigido
        filename = request.json['filename'] # nome do pdf original

        filename_txt = "file_fixed/" + filename.split(".")[0] + ".txt"

        with open(filename_txt, "w", encoding="utf-8") as f:
            f.write(text)

        client.add_document(create_document(filename.split(".")[0], 1, text))
        
        return {"success": True}
    except:
        return {"success": False, "error": "[FIXING] Something went wrong"}

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)