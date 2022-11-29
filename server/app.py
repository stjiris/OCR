from flask import Flask, request, escape
from flask_cors import CORS # permitir requests de outros ips alem do servidor
# from flask_socketio import SocketIO, emit

from src.utils.file import process_file
from src.evaluate import evaluate

# import logging

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

# logging.getLogger('werkzeug').setLevel(logging.ERROR)
# logging.getLogger('eventlet').setLevel(logging.ERROR)

app = Flask(__name__)   # Aplicação em si
CORS(app)
# socketio = SocketIO(app, cors_allowed_origins='*')    # Socket para comunicação com o front-end

# @socketio.on("json")
# def handle_json(json):
#     print("received message: " + str(json))

@app.route("/")
def hello():
    return "Hello World!"

@app.route('/submitFile/<algorithm>', methods=['POST'])
def submit_file(algorithm):
    algorithm = escape(algorithm)
    file = request.files['file']

    if algorithm == "Tesseract":
        pages_text = process_file(file, tesseract.get_text)
    elif algorithm == "Pero-OCR":
        return {"success": False, "error": "[SUBMIT] Something went wrong"}
    elif algorithm == "EasyOCR":
        pages_text = process_file(file, easy_ocr.get_text)

    return {"success": True, "text": pages_text, "score": 0}

@app.route("/submitText", methods=["POST"])
def submitText():
    # try:
    texts = request.json["text"] # texto corrigido
    filename = request.json['filename'] # nome do pdf original

    for id, t in enumerate(texts):
        print("Saving page:", (id + 1))
        filename_txt = f"file_fixed/{filename.split('.')[0]}_{(id + 1)}.txt"

        with open(filename_txt, "w", encoding="utf-8") as f:
            f.write(t)

        client.add_document(create_document(filename.split(".")[0], id + 1, t))
    
    return {"success": True}
    # except Exception as e:
    #     return {"success": False, "error": "[FIXING] Something went wrong"}

if __name__ == "__main__":
    # socketio.run(app, host='0.0.0.0', port=5000, debug=True)
    app.run(host='0.0.0.0', port=5001, debug=True)