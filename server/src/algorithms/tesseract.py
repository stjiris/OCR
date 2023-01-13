import pytesseract

def get_text(page, config):
    """
    Get the text from a list of pages

    @param pages: pages of the PDF file
    """
    return pytesseract.image_to_string(page, lang=config)