from tesserocr import PyTessBaseAPI, PSM
from PIL import Image, ImageEnhance, ImageFilter

from src.utils.parse_hocr import parse_hocr


def preprocess_image(image):
    # Downscale to 200 DPI (assuming 300 DPI input)
    image = image.resize((int(image.width * 0.67), int(image.height * 0.67)), Image.Resampling.LANCZOS)
    # Convert to grayscale, enhance contrast, and binarize
    image = image.convert("L")
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)
    image = image.filter(ImageFilter.MedianFilter())  # Noise removal
    image = image.point(lambda p: 255 if p > 128 else 0)  # Binarization
    return image


def get_segment_hocr(page, config, segment_coordinates):
    """
    Get the HOCR for a specific segment of the page.

    :param page: The PIL image of the page.
    :param config: OCR configuration options (dict).
    :param segment_coordinates: Tuple of (left, top, right, bottom) for the segment box.
    :return: HOCR string for the segment.
    """
    # Ensure config is a dict, use defaults if not
    if not isinstance(config, dict):
        config = {"psm": PSM.SINGLE_BLOCK, "lang": "por"}
    with PyTessBaseAPI(psm=config.get("psm", PSM.SINGLE_BLOCK), lang=config.get("lang", "por"), oem=1) as api:
        api.SetImage(page)
        api.SetRectangle(*segment_coordinates)
        hocr = api.GetHOCRText(0)
    return hocr


def get_hocr(page, config):
    """
    Get the HOCR of an entire page.

    :param page: The PIL image of the page.
    :param config: OCR configuration options (dict).
    :return: HOCR string for the page.
    """
    # Ensure config is a dict, use defaults if not
    if not isinstance(config, dict):
        config = {"psm": PSM.SINGLE_BLOCK, "lang": "por"}
    with PyTessBaseAPI(psm=config.get("psm", PSM.SINGLE_BLOCK), lang=config.get("lang", "por"), oem=1) as api:
        api.SetImage(page)
        hocr = api.GetHOCRText(0)
    return hocr


def get_structure(page, config, segment_box=None):
    """
    Extract text and layout structure from a page or a segment.

    :param page: The PIL image of the page.
    :param config: OCR configuration options (dict).
    :param segment_box: Optional bounding box for a segment (left, top, right, bottom) or list of boxes.
    :return: Extracted text structure in the form of lines and words.
    """
    # Preprocess the image
    page = preprocess_image(page)
    
    # Ensure config is a dict, use defaults if not
    if not isinstance(config, dict):
        config = {"psm": PSM.SINGLE_BLOCK, "lang": "por"}

    with PyTessBaseAPI(psm=config.get("psm", PSM.SINGLE_BLOCK), lang=config.get("lang", "por"), oem=1) as api:
        api.SetImage(page)
        if segment_box:
            if isinstance(segment_box, list):  # Batch multiple segments
                results = []
                for box in segment_box:
                    api.SetRectangle(*box)
                    hocr = api.GetHOCRText(0)
                    results.append(parse_hocr(hocr, box))
                return results
            else:
                api.SetRectangle(*segment_box)
                hocr = api.GetHOCRText(0)
        else:
            hocr = api.GetHOCRText(0)
        return parse_hocr(hocr, segment_box)
