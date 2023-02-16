import os, re, time, json
from pdf2image import convert_from_path
from PyPDF2 import PdfMerger

from src.utils.text import clear_text
from src.elastic_search import create_document

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

def get_original_file(path):
    basename = os.path.basename(path).split('.')[0]
    filename = f"{path}/{basename}.pdf"

    files = [os.path.join(path, f) for f in os.listdir(path) if os.path.isfile(os.path.join(path, f)) and ".pdf" in f]
    files = sorted(
        files,
        key=lambda x: int(re.findall('\d+', x)[-1])
    )

    merger = PdfMerger()
    for pdf in files:
        merger.append(pdf)

    merger.write(filename)
    merger.close()

    return filename

def get_txt_file(path):
    basename = os.path.basename(path).split('.')[0]
    filename = f"{path}/{basename}-Text.txt"

    files = [os.path.join(path, f) for f in os.listdir(path) if os.path.isfile(os.path.join(path, f)) and ".txt" in f and "Text.txt" not in f]

    if len(files) > 1:
        files = sorted(
            files,
            key=lambda x: int(re.findall('\d+', x)[-1])
        )

    with open(filename, "w", encoding="utf-8") as f:
        for id, file in enumerate(files):

            with open(file, encoding="utf-8") as _f:
                f.write(f"----- PAGE {(id+1):04d} -----\n\n")
                f.write(_f.read().strip() + "\n\n")

    return filename

def get_file_parsed(path):
    files = [os.path.join(path, f) for f in os.listdir(path) if os.path.isfile(os.path.join(path, f)) and ".txt" in f and "Text.txt" not in f]

    if len(files) > 1:
        files = sorted(
            files,
            key=lambda x: int(re.findall('\d+', x)[-1])
        )

    contents = []
    for file in files:
        with open(file, encoding="utf-8") as f:
            contents.append(f.read())

    return contents

def delete_structure(client, structure, path):
    """
    Delete all the files in the structure
    structure = {"files": [{"folder2": ["file2"]}, "file1"]}
    """
    if type(structure) == str:
        extension = structure.pop(".")[-1]
        path = f"{path}/{structure}"
        basename = get_file_basename(structure)

        if extension in ["pdf"]:
            pages = set([re.findall("\d+", f)[-1] for f in os.listdir(path) if f".{extension}" in f])
            for page in pages:
                print(f"Deleting {path}/{basename}_{page}.pdf...")
                client.delete_document(f"{path}/{basename}_{page}.pdf")
        else:
            print(f"Deleting {path}/{structure}...")
            client.delete_document(f"{path}/{structure}")
        return

    for key, value in structure.items():
        for item in value:
            delete_structure(client, item, f"{path}/{key}")

def get_filesystem(path):
    """
    Get the filesystem structure and information of each file/folder

    @param path: path to the folder
    """
    files = get_structure(path)
    info = get_info(files)
    return {**files, 'info': info}

def get_creation_time(path):
    """
    Get the creation time of the file/folder

    @param path: path to the file/folder
    """

    ti_c = os.path.getctime(path)
    c_ti = time.ctime(ti_c)
    t_obj = time.strptime(c_ti)
    c_time = time.strftime("%Y-%m-%d %H:%M:%S", t_obj)
    return c_time

def get_modification_time(path):
    """
    Get the modification time of the file/folder

    @param path: path to the file/folder
    """

    ti_m = os.path.getmtime(path)
    m_ti = time.ctime(ti_m)
    t_obj = time.strptime(m_ti)
    m_time = time.strftime("%Y-%m-%d %H:%M:%S", t_obj)
    return m_time

def get_size(path):
    """
    Get the size of the file

    @param path: path to the file
    """

    extension = path[path.rfind(".") + 1:]
    files = [
        os.path.join(path, f) for f in os.listdir(path)
        if os.path.isfile(os.path.join(path, f)) and extension in f[-len(extension):]
    ]

    size = 0
    for file in files:
        size += os.path.getsize(file)

    if size < 1024: return f"{size} B"
    elif size < 1024 ** 2: return f"{size / 1024:.2f} KB"
    elif size < 1024 ** 3: return f"{size / 1024 ** 2:.2f} MB"
    else: return f"{size / 1024 ** 3:.2f} GB"

def get_info(files, current_path="", info={}):
    """
    Get the info of each file/folder

    @param files: the filesystem structure
    """

    if type(files) == dict:
        key = list(files.keys())[0]
        path = f"{current_path}/{key}" if current_path != "" else key

        creation_date = get_creation_time(path)
        modification_date = get_modification_time(path)

        data = {
            "creation_date": creation_date,
            "last_modified": modification_date,
            "number_of_files": 0
        }

        for item in files[key]:
            item_data = get_info(item, path)

            if "number_of_files" in item_data:
                data["number_of_files"] += item_data["number_of_files"]
            else:
                data["number_of_files"] += 1

        if path != "files":
            info[path] = data
            return data
        return info

    else:
        path = f"{current_path}/{files}"

        creation_date = get_creation_time(path)
        modification_date = get_modification_time(path)
        size = get_size(path)

        with open(path + "/_config.json") as f:
            data = json.load(f)
            progress = data["progress"]

        print(f"Getting info of {path}...", progress)

        data = {
            "creation_date": creation_date,
            "last_modified": modification_date,
            "size": size,
            "progress": progress
        }

        info[path] = data

        return data

