"""
   Functions used to export the files to the client

   Possible formats of output:
   - pure .txt
   - .txt with delimiters between pages
   - .pdf with transparent layer of text
"""
import base64
import contextlib
import io
import json
import os
import re
import zlib

from PIL import Image
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas


def json_to_text(json_d):
    """
    Convert json to text
    :param json_d: json with the hOCR data
    :return: text
    """
    return "\n".join([" ".join([w["text"] for w in l]) for l in json_d]).strip()


def get_file_basename(filename):
    """
    Get the basename of a file

    :param file: file name
    :return: basename of the file
    """
    return ".".join(filename.split("/")[-1].split(".")[:-1])


####################################################
# GENERAL FUNCTION
####################################################
def export_file(path, filetype, delimiter=None):
    """
    Direct to the correct function based on the filetype

    :param path: the path to the file
    :param filetype: the filetype to export to
    :param delimiter: the delimiter to use between pages
    """

    func = globals()[f"export_{filetype}"]
    if delimiter is None:
        return func(path)

    return func(path, delimiter)


####################################################
# EXPORT TXT FUNCTIONS
####################################################
def export_txt(path, delimiter=None):
    """
    Export the file as a .txt file

    :param path: the path to the file
    :param delimiter: the delimiter to use between pages
    :return: the path to the exported file
    """

    filename = f"{path}/_text.txt"
    ocr_folder = f"{path}/ocr_results"

    files = [
        os.path.join(ocr_folder, f)
        for f in os.listdir(ocr_folder)
        if os.path.isfile(os.path.join(ocr_folder, f)) and ".json" in f
    ]

    if len(files) > 1:
        files = sorted(files, key=lambda x: int(re.findall(r"\d+", x)[-1]))

    with open(filename, "w", encoding="utf-8") as f:
        for id, file in enumerate(files):
            with open(file, encoding="utf-8") as _f:
                hOCR = json.load(_f)
                f.write(f"----- PAGE {(id+1):04d} -----\n\n")
                f.write(json_to_text(hOCR) + "\n\n")

    return filename


####################################################
# EXPORT PDF FUNCTIONS
####################################################
def export_pdf(path):
    """
    Export the file as a .pdf file
    """
    images = sorted(
        [
            f"{path}/{f}"
            for f in os.listdir(path)
            if os.path.isfile(os.path.join(path, f)) and re.search(r"\.jpg", f)
        ]
    )

    load_invisible_font()

    filename = f"{path}/_search.pdf"

    pdf = Canvas(filename, pageCompression=1)
    pdf.setCreator("hocr-tools")
    pdf.setTitle(filename)
    dpi = 200

    for image in images:
        image_basename = get_file_basename(image)
        hocr_path = f"{path}/ocr_results/{image_basename}.json"

        im = Image.open(image)
        w, h = im.size

        with contextlib.suppress(KeyError):
            dpi = im.info["dpi"][0]

        width = w * 72 / dpi
        height = h * 72 / dpi
        pdf.setPageSize((width, height))
        pdf.drawImage(image, 0, 0, width=width, height=height)
        add_text_layer(pdf, hocr_path, height, dpi)
        pdf.showPage()

    pdf.save()
    return filename


def add_text_layer(pdf, hocr_path, height, dpi):
    """Draw an invisible text layer for OCR data"""

    with open(hocr_path) as f:
        hocrfile = json.load(f)

    for line in hocrfile:
        for word in line:
            rawtext = word["text"]
            box = word["box"]
            b = word["b"]

            font_width = pdf.stringWidth(rawtext, "invisible", 8)
            if font_width <= 0:
                continue

            text = pdf.beginText()
            text.setTextRenderMode(3)  # double invisible
            text.setFont("invisible", 8)
            text.setTextOrigin(box[0] * 72 / dpi, height - b * 72 / dpi)
            box_width = (box[2] - box[0]) * 72 / dpi
            text.setHorizScale(100.0 * box_width / font_width)
            text.textLine(rawtext)
            pdf.drawText(text)


def polyval(poly, x):
    return x * poly[0] + poly[1]


