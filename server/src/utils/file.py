from pdf2image import convert_from_path

from src.utils.text import clear_text

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
    return filename.split(".")[0]

def get_pdf_pages(file):
    """
    Get the pages of a PDF file

    @param pdf_file: path to the PDF file
    """
    return convert_from_path(file, 200)

def save_text_file(text, basename):
    """
    Save a text file

    @param text: text to save
    @param filename: name of the file
    """
    with open(f"file_extracted/{basename}.txt", "w", encoding="utf-8") as f:
        f.write(text)

def process_file(file, pageNumber, algorithm):
    """
    Process a file, extract the text and save the results

    @param file: file to process
    @param algorithm: algorithm to use
    """
    # save_pdf_full(file)

    # filename = file.filename
    basename = get_file_basename(file)
    pages = get_pdf_pages(f"file_uploads/{file}_{pageNumber}.pdf")

    # text = ""

    for id, page in enumerate(pages):
        print("Processing page", pageNumber)
        page.save(f"file_uploads/{basename}_{pageNumber}.jpg", "JPEG")
        text = clear_text(algorithm(page))
        save_text_file(text, basename + "_" + str(pageNumber))

    return text