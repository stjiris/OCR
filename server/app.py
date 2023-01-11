import os

from flask import Flask, request, escape
from flask_cors import CORS # permitir requests de outros ips alem do servidor

from src.utils.file import process_file, get_file_structure
from src.evaluate import evaluate

from src.algorithms import tesseract, easy_ocr
from src.elastic_search import *

# client = ElasticSearchClient(ES_URL, ES_INDEX, mapping, settings)

app = Flask(__name__)   # Aplicação em si
CORS(app)

#####################################
# FILE SYSTEM ROUTES
#####################################
@app.route("/files", methods=["GET"])
def get_file_system():
    return get_file_structure("./files/")

@app.route("/create-folder", methods=["POST"])
def create_folder():
    data = request.json
    print(data)
    path = data["path"]
    folder = data["folder"]

    if os.path.exists(path + "/" + folder):
        return {"success": False, "error": "That folder already exists"}

    os.mkdir(path + "/" + folder)

    return {"success": True, "files": get_file_structure("./files/")}

#####################################
# FILES ROUTES
#####################################
@app.route("/submitFile", methods=['POST'])
def submit_file():
    import os

    data = request.json
    fileHex = data["file"]
    file = data["filename"]
    filename = file.split(".")[0]
    page = data["page"]
    algorithm = data["algorithm"]
    config = data["config"]
    path = data["path"]

    if not os.path.exists(f"{path}/{file}"):
        os.mkdir(f"{path}/{file}")

    with open(f"{path}/{file}/{filename}_{page}.pdf", "wb") as f:
        f.write(bytes.fromhex(fileHex))

    if algorithm == "Tesseract":
        text = process_file(file, page, config, path, tesseract.get_text)
    elif algorithm == "EasyOCR":
        text = process_file(file, page, config, path, easy_ocr.get_text)

    os.remove(f"{path}/{file}/{filename}_{page}.pdf")
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

        # client.add_document(create_document(filename.split(".")[0], id + 1, t))
    
    return {"success": True}

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, threaded=True, debug=True)