import pytesseract

from src.utils.parse_hocr import parse_hocr



def _get_segment_hocr(page, lang: str, config_str: str, segment_coordinates):
    cropped_image = page.crop(segment_coordinates)
    return pytesseract.image_to_pdf_or_hocr(
        cropped_image, lang=lang, extension="hocr", config=config_str
    )


def _get_hocr(page, lang: str, config_str: str):
    return pytesseract.image_to_pdf_or_hocr(
        page, lang=lang, extension="hocr", config=config_str
    )




def get_structure(page, lang: str = 'por', config_str: str = '', segment_box=None):
    if segment_box:
        hocr_original = _get_segment_hocr(page, lang, config_str, segment_box)
    else:
        hocr = get_hocr(page, config)
    return parse_hocr(hocr, segment_box)


def polyval(poly, x):
    return x * poly[0] + poly[1]
