from flask import Flask, request
from flask_cors import CORS # permitir requests de outros ips alem do servidor

from pdf2image import convert_from_path
from PIL import Image
import pytesseract

app = Flask(__name__)   # Aplicação em si
CORS(app)

@app.route("/submitFile", methods=["POST"])
def submitFile():
    # Can be an error (no file/extracting text) -> probably not
    try:
        # Obter ficheiro e guardar na pasta
        file = request.files['file']
        file.save("file_uploads/" + file.filename)

        file_basename = file.filename.split(".")[0]

        filename_txt = "file_extracted/" + file_basename + ".txt"

        # Obter o texto (Tesseract/etc)
        # De momento ainda 
        pages = convert_from_path("file_uploads/" + file.filename, 200)

        # Save each page individually
        # for id, page in enumerate(pages):
        #     page.save(f"file_uploads/{file_basename}_{id+1}.pdf", "PDF")

        text = pytesseract.image_to_string(pages[0], lang='por')

        with open(filename_txt, "w", encoding="utf-8") as f:
            f.write(text)

        # Enviar texto para o servidor
        return {"success": True, "text": text}

    except Exception as e:
        print(e)
        return {"success": False, "error": "[SUBMIT] Something went wrong"}

# Vamos para a parte de submeter o texto corrigido
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