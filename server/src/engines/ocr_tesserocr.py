from PIL import Image
from PIL import ImageEnhance
from PIL import ImageFilter
from src.utils.enums_tesseract import ENGINE_MODES
from src.utils.enums_tesseract import LANGS
from src.utils.enums_tesseract import OUTPUTS
from src.utils.enums_tesseract import SEGMENT_MODES
from src.utils.enums_tesseract import THRESHOLD_METHODS
from src.utils.parse_hocr import parse_hocr
from tesserocr import OEM
from tesserocr import PSM
from tesserocr import PyTessBaseAPI

api = PyTessBaseAPI(init=False)


INT_TO_OEM = {  # Cannot directly convert int to OEM due to TesserOCR _Enum type
    0: OEM.TESSERACT_ONLY,
    1: OEM.LSTM_ONLY,
    2: OEM.TESSERACT_LSTM_COMBINED,
    3: OEM.DEFAULT,
}

INT_TO_PSM = {  # Cannot directly convert int to PSM due to TesserOCR _Enum type
    0: PSM.OSD_ONLY,
    1: PSM.AUTO_OSD,
    2: PSM.AUTO_ONLY,
    3: PSM.AUTO,
    4: PSM.SINGLE_COLUMN,
    5: PSM.SINGLE_BLOCK_VERT_TEXT,
    6: PSM.SINGLE_BLOCK,
    7: PSM.SINGLE_LINE,
    8: PSM.SINGLE_WORD,
    9: PSM.CIRCLE_WORD,
    10: PSM.SINGLE_CHAR,
    11: PSM.SPARSE_TEXT,
    12: PSM.SPARSE_TEXT_OSD,
    13: PSM.RAW_LINE,
    14: PSM.COUNT,
}


def preprocess_image(image):
    # Downscale to 200 DPI (assuming 300 DPI input)
    image = image.resize(
        (int(image.width * 0.67), int(image.height * 0.67)), Image.Resampling.LANCZOS
    )
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
        config = {
            "oem": INT_TO_OEM[3],
            "psm": INT_TO_PSM[6 if segment_box else 3],
        }

    api.InitFull(
        lang=config.get("lang", "por"),
        oem=config.get("oem", INT_TO_OEM[3]),
        psm=config.get("psm", INT_TO_PSM[3]),
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
                    "height": box[3] - box[1],
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
                "height": segment_box[3] - segment_box[1],
            }
            api.SetRectangle(**coords)
            hocr = api.GetHOCRText(0)
    else:
        hocr = api.GetHOCRText(0)

    api.End()
    return parse_hocr(hocr, segment_box)


def verify_params(config):
    errors = []
    if "lang" in config:
        for lang in config["lang"]:
            if lang not in LANGS:
                errors.append(f'Língua: "{config["lang"]}"')
    if "engineMode" in config and config["engineMode"] not in ENGINE_MODES:
        errors.append(f'Modo do motor: "{config["engineMode"]}"')
    if "segmentMode" in config and config["segmentMode"] not in SEGMENT_MODES:
        errors.append(f'Segmentação: "{config["segmentMode"]}"')
    if (
        "thresholdMethod" in config
        and config["thresholdMethod"] not in THRESHOLD_METHODS
    ):
        errors.append(f'Thresholding: "{config["thresholdMethod"]}"')
    if "outputs" in config:
        for output_format in config["outputs"]:
            if output_format not in OUTPUTS:
                errors.append(f'Formato de resultado: "{config["outputs"]}"')
    if "dpi" in config and not isinstance(config["dpi"], (int, str)):
        errors.append(f'DPI: "{config["outputs"]}"')

    return len(errors) == 0, errors
