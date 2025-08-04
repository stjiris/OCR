import math
import tempfile
from os import remove

from lxml import etree
from lxml import html
from PIL import Image
from src.utils.enums_tesseract import ENGINE_MODES
from src.utils.enums_tesseract import LANGS
from src.utils.enums_tesseract import OUTPUTS
from src.utils.enums_tesseract import SEGMENT_MODES
from src.utils.enums_tesseract import THRESHOLD_METHODS
from src.utils.file import get_page_extension_from_original
from src.utils.parse_hocr import parse_hocr
from tesserocr import OEM
from tesserocr import PSM
from tesserocr import PyTessBaseAPI

api = PyTessBaseAPI(init=False)

TESSERACT_OUTPUTS = (
    "hocr",
    "pdf",
    "tsv",
    "txt",
    "xml",
)

EXTENSION_TO_VAR = {
    "hocr": "tessedit_create_hocr",
    "pdf": "tessedit_create_pdf",
    "tsv": "tessedit_create_tsv",
    "txt": "tessedit_create_txt",
    "xml": "tessedit_create_alto",
}

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


def get_structure(
    page,
    lang: str,
    config: dict | str,
    doc_path: str = "",
    output_types: list[str] | None = None,
    segment_box=None,
    single_page: bool = False,
):
    """
    Extract text and layout structure from a page or a segment.

    :param page: The PIL image of the page, or its path.
    :param lang: The string of languages to use.
    :param config: OCR configuration options (dict).
    :param doc_path: Path to the folder of the document being OCR'd.
    :param output_types: List of output types to auto-generate if the document being OCR'd only has one page.
    :param segment_box: Optional bounding box for a segment (left, top, right, bottom) or list of boxes.
    :param single_page: Whether this is the only page of the document being analysed. If yes, some result files can be immediately outputted.
    :return: Extracted text structure in the form of lines and words.
    """
    # Ensure config is a dict, use defaults if not
    if not isinstance(config, dict):
        config = {
            "engineMode": 3,
            "segmentMode": 6 if segment_box else 3,
            "thresholdMethod": 0,
        }

    api.InitFull(
        lang=config.get("lang", lang),
        oem=INT_TO_OEM[config.get("engineMode", 3)],
        psm=INT_TO_PSM[config.get("segmentMode", 3)],
        variables=config.get("otherParams", {}),
    )
    # TODO: receive other variables
    api.SetVariable("thresholding_method", str(config.get("thresholdMethod", 0)))
    api.SetVariable("user_defined_dpi", str(config.get("dpi", 0)))

    raw_results_paths = []
    if segment_box:
        if isinstance(page, str):
            page = Image.open(page)  # get file descriptor
        api.SetImage(page)

        # err on the side of using a bigger margin
        coords = {
            "left": math.floor(segment_box[0]),
            "top": math.floor(segment_box[1]),
            "width": math.ceil(segment_box[2] - segment_box[0]),
            "height": math.ceil(segment_box[3] - segment_box[1]),
        }
        api.SetRectangle(**coords)
        hocr = etree.fromstring(api.GetHOCRText(0), html.XHTMLParser())

    elif not single_page:
        if isinstance(page, str):
            page = Image.open(page)  # get file descriptor
        api.SetImage(page)
        hocr = etree.fromstring(api.GetHOCRText(0), html.XHTMLParser())

        # Code for theoretically producing a direct output using all pages, streaming the list of all filenames to tesseract
        """
        if output_types is None or len(output_types) == 0:
            output_types = ["hocr"]

        output_base = f"{doc_path}/_export/_temp"
        extensions = [ext for ext in output_types if ext in TESSERACT_OUTPUTS]
        if "hocr" not in extensions:
            extensions.append(
                "hocr"
            )  # append here and not output_types to avoid mutating original list
        for ext in extensions:
            api.SetVariable(EXTENSION_TO_VAR[ext], "1")
            raw_results_paths.append(f"{output_base}.{ext}")

        # From the command line, it's possible to sequentially process multiple pages into one output:
        # echo example_0.png\\nexample_1.png | tesseract -l por --oem 0 -c stream_filelist=1 - - pdf > example_out.pdf

        # api.SetVariable("stream_filelist", "1")  # accept list of filenames as string separated by \n; not working from code

        #api.SetVariable("hocr_font_info", "1")
        #api.SetVariable("tessedit_dump_pageseg_images", "1")
        api.ProcessPages(
            outputbase=output_base,
            filename=page,  # page should be stream of filenames
        )
        """

    else:
        # single-page document, leverage direct Tesseract outputs
        if output_types is None or len(output_types) == 0:
            output_types = ["hocr"]

        output_base = f"{doc_path}/_export/_temp"
        extensions = [ext for ext in output_types if ext in TESSERACT_OUTPUTS]
        if "hocr" not in extensions:
            extensions.append(
                "hocr"
            )  # append here and not output_types to avoid mutating original list
        for ext in extensions:
            api.SetVariable(EXTENSION_TO_VAR[ext], "true")
            raw_results_paths.append(f"{output_base}.{ext}")

        if isinstance(page, str):
            # Use ProcessPages (plural) to obtain direct results from file path
            api.ProcessPages(
                outputbase=output_base,
                filename=page,
            )
        else:
            # Getting direct outputs from tesserOCR requires API call that only processes stored file, not in-memory image
            temp_file = tempfile.NamedTemporaryFile(
                prefix="temp_",
                suffix=f".{get_page_extension_from_original(doc_path)}",
                delete=False,
                delete_on_close=False,
            )
            page.save(temp_file, format=page.format)
            api.ProcessPages(
                outputbase=output_base,
                filename=temp_file.name,
            )
            if temp_file:
                remove(temp_file.name)

        hocr = etree.parse(f"{output_base}.hocr", html.XHTMLParser())

    api.End()

    lines = parse_hocr(hocr, segment_box)

    return lines, raw_results_paths


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
        errors.append(f'DPI: "{config["dpi"]}"')

    if "otherParams" in config and not isinstance(config["otherParams"], dict):
        errors.append(f'Outros parâmetros: "{config["otherParams"]}"')

    return len(errors) == 0, errors


def build_ocr_config(config: dict) -> tuple[str, dict]:
    # Join langs with pluses, expected by tesseract
    lang = "+".join(config["lang"])
    config["lang"] = lang
    return lang, config
