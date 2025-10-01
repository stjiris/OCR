export const defaultLangs = ["por"];
export const tesseractLangList = [
    { value: "deu", description: "Alemão"},
    { value: "spa", description: "Espanhol Castelhano"},
    { value: "fra", description: "Francês"},
    { value: "eng", description: "Inglês"},
    { value: "por", description: "Português"},
    { value: "equ", description: "Módulo de detecção de matemática / equações"},
    { value: "osd", description: "Módulo de orientação e detecção de scripts"},
]

export const defaultOutputs = ["pdf"];
export const tesseractOutputsList = [
    { value: "pdf_indexed", description: "PDF com texto e índice de palavras"},
    { value: "pdf", description: "PDF com texto (por defeito)"},
    { value: "txt", description: "Texto"},
    { value: "txt_delimited", description: "Texto com separador por página"},
    { value: "csv", description: "Índice de palavras em formato CSV"},
    { value: "ner", description: "Entidades (NER)"},
    { value: "hocr", description: "hOCR (apenas documentos com 1 página)"},
    { value: "xml", description: "ALTO (apenas documentos com 1 página)"},
]

export const defaultEngine = "pytesseract";
export const engineList = [
    { value: "pytesseract", description: "PyTesseract"},
    { value: "tesserOCR", description: "TesserOCR"},
]

export const defaultEngineMode = 3;
export const tesseractModeList = [
    { value: 0, description: "Tesseract Original"},
    { value: 1, description: "Tesseract LSTM"},
    { value: 2, description: "Tesseract LSTM + Original combinado"},
    { value: 3, description: "Modo disponível por defeito"},
]

export const defaultSegmentationMode = 3;
export const tesseractSegmentList = [
    //{ value: 0, description: "Apenas Orientation and Script Detection (OSD)"},  // TODO: allow producing only OSD file without OCR
    { value: 1, description: "OCR com segmentação automática de página e OSD"},
    { value: 2, description: "Segmentação automática de página sem OSD nem OCR"},
    { value: 3, description: "(Por defeito) OCR com segmentação automática, sem OSD"},
    { value: 4, description: "Coluna de texto com linhas de tamanho variável"},
    { value: 5, description: "Bloco uniforme de texto, alinhado verticalmente"},
    { value: 6, description: "Bloco uniforme de texto"},
    { value: 7, description: "Imagem com apenas uma linha de texto"},
    { value: 8, description: "Imagem com apenas uma palavra"},
    { value: 9, description: "Imagem com apenas uma palavra num círculo"},
    { value: 10, description: "Imagem com apenas um caracter"},
    { value: 11, description: "Texto disperso; procurar o máximo de texto sem ordem particular"},
    { value: 12, description: "Texto disperso com OSD"},
    { value: 13, description: "Contornando truques específicos do Tesseract, tratar imagem como apenas uma linha de texto"},
]

export const defaultThresholding = 0;
export const tesseractThreshList = [
    { value: 0, description: "Otsu (por defeito)"},
    { value: 1, description: "LeptonicaOtsu"},
    { value: 2, description: "Sauvola"},
]

export const defaultConfig = {
    lang: defaultLangs,
    outputs: defaultOutputs,
    dpiVal: null,
    otherParams: null,
    engine: defaultEngine,
    engineMode: defaultEngineMode,
    segmentMode: defaultSegmentationMode,
    thresholdMethod: defaultThresholding,
}

export const emptyConfig = {
    lang: [],
    outputs: [],
    engine: "",
    engineMode: -1,
    segmentMode: -1,
    thresholdMethod: -1,
    dpiVal: null,
    otherParams: null,
}
