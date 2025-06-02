import pytesseract

from src.utils.parse_hocr import parse_hocr


def get_segment_hocr(page, config, segment_coordinates):
    cropped_image = page.crop(segment_coordinates)
    return pytesseract.image_to_pdf_or_hocr(
        cropped_image, lang="por", extension="hocr", config="+".join(config)
    )

def get_hocr(page, config):
    """
    Get the hocr of a page

    :param page: page to get the hocr from
    :param config: config to use
    :return: hocr
    """
    return pytesseract.image_to_pdf_or_hocr(
        page, lang="por", extension="hocr", config="+".join(config)
    )


def get_structure(page, config, segment_box=None):
    if segment_box:
        hocr = get_segment_hocr(page, config, segment_box)
    else:
        hocr = get_hocr(page, config)
    return parse_hocr(hocr, segment_box)


def polyval(poly, x):
    return x * poly[0] + poly[1]