def get_structure(path):
    """
    Put the file system structure in a dict
    {
        'info': {
            'files/folder1': {
                'creation_date': '2021-05-05 12:00:00',
                'last_modified': '2021-05-05 15:00:00',
                'number_of_files': 1
            },
            'files/folder2': {
                'creation_date': '2021-05-05 12:00:00',
                'last_modified': '2021-05-05 15:00:00',
                'number_of_files': 0
            },
            'files/folder1/file.pdf': {
                'creation_date': '2021-05-05 15:00:00',
                'last_modified': '2021-05-05 15:00:00',
                'size': 10 KB
            }
        },
        'files': [
            {
                'folder1': ['file.pdf']
            },
            {
                'folder2': []
            }
        ]
    }
    """
    filesystem = {}
    last_folder = path.split("/")[-2]

    folders = sorted([x for x in os.listdir(path) if os.path.isdir(f"{path}{x}/")])
    files = [x for x in os.listdir(path) if not os.path.isdir(f"{path}{x}/")]

    if not folders and files:
        if path == "./files/":
            return {"files": [], "info": {}}
        return last_folder
    
    contents_folders = []
    contents_files = []
    
    for folder in folders:
        file = get_structure(f"{path}{folder}/")

        if type(file) == str:
            contents_files.append(file)
        else:
            contents_folders.append(file)

    filesystem[last_folder] = contents_folders + contents_files
    return filesystem

##################################################
# FILES UTILS
##################################################
def save_pdf_full(file):
    """
    Save the full PDF file

    @param pdf_file: path to the PDF file
    """
    file.save(f"file_uploads/{file.filename}")

def get_file_basename(filename):
    """
    Get the basename of a file

    @param file: file name
    """
    return '.'.join(filename.split("/")[-1].split(".")[:-1])

def get_pdf_pages(file):
    """
    Get the pages of a PDF file

    @param pdf_file: path to the PDF file
    """
    return convert_from_path(file, 200)

def save_text_file(text, basename, path):
    """
    Save a text file

    @param text: text to save
    @param filename: name of the file
    """
    with open(f"{path}/{basename}.txt", "w", encoding="utf-8") as f:
        f.write(text)

def parse_file(process_function, filename, arg, config, path, ocr_algorithm, es_client):
    """
    Function that will be used by the threads to process the files

    @param process_function: function to process the files
    @param filename: name of the file
    @param arg: argument to pass to the function (PIL image or PDF page number)
    @param config: config to pass to the function
    @param path: path to the file
    """

    basename = '.'.join(os.path.basename(filename).split(".")[:-1])
    extension = os.path.basename(filename).split(".")[-1]

    text = process_function(filename, arg, config, path, ocr_algorithm)
    es_client.add_document(create_document(f"{path}/{filename}/{basename}", extension, text, arg if type(arg) == int else None))

    if type(arg) == int:
        print("----- Processing page", arg, "of", filename)
        files = os.listdir(f"{path}/{filename}")
        original_files = [x for x in files if x.endswith(extension)]
        processed_files = [x for x in files if x.endswith("txt")]

        #? Still needs this if? Probably fixed with the path fixes
        progress = 100 * len(processed_files) / len(original_files) if len(original_files) > 0 else 0

        print("-----", len(processed_files), "of", len(original_files), "processed", progress)

        with open(f"{path}/{filename}/_config.json") as f:
            data = json.load(f)
            data["progress"] = int(progress)

        with open(f"{path}/{filename}/_config.json", "w") as f:
            json.dump(data, f)

def process_image(filename, image, config, path, algorithm):
    """
    Process an image, extract the text and save the results

    @param image: image to process
    @param algorithm: algorithm to use
    """
    basename = get_file_basename(filename)

    text = clear_text(algorithm(image, config))
    save_text_file(text, basename, f"{path}/{filename}")
    return text

def process_file(file, pageNumber, config, path, algorithm):
    """
    Process a file, extract the text and save the results

    @param file: file to process
    @param algorithm: algorithm to use
    """
    filename = file.split(".")[0]
    basename = get_file_basename(filename)
    pages = get_pdf_pages(f"{path}/{file}/{basename}_{pageNumber}.pdf")

    for page in pages:
        page = page.crop((0, 0, page.size[0], page.size[1] - 120))
        page.save(f"{path}/{file}/{basename}_{pageNumber}.jpg", "JPEG")
        text = clear_text(algorithm(page, config))
        save_text_file(text, basename + "_" + str(pageNumber), f"{path}/{file}")

    return text