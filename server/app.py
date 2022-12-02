import os

from flask import Flask, request, escape
from flask_cors import CORS # permitir requests de outros ips alem do servidor

from src.utils.file import process_file
from src.evaluate import evaluate

from src.algorithms import tesseract, easy_ocr
from src.elastic_search import ElasticSearchClient, create_document

ES_URL = 'http://localhost:9200/'
ES_INDEX = "jornais.0.1"

settings = {
    "analysis": {
        "normalizer": {
            "term_normalizer": {
                "type": 'custom',
                "filter": ['lowercase', 'asciifolding']
            }
        }
    },
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "max_result_window": 550000
}

mapping = {
    "properties": {
        "Id": {
            "type": "keyword",
            "normalizer": "term_normalizer"
        },
        "Jornal": {
            "type": 'text',
            "fields": {
                "raw": {
                    "type": "keyword"
                },
                "keyword": {
                    "type": "keyword",
                    "normalizer": "term_normalizer"
                }
            }
        },
        "Page": {
            "type": 'integer',
            "fields": {
                "raw": {
                    "type": "keyword"
                },
                "keyword": {
                    "type": "keyword",
                    "normalizer": "term_normalizer"
                }
            }
        },
        "Text": {
            "type": 'text',
            "fields": {
                "raw": {
                    "type": "keyword"
                },
                "keyword": {
                    "type": "keyword",
                    "normalizer": "term_normalizer"
                }
            }
        },
        "Imagem Página": {
            "enabled": False
        },
    }
}

client = ElasticSearchClient(ES_URL, ES_INDEX, mapping, settings)

app = Flask(__name__)   # Aplicação em si
CORS(app)

@app.route("/submitFile", methods=['POST'])
def submit_file():
    import os

    data = request.json
    fileHex = data["file"]
    filename = data["filename"].split(".")[0]
    page = data["page"]
    algorithm = data["algorithm"]

    with open(f"file_uploads/{filename}_{page}.pdf", "wb") as f:
        f.write(bytes.fromhex(fileHex))

    if algorithm == "Tesseract":
        text = process_file(filename, page, tesseract.get_text)
    elif algorithm == "Pero-OCR":
        return {"success": False, "error": "[SUBMIT] Something went wrong"}
    elif algorithm == "EasyOCR":
        text = process_file(filename, page, easy_ocr.get_text)

    os.remove(f"file_uploads/{filename}_{page}.pdf")
    return {"file": data["filename"], "page": page, "text": text, "score": 0}

@app.route("/submitText", methods=["POST"])
def submitText():
    texts = request.json["text"] # texto corrigido
    filename = request.json['filename'] # nome do pdf original

    for id, t in enumerate(texts):
        print("Saving page:", (id + 1))
        filename_txt = f"file_fixed/{filename.split('.')[0]}_{(id + 1)}.txt"

        with open(filename_txt, "w", encoding="utf-8") as f:
            f.write(t)

        client.add_document(create_document(filename.split(".")[0], id + 1, t))
    
    return {"success": True}

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, threaded=True, debug=True)