# Glyphless variation of vedaal's invisible font retrieved from
# http://www.angelfire.com/pr/pgpf/if.html, which says:
# 'Invisible font' is unrestricted freeware. Enjoy, Improve, Distribute freely
def load_invisible_font():
    font = """
eJzdlk1sG0UUx/+zs3btNEmrUKpCPxikSqRS4jpfFURUagmkEQQoiRXgAl07Y3vL2mvt2ml8APXG
hQPiUEGEVDhWVHyIC1REPSAhBOWA+BCgSoULUqsKcWhVBKjhzfPU+VCi3Flrdn7vzZv33ryZ3TUE
gC6chsTx8fHck1ONd98D0jnS7jn26GPjyMIleZhk9fT0wcHFl1/9GRDPkTxTqHg1dMkzJH9CbbTk
xbWlJfKEdB+Np0pBswi+nH/Nvay92VtfJp4nvEztUJkUHXsdksUOkveXK/X5FNuLD838ICx4dv4N
I1e8+ZqbxwCNP2jyqXoV/fmhy+WW/2SqFsb1pX68SfEpZ/TCrI3aHzcP//jitodvYmvL+6Xcr5mV
vb1ScCzRnPRPfz+LsRSWNasuwRrZlh1sx0E8AriddyzEDfE6EkglFhJDJO5u9fJbFJ0etEMB78D5
4Djm/7kjT0wqhSNURyS+u/2MGJKRu+0ExNkrt1pJti9p2x6b3TBJgmUXuzgnDmI8UWMbkVxeinCw
Mo311/l/v3rF7+01D+OkZYE0PrbsYAu+sSyxU0jLLtIiYzmBrFiwnCT9FcsdOOK8ZHbFleSn0znP
nDCnxbnAnGT9JeYtrP+FOcV8nTlNnsoc3bBAD85adtCNRcsSffjBsoseca/lBE7Q09LiJOm/ttyB
0+IqcwfncJt5q4krO5k7jV7uY+5m7mPebuLKUea7iHvk48w72OYF5rvZT8C8k/WvMN/Dc19j3s02
bzPvZZv3me9j/ox5P9t/xdzPzPVJcc7yGnPL/1+GO1lPVTXM+VNWOTRRg0YRHgrUK5yj1kvaEA1E
xAWiCtl4qJL2ADKkG6Q3XxYjzEcR0E9hCj5KtBd1xCxp6jV5mKP7LJBr1nTRK2h1TvU2w0akCmGl
5lWbBzJqMJsdyaijQaCm/FK5HqspHetoTtMsn4LO0T2mlqcwmlTVOT/28wGhCVKiNANKLiJRlxqB
F603axQznIzRhDSq6EWZ4UUs+xud0VHsh1U1kMlmNwu9kTuFaRqpURU0VS3PVmZ0iE7gct0MG/8+
2fmUvKlfRLYmisd1w8pk1LSu1XUlryM1MNTH9epTftWv+16gIh1oL9abJZyjrfF5a4qccp3oFAcz
Wxxx4DpvlaKKxuytRDzeth5rW4W8qBFesvEX8RFRmLBHoB+TpCmRVCCb1gFCruzHqhhW6+qUF6tC
pL26nlWN2K+W1LhRjxlVGKmRTFYVo7CiJug09E+GJb+QocMCPMWBK1wvEOfRFF2U0klK8CppqqvG
pylRc2Zn+XDQWZIL8iO5KC9S+1RekOex1uOyZGR/w/Hf1lhzqVfFsxE39B/ws7Rm3N3nDrhPuMfc
w3R/aE28KsfY2J+RPNp+j+KaOoCey4h+Dd48b9O5G0v2K7j0AM6s+5WQ/E0wVoK+pA6/3bup7bJf
CMGjwvxTsr74/f/F95m3TH9x8o0/TU//N+7/D/ScVcA=
""".encode(
        "latin1"
    )
    uncompressed = bytearray(zlib.decompress(base64.b64decode(font)))
    ttf = io.BytesIO(uncompressed)
    setattr(ttf, "name", "(invisible.ttf)")
    pdfmetrics.registerFont(TTFont("invisible", ttf))
