import os, re, time, json
from pdf2image import convert_from_path
from PyPDF2 import PdfFileReader
from PIL import Image
from os import environ

from src.utils.text import clear_text

IMAGE_PREFIX = environ.get('IMAGE_PREFIX', '.')
##################################################
# FILESYSTEM UTILS
##################################################

# Current file system structure
# files
# - folder1
#   - filename.(pdf/png/jpg/...)
#       - filename.(pdf/png/jpg/...)    (the original submitted file)
#       - filename_extracted.txt        (the text extracted initially)
#       - filename_changes.txt          (the text changed by the user)
#       - conf.txt                      (the conf file of the OCR engine used)
# - folder2

def get_file_parsed(path):
    """
    Return the text off all the pages of the file

    :param path: path to the file
    :return: list with the text of each page
    """
    files = [f"{path}/{f}" for f in os.listdir(path) if os.path.isfile(os.path.join(path, f)) and ".txt" in f and "Text.txt" not in f]

    data = []
    for file in files:
        basename = get_file_basename(file)
        with open(file, encoding="utf-8") as f:
            data.append({
                "original_file": file,
                "content": f.read(),
                "page_url": IMAGE_PREFIX + "/images/" + '/'.join(file.split("/")[1:-2]) + "/" + basename + ".jpg",
            })
    return data

def generate_uuid(path):
    import uuid, random
    random.seed(path)
    return str(uuid.UUID(bytes=bytes(random.getrandbits(8) for _ in range(16)), version=4))

def delete_structure(client, path):
    """
    Delete all the files in the structure
    """
    data = get_data(path + "/_data.json")
    if data["type"] == "ocr" and data["indexed"]:
        files = [f"{path}/{f}" for f in os.listdir(path) if f.endswith(".txt")]
        for file in files:
            id = generate_uuid(file)
            client.delete_document(id)

    else:
        folders = [f"{path}/{f}" for f in os.listdir(path) if os.path.isdir(f"{path}/{f}")]
        for folder in folders:
            delete_structure(client, folder)

def get_filesystem(path):
    """
	@@ -106,7 +101,7 @@ def get_filesystem(path):
    @param path: path to the folder
    """
    files = get_structure(path)
    info = get_structure_info(path)

    return {**files, 'info': info}

def get_creation_time(path):
    """
    Get the creation time of the file/folder

    :param path: path to the file/folder
    :return: creation time
    """

    ti_c = os.path.getctime(path)
    c_ti = time.ctime(ti_c)
    t_obj = time.strptime(c_ti)
    c_time = time.strftime("%Y-%m-%d %H:%M:%S", t_obj)
    return c_time

def get_modification_time(path):
    """
    Get the modification time of the file/folder

    :param path: path to the file/folder
    :return: modification time
    """

    ti_m = os.path.getmtime(path)
    m_ti = time.ctime(ti_m)
    t_obj = time.strptime(m_ti)
    m_time = time.strftime("%Y-%m-%d %H:%M:%S", t_obj)
    return m_time

def get_size(path):
    """
    Get the size of the file

    :param path: path to the file
    :return: size of the file
    """

    name = path.split("/")[-1]
    path = f"{path}/{name}"

    size = os.path.getsize(path)

    if size < 1024: return f"{size} B"
    elif size < 1024 ** 2: return f"{size / 1024:.2f} KB"
    elif size < 1024 ** 3: return f"{size / 1024 ** 2:.2f} MB"
    else: return f"{size / 1024 ** 3:.2f} GB"

def get_structure_info(path):
    """
    Get the info of each file/folder
    @param files: the filesystem structure
    """
    info = {}

    for root, folders, _ in os.walk(path):
        for folder in folders:
            folder_path = f"{root}/{folder}".replace("\\", "/")

            data = get_data(f"{folder_path}/_data.json")
            path_info = {"creation_date": get_creation_time(folder_path), "last_modified": get_modification_time(folder_path)}
            path_info.update(data)

            if data["type"] == "file": path_info["size"] = get_size(folder_path)

            info[folder_path] = path_info

    return info

def get_structure(path):
    """
    Put the file system structure in a dict
    {
        'files': [
            {
                'folder1': ['file.pdf']
            },
            {
                'folder2': []
            }
        ]
    }

    :param path: the path to the files
    """
    filesystem = {}
    name = path.split("/")[-1]

    if path != "files":
        data = get_data(f"{path}/_data.json")
        if data["type"] == "file": return name

    contents = []
    folders = sorted([f for f in os.listdir(path) if os.path.isdir(f"{path}/{f}")])
    for folder in folders:
        file = get_structure(f"{path}/{folder}")
        contents.append(file)

    filesystem[name] = contents
    return filesystem

##################################################
# FILES UTILS
##################################################
def get_page_count(filename):
    """
    Get the number of pages of a file
    """

    extension = filename.split(".")[-1]
    if extension == "pdf":
        return PdfFileReader(open(filename, "rb")).getNumPages()
    elif extension in ["jpg", "jpeg"]:
        return 1

def get_file_basename(filename):
    """
    Get the basename of a file

    :param file: file name
    :return: basename of the file
    """
    return '.'.join(filename.split("/")[-1].split(".")[:-1])

def get_pdf_pages(file):
    """
    Get the pages of a PDF file

    :param pdf_file: path to the PDF file
    :return: pages as PIL images
    """
    return convert_from_path(file, 200)

def save_text_file(text, path):
    """
    Save a text file
    @param text: text to save
    @param path: path of the file
    """
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)

##################################################
# OCR UTILS
##################################################
def get_data(file):
    with open(file, encoding="utf-8") as f:
        return json.load(f)

def update_data(file, data):
    """
    Update the data file
    @param file: path to the data file
    @param data: data to update
    """

    previous_data = get_data(file)
    with open(file, "w", encoding="utf-8") as f:
        previous_data.update(data)
        json.dump(previous_data, f)

def prepare_file_ocr(path):
    """
    Prepare the OCR of a file
    @param path: path to the file
    @param ocr_folder: folder to save the results
    """

    extension = path.split(".")[-1]
    basename = get_file_basename(path)

    if extension == "pdf":
        pages = convert_from_path(f"{path}/{basename}.pdf", 200)
        for i, page in enumerate(pages):
            page.save(f"{path}/{basename}_{i}.jpg", "JPEG")

    elif extension in ["jpeg", "jpg"]:
        img = Image.open(f"{path}/{basename}.{extension}")
        img.save(f"{path}/{basename}.jpg", "JPEG")

def perform_file_ocr(path, ocr_folder, config, ocr_algorithm):
    """
    Prepare the OCR of a file
    @param path: path to the file
    @param ocr_folder: folder to save the results
    @param data: data to use
    @param ocr_algorithm: algorithm to use
    """

    algorithm = "Tesseract" if ocr_folder.startswith("TESS") else "EasyOCR"
    prepare_file_ocr(path)

    images = sorted([x for x in os.listdir(path) if x.endswith(".jpg")])

    data_folder = f"{path}/{ocr_folder}/_data.json"

    for id, image in enumerate(images):
        text = clear_text(ocr_algorithm(Image.open(f"{path}/{image}"), config))
        save_text_file(text, f"{path}/{ocr_folder}/{get_file_basename(image)}.txt")
        update_data(data_folder, {"progress": int((id + 1) / len(images) * 100)})