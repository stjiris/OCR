import os, json, shutil, re

from flask import Flask, request, send_file
from flask_cors import CORS # permitir requests de outros ips alem do servidor

from src.utils.file import (
    process_file,
    get_file_structure,
    get_file_parsed,
    get_txt_file,
    get_original_file
)

from src.evaluate import evaluate

from src.algorithms import tesseract, easy_ocr
from src.elastic_search import *

client = ElasticSearchClient(ES_URL, ES_INDEX, mapping, settings)

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

@app.route("/file-exists", methods=["GET"])
def file_exists():
    data = request.values
    path = data["path"]
    file = data["file"]

    if os.path.exists(f"{path}/{file}"):
        return {"success": False, "error": "There is a file with that name already"}
    else:
        return {"success": True}

@app.route("/get-file", methods=["GET"])
def get_file():
    path = request.values["path"]

    pages = get_file_parsed(path)

    return {"contents": pages}

@app.route("/get_txt", methods=["GET"])
def get_txt():
    path = request.values["path"]
    file = get_txt_file(path)
    return send_file(file)

@app.route("/get_original", methods=["GET"])
def get_original():
    path = request.values["path"]
    file = get_original_file(path)
    return send_file(file)

@app.route("/delete-path", methods=["POST"])
def delete_path():
    data = data = request.json
    path = data["path"]

    basename = path.split("/")[-1].split(".")[0]

    print(path)

    docs = [f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f)) and ".txt" in f and "Text.txt" not in f]
    pages = set([re.findall("\d+", f)[-1] for f in docs])

    for p in pages:
        client.delete_document(f"{path}/{basename}_{p}")

    shutil.rmtree(path, ignore_errors=True)

    return {"success": True, "message": "Deleted with success", "files": get_file_structure("./files/")}

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

    if os.path.exists(f"{path}/{file}/{filename}_{page}.txt"): return {"success": False, "error": "There is a file with that name already"}
    if not os.path.exists(f"{path}/{file}"):    
        os.mkdir(f"{path}/{file}")

    with open(f"{path}/{file}/{filename}_{page}.pdf", "wb") as f:
        f.write(bytes.fromhex(fileHex))

    if algorithm == "Tesseract":
        text = process_file(file, page, config, path, tesseract.get_text)
    elif algorithm == "EasyOCR":
        text = process_file(file, page, config, path, easy_ocr.get_text)

    with open(f"{path}/{file}/_config.json", "w") as f:
        json.dump({
            "algorithm": algorithm,
            "config": config
        }, f)

    client.add_document(create_document(f"{path}/{file}/{filename}", page, text))

    return {"success": True, "file": data["filename"], "page": page, "text": text, "score": 0, "files": get_file_structure("./files/")}

@app.route("/submitText", methods=["POST"])
def submitText():
    texts = request.json["text"] # texto corrigido
    filename = request.json['filename'] # nome do pdf original

    basename = os.path.basename(filename)

    for id, t in enumerate(texts):
        print("Saving page:", (id + 1))
        filename_txt = f"{filename}/{basename.split('.')[0]}_{(id + 1)}.txt"

        with open(filename_txt, "w", encoding="utf-8") as f:
            f.write(t)

        client.update_document(f"{filename}/{basename.split('.')[0]}_{(id + 1)}", t)
    
    return {"success": True}

#####################################
# ELASTICSEARCH
#####################################
@app.route("/get_elasticsearch", methods=["GET"])
def get_elasticsearch():
    return client.get_docs()

if __name__ == "__main__":
    if not os.path.exists("./files/"):
        os.mkdir("./files/")
                
    app.run(host='0.0.0.0', port=5001, threaded=True, debug=True)