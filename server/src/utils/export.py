"""
   Functions used to export the files to the client

   Possible formats of output:
   - pure .txt 
   - .txt with delimiters between pages
   - .docx (TODO)
   - .pdf with transparent layer of text (TODO)
"""

import re, os, base64, io, zlib
from src.utils.file import get_file_basename

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas

from lxml import etree, html
from PIL import Image

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

    basename = get_file_basename(path)
    filename = f"{path}/{basename}-Text.txt"

    files = [os.path.join(path, f) for f in os.listdir(path) if os.path.isfile(os.path.join(path, f)) and ".txt" in f and "Text.txt" not in f]

    if len(files) > 1:
        files = sorted(
            files,
            key=lambda x: int(re.findall('\d+', x)[-1])
        )

    with open(filename, "w", encoding="utf-8") as f:
        for id, file in enumerate(files):

            with open(file, encoding="utf-8") as _f:
                f.write(f"----- PAGE {(id+1):04d} -----\n\n")
                f.write(_f.read().strip() + "\n\n")

    return filename

####################################################
# EXPORT DOC FUNCTIONS
####################################################
def export_doc(path):
    """
    Export the file as a .doc file
    """

    pass

####################################################
# EXPORT PDF FUNCTIONS
####################################################
def export_pdf(path):
    """
    Export the file as a .pdf file
    """

    images = sorted([f"{path}/{f}" for f in os.listdir(path) if os.path.isfile(os.path.join(path, f)) and re.search(r"\d+\.jpg", f)])

    load_invisible_font()
  
    basename = get_file_basename(path)
    filename = f"{path}/{basename}_search.pdf"

    pdf = Canvas(filename, pageCompression=1)
    pdf.setCreator('hocr-tools')
    pdf.setTitle(filename)
    dpi = 200
  
    for image in images:
        im = Image.open(image)
        w, h = im.size
        try:
            dpi = im.info['dpi'][0]
        except KeyError:
            pass
  
        width = (w * 72 / dpi)
        height = (h * 72 / dpi)
        pdf.setPageSize((width, height))
        pdf.drawImage(image, 0, 0, width=width, height=height)
        add_text_layer(pdf, image, height, dpi)
        pdf.showPage()
  
    pdf.save()
    return filename

def add_text_layer(pdf, image, height, dpi):
    import pytesseract
    """Draw an invisible text layer for OCR data"""
    p1 = re.compile(r'bbox((\s+\d+){4})')
    p2 = re.compile(r'baseline((\s+[\d\.\-]+){2})')

    hocrfile = pytesseract.image_to_pdf_or_hocr(image, extension='hocr', lang='por')

    # hocrfile = os.path.splitext(image)[0] + ".hocr"
    hocr = etree.fromstring(hocrfile, html.XHTMLParser())
    
    for line in hocr.xpath('//*[@class="ocr_line"]'):
        linebox = p1.search(line.attrib['title']).group(1).split()
        try:
            baseline = p2.search(line.attrib['title']).group(1).split()
        except AttributeError:
            baseline = [0, 0]
        linebox = [float(i) for i in linebox]
        baseline = [float(i) for i in baseline]
        xpath_elements = './/*[@class="ocrx_word"]'
        if (not (line.xpath('boolean(' + xpath_elements + ')'))):
            # if there are no words elements present,
            # we switch to lines as elements
            xpath_elements = '.'
        
        for word in line.xpath(xpath_elements):
            rawtext = word.text_content().strip()
            if rawtext == '':
                continue
            font_width = pdf.stringWidth(rawtext, 'invisible', 8)
            if font_width <= 0:
                continue

            box = p1.search(word.attrib['title']).group(1).split()
            box = [float(i) for i in box]
            b = polyval(baseline,
                        (box[0] + box[2]) / 2 - linebox[0]) + linebox[3]
            text = pdf.beginText()
            text.setTextRenderMode(3)  # double invisible
            text.setFont('invisible', 8)
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
""".encode('latin1')
    uncompressed = bytearray(zlib.decompress(base64.b64decode(font)))
    ttf = io.BytesIO(uncompressed)
    setattr(ttf, "name", "(invisible.ttf)")
    pdfmetrics.registerFont(TTFont('invisible', ttf))