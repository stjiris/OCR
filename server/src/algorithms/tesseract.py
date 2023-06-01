import re

import pytesseract
from lxml import etree
from lxml import html


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


def get_structure(page, config):
    hocr = get_hocr(page, config)

    p1 = re.compile(r"bbox((\s+\d+){4})")
    p2 = re.compile(r"baseline((\s+[\d\.\-]+){2})")

    hocr = etree.fromstring(hocr, html.XHTMLParser())

    lines = []

    for line in hocr.xpath('//*[@class="ocr_line"]'):
        linebox = p1.search(line.attrib["title"]).group(1).split()
        try:
            baseline = p2.search(line.attrib["title"]).group(1).split()
        except AttributeError:
            baseline = [0, 0]
        linebox = [float(i) for i in linebox]
        baseline = [float(i) for i in baseline]

        words = []

        xpath_elements = './/*[@class="ocrx_word"]'
        if not (line.xpath("boolean(" + xpath_elements + ")")):
            # if there are no words elements present,
            # we switch to lines as elements
            xpath_elements = "."

        for word in line.xpath(xpath_elements):
            rawtext = word.text_content().strip()
            if rawtext == "":
                continue

            box = p1.search(word.attrib["title"]).group(1).split()
            box = [float(i) for i in box]
            b = polyval(baseline, (box[0] + box[2]) / 2 - linebox[0]) + linebox[3]

            words.append({"text": rawtext, "box": box, "b": b})

        if words:
            lines.append(words)

    return lines


def polyval(poly, x):
    return x * poly[0] + poly[1]
