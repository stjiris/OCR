import easyocr
import numpy as np

def get_text(page):
    """
    Get the text from a list of pages

    @param pages: list of pages
    """
    return ' '.join(easyocr.Reader(['pt']).readtext(np.array(page), detail=0))