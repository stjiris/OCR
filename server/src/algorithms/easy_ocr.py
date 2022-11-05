import easyocr
import numpy as np

def get_text(pages):
    """
    Get the text from a list of pages

    @param pages: list of pages
    """
    return ' '.join(easyocr.Reader(['pt']).readtext(np.array(pages[0]), detail=0))