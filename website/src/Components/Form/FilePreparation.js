import { PDFDocument } from "pdf-lib";

/***********************************************
    GENERAL Document Preparation
***********************************************/
async function prepareDocument(file, page) {
    var extension = file.name.split('.').pop();
    switch (extension) {
        case 'pdf':
            return await preparePDF(file, page);
        default:
            return [];
    }
}

/***********************************************
    PDF Document Preparation
***********************************************/
function readFile(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onload = () => {
            resolve(reader.result);
        }
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

async function extractPdfPage(pdfSrcDoc, page) {
    const pdfNewDoc = await PDFDocument.create();
    const pages = await pdfNewDoc.copyPages(pdfSrcDoc, [page]);
    pages.forEach(page => pdfNewDoc.addPage(page));
    const newPdf = await pdfNewDoc.save();
    return newPdf;
}

function i2hex(i) {
    return ('0' + i.toString(16)).slice(-2);
}

async function getPageCount(file) {
    const pdfArrayBuffer = await readFile(file);
    const pdfSrcDoc = await PDFDocument.load(pdfArrayBuffer);
    return pdfSrcDoc.getPageCount();
}

async function preparePDF(file, page) {
    const pdfArrayBuffer = await readFile(file);
    const pdfSrcDoc = await PDFDocument.load(pdfArrayBuffer);
    const newPdfDoc = await extractPdfPage(pdfSrcDoc, page);
    return Array.from(newPdfDoc).map(i2hex).join('');
}

export { getPageCount, prepareDocument };