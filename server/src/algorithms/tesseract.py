import pytesseract

def get_text(pages):
    """
    Parse the pages of a PDF file

    @param pages: pages of the PDF file
    """
    return pytesseract.image_to_string(pages[0], lang='por')