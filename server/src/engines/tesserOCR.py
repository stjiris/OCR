from tesserocr import PyTessBaseAPI
from tesserocr import PSM, OEM
from PIL import Image, ImageEnhance, ImageFilter

from src.utils.parse_hocr import parse_hocr


api = PyTessBaseAPI(init=False)


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
        config = {"lang": "por"}
        config["psm"] = PSM.SINGLE_BLOCK if segment_box else PSM.AUTO

    api.InitFull(
        lang=config.get("lang", "por"),
        oem=config.get("oem", OEM.DEFAULT),
        psm=config.get("psm", PSM.AUTO)
    )
    # TODO: receive other variables

    api.SetImage(page)
    if segment_box:
        if isinstance(segment_box, list):  # Batch multiple segments
            results = []
            for box in segment_box:
                coords = {
                    "left": box[0],
                    "top": box[1],
                    "width": box[2] - box[0],
                    "height": box[3] - box[1]
                }
                api.SetRectangle(**coords)
                hocr = api.GetHOCRText(0)
                results.append(parse_hocr(hocr, box))
            return results
        else:
            coords = {
                "left": segment_box[0],
                "top": segment_box[1],
                "width": segment_box[2] - segment_box[0],
                "height": segment_box[3] - segment_box[1]
            }
            api.SetRectangle(**coords)
            hocr = api.GetHOCRText(0)
    else:
        hocr = api.GetHOCRText(0)

    api.End()
    return parse_hocr(hocr, segment_box)
