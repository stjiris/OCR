import React from 'react';
import axios from "axios";

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from "@mui/material/TextField";
import UndoIcon from "@mui/icons-material/Undo";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import RotateLeft from "@mui/icons-material/RotateLeft";
import SaveIcon from "@mui/icons-material/Save";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControl from "@mui/material/FormControl";

import loadComponent from '../../../utils/loadComponents';
const ConfirmLeave = loadComponent('Notifications', 'ConfirmLeave');
const Notification = loadComponent('Notifications', 'Notification');
//const AlgoDropdown = loadComponent('Dropdown', 'AlgoDropdown');
const CheckboxList = loadComponent('Form', 'CheckboxList');

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;

// TODO: always get the most updated default config from an API endpoint

const defaultLangs = ["por"];
const tesseractLangList = [
    { value: "deu", description: "Alemão"},
    { value: "spa", description: "Espanhol Castelhano"},
    { value: "fra", description: "Francês"},
    { value: "eng", description: "Inglês"},
    { value: "por", description: "Português"},
    { value: "equ", description: "Módulo de detecção de matemática / equações"},
    { value: "osd", description: "Módulo de orientação e detecção de scripts"},
]

const defaultOutputs = ["pdf"];
const tesseractOutputsList = [
    { value: "pdf_indexed", description: "PDF com texto e índice"},
    { value: "pdf", description: "PDF com texto (por defeito)"},
    { value: "txt", description: "Texto"},
    { value: "txt_delimited", description: "Texto com separador por página"},
    { value: "csv", description: "Índice de palavras"},
    { value: "ner", description: "Entidades (NER)"},
    { value: "hocr", description: "hOCR (apenas documentos com 1 página)", disabled: true},
    { value: "xml", description: "ALTO (apenas documentos com 1 página)", disabled: true},
]

const defaultEngine = "pytesseract";
const engineList = [
    { value: "pytesseract", description: "PyTesseract"},
    { value: "tesserOCR", description: "TesserOCR"},
]

const defaultEngineMode = 3;
const tesseractModeList = [
    { value: 0, description: "Tesseract Original"},
    { value: 1, description: "Tesseract LSTM"},
    { value: 2, description: "Tesseract LSTM + Original combinado"},
    { value: 3, description: "Modo disponível por defeito"},
]

const defaultSegmentationMode = 3;
const tesseractSegmentList = [
    { value: 0, description: "Apenas Orientation and Script Detection (OSD)"},
    { value: 1, description: "OCR com segmentação automática de página e OSD"},
    //{ value: 2, description: "Segmentação automática de página sem OSD nem OCR"},
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

const defaultThresholding = 0;
const tesseractThreshList = [
    { value: 0, description: "Otsu (por defeito)"},
    { value: 1, description: "LeptonicaOtsu"},
    { value: 2, description: "Sauvola"},
]

/*
const easyOCRChoice = [{"name": "Português","code": "pt"}]
const easyOCRLangList = [
    {"name": "Abaza","code": "abq"},
    {"name": "Adigue","code": "ady"},
    {"name": "Africanês","code": "af"},
    {"name": "Albanês","code": "sq"},
    {"name": "Alemão","code": "de"},
    {"name": "Angika","code": "ang"},
    {"name": "Árabe","code": "ar"},
    {"name": "Assamês","code": "as"},
    {"name": "Ávaro","code": "ava"},
    {"name": "Azerbaijão","code": "az"},
    {"name": "Bielorusso","code": "be"},
    {"name": "Búlgaro","code": "bg"},
    {"name": "Biari","code": "bh"},
    {"name": "Boiapuri","code": "bho"},
    {"name": "Bengalês","code": "bn"},
    {"name": "Bósnio","code": "bs"},
    {"name": "Cabardiano","code": "kbd"},
    {"name": "Canarim ","code": "kn"},
    {"name": "Checheno","code": "che"},
    {"name": "Checo","code": "cs"},
    {"name": "Chinês Simplificado","code": "ch_sim"},
    {"name": "Chinês Tradicional","code": "ch_tra"},
    {"name": "Coreano","code": "ko"},
    {"name": "Croata","code": "hr"},
    {"name": "Curdo","code": "ku"},
    {"name": "Dargínico","code": "dar"},
    {"name": "Dinamarquês","code": "da"},
    {"name": "Eslovaco","code": "sk"},
    {"name": "Esloveno","code": "sl"},
    {"name": "Espanhol","code": "es"},
    {"name": "Estónio","code": "et"},
    {"name": "Francês","code": "fr"},
    {"name": "Galês","code": "cy"},
    {"name": "Hindi","code": "hi"},
    {"name": "Holandês","code": "nl"},
    {"name": "Húngaro","code": "hu"},
    {"name": "Indonésio","code": "id"},
    {"name": "Inglês","code": "en"},
    {"name": "Inguche","code": "inh"},
    {"name": "Irlandês","code": "ga"},
    {"name": "Islandês","code": "is"},
    {"name": "Italiano","code": "it"},
    {"name": "Japonês","code": "ja"},
    {"name": "Konkani","code": "gom"},
    {"name": "Latim","code": "la"},
    {"name": "Lak","code": "lbe"},
    {"name": "Letão","code": "lv"},
    {"name": "Lezghiano","code": "lez"},
    {"name": "Lituano","code": "lt"},
    {"name": "Magahi","code": "mah"},
    {"name": "Maithili","code": "mai"},
    {"name": "Malaio","code": "ms"},
    {"name": "Maltês","code": "mt"},
    {"name": "Maori","code": "mi"},
    {"name": "Marata","code": "mr"},
    {"name": "Mongol","code": "mn"},
    {"name": "Nagpuri","code": "sck"},
    {"name": "Nepalês","code": "ne"},
    {"name": "Newari","code": "new"},
    {"name": "Norueguês","code": "no"},
    {"name": "Occitano","code": "oc"},
    {"name": "Páli","code": "pi"},
    {"name": "Persa (Farsi)","code": "fa"},
    {"name": "Polaco","code": "pl"},
    {"name": "Português","code": "pt"},
    {"name": "Romeno","code": "ro"},
    {"name": "Russo","code": "ru"},
    {"name": "Sérvio (cirílico)","code": "rs_cyrillic"},
    {"name": "Sérvio (latim)","code": "rs_latin"},
    {"name": "Suaíli","code": "sw"},
    {"name": "Sueco","code": "sv"},
    {"name": "Tabassarão ","code": "tab"},
    {"name": "Tailandês ","code": "th"},
    {"name": "Tajique ","code": "tjk"},
    {"name": "Tagalo","code": "tl"},
    {"name": "Tâmil","code": "ta"},
    {"name": "Telugu","code": "te"},
    {"name": "Turco","code": "tr"},
    {"name": "Ucraniano","code": "uk"},
    {"name": "Uigur","code": "ug"},
    {"name": "Urdu","code": "ur"},
    {"name": "Usbeque","code": "uz"},
    {"name": "Vietnamita","code": "vi"}
  ]
*/

const defaultConfig = {
    lang: defaultLangs,
    outputs: defaultOutputs,
    dpiVal: null,
    otherParams: null,
    engine: defaultEngine,
    engineMode: defaultEngineMode,
    segmentMode: defaultSegmentationMode,
    thresholdMethod: defaultThresholding,
}

class OcrMenu extends React.Component {
    constructor(props) {
        super(props);
        const usingDefault = this.props.customConfig == null;  // null or undefined
        const initialConfig = Object.assign({...defaultConfig}, this.props.customConfig);
        this.state = {
            ...initialConfig,
            // lists of options in state, to allow changing them dynamically depending on other choices
            // e.g. when choosing an OCR engine that has different parameter values
            engineOptions: engineList,
            engineModeOptions: tesseractModeList,
            segmentModeOptions: tesseractSegmentList,
            thresholdMethodOptions: tesseractThreshList,
            usingDefault: usingDefault,
            uncommittedChanges: false,
        }

        // Enable options restricted to single-page
        tesseractOutputsList[tesseractOutputsList.length-2]["disabled"] = !this.props.isSinglePage;  // hOCR output
        tesseractOutputsList[tesseractOutputsList.length-1]["disabled"] = !this.props.isSinglePage;  // ALTO output

        this.confirmLeave = React.createRef();
        this.successNot = React.createRef();
        this.errorNot = React.createRef();

        //this.algoDropdown = React.createRef();

        this.storageMenu = React.createRef();

        this.dpiField = React.createRef();
        this.moreParams = React.createRef();

        this.leave = this.leave.bind(this);
        this.setLangList = this.setLangList.bind(this);
        this.setOutputList = this.setOutputList.bind(this);
    }

    preventExit(event) {
        event.preventDefault();
        event.returnValue = '';
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (!prevState.uncommittedChanges && this.state.uncommittedChanges) {
            window.addEventListener('beforeunload', this.preventExit);
        } else if (prevState.uncommittedChanges && !this.state.uncommittedChanges) {
            window.removeEventListener('beforeunload', this.preventExit);
        }
    }

    getConfig() {
        const config = {
            engine: this.state.engine,
            lang: this.state.lang,
            outputs: this.state.outputs,
            engineMode: this.state.engineMode,
            segmentMode: this.state.segmentMode,
            thresholdMethod: this.state.thresholdMethod,
        }
        if (this.state.dpiVal !== null && this.state.dpiVal !== "") {
            config.dpi = this.state.dpiVal;
        }
        if (this.state.otherParams !== null && this.state.otherParams !== "") {
            config.otherParams = this.state.otherParams;
        }
        return config;
    }

    restoreDefault() {
        if (this.state.usingDefault) return;
        this.setState({
            ...defaultConfig,
            usingDefault: true,
            uncommittedChanges: true
        });
    }

    setLangList(checked) {
        this.setState({ lang: checked, usingDefault: false, uncommittedChanges: true });
    }

    setOutputList(checked) {
        this.setState({ outputs: checked, usingDefault: false, uncommittedChanges: true });
    }

    changeDpi(value) {
        value = value.trim()
        if (!(/^[1-9][0-9]*$/.test(value))) {
            this.errorNot.current.openNotif("O valor de DPI deve ser um número inteiro!");
        }
        this.setState({ dpiVal: value, usingDefault: false, uncommittedChanges: true });
    }

    changeEngine(value) {
        this.setState({ engine: value, usingDefault: false, uncommittedChanges: true });
    }

    changeEngineMode(value) {
        this.setState({ engineMode: Number(value), usingDefault: false, uncommittedChanges: true });
    }

    changeSegmentationMode(value) {
        this.setState({ segmentMode: Number(value), usingDefault: false, uncommittedChanges: true });
    }

    changeThresholdingMethod(value) {
        this.setState({ thresholdMethod: Number(value), usingDefault: false, uncommittedChanges: true });
    }

    changeAdditionalParams(value) {
        this.setState({ otherParams: value, usingDefault: false, uncommittedChanges: true });
    }

    goBack() {
        if (this.state.uncommittedChanges) {
            this.confirmLeave.current.toggleOpen();
        } else {
            window.removeEventListener('beforeunload', this.preventExit);
            this.props.closeOCRMenu();
        }
    }

    leave() {
        window.removeEventListener('beforeunload', this.preventExit);
        this.props.closeOCRMenu();
        this.confirmLeave.current.toggleOpen();
    }

    saveConfig(exit = false) {
        const path = (this.props.sessionId + '/' + this.props.current_folder + '/' + this.props.filename).replace(/^\//, '');
        const config = this.state.usingDefault ? "default" : this.getConfig();
        axios.post(API_URL + '/save-config',
            {
                _private: this.props._private,
                path: path,
                config: config,
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(({ data }) => {
                if (data["success"]) {
                    this.setState({ uncommittedChanges: false });

                    this.successNot.current.openNotif("Configuração de OCR guardada com sucesso.");

                    if (exit) {
                        this.leave();
                    }
                } else {
                    this.errorNot.current.openNotif("Erro inesperado ao guardar a configuração de OCR.")
                }
            });
    }

    render() {
        const valid = (
            (this.state.dpiVal === null || this.state.dpiVal === "" || (/^[1-9][0-9]*$/.test(this.state.dpiVal)))
            && this.state.lang.length !== 0
            && this.state.outputs.length !== 0
        );
        return (
        <>
            <Notification message={""} severity={"success"} ref={this.successNot}/>
            <Notification message={""} severity={"error"} ref={this.errorNot}/>
            <ConfirmLeave leaveFunc={this.leave} ref={this.confirmLeave} />

            <Box sx={{
                ml: '0.5rem',
                mr: '0.5rem',
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                backgroundColor: '#fff',
                paddingBottom: '1rem',
                marginBottom: '0.5rem',
                borderBottom: '1px solid black',
            }}>
                <Button
                    variant="contained"
                    startIcon={<UndoIcon />}
                    onClick={() => this.goBack()}
                    sx={{
                        border: '1px solid black',
                        height: '2rem',
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        ':hover': { bgcolor: '#ddd' }
                    }}
                >
                    Voltar
                </Button>

                <Box>
                    <Button
                        disabled={this.state.usingDefault}
                        variant="contained"
                        className="menuFunctionButton"
                        startIcon={<RotateLeft />}
                        onClick={() => this.restoreDefault()}
                    >
                        Configuração Predefinida
                    </Button>
                    <Button
                        disabled={!valid}
                        color="success"
                        variant="contained"
                        className="menuFunctionButton"
                        startIcon={<SaveIcon />}
                        onClick={() => this.saveConfig()}
                    >
                        Guardar
                    </Button>
                    <Button
                        disabled={!valid}
                        variant="contained"
                        color="success"
                        className="menuFunctionButton noMarginRight"
                        startIcon={<CheckRoundedIcon />}
                        onClick={() => this.saveConfig(true)}
                    >
                        Terminar
                    </Button>
                </Box>
            </Box>

            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                width: 'auto',
                margin: '1rem',
            }}>
                <Typography variant="h5" component="h2" sx={{alignSelf: 'center'}}>
                    Configurar OCR {this.props.isFolder ? 'da pasta' : 'do ficheiro'} <b>{this.props.filename}</b>
                </Typography>
            </Box>

            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                height: 'auto',
                width: 'auto',
                margin: 'auto',
                /*overflow: 'scroll'*/
            }}>
                {
                //<AlgoDropdown ref={this.algoDropdown} menu={this}/>
                }
                {/*
                <ChecklistDropdown className="simpleDropdown ocrDropdown"
                                   ref={this.langs}
                                   label={"Língua"}
                                   helperText={"Para melhores resultados, selecione por ordem de relevância"}
                                   options={tesseractLangList}
                                   defaultChoice={[tesseractLangList[defaultLangIndex]]}/>
                */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <CheckboxList title={"Língua"}
                                  options={tesseractLangList}
                                  checked={this.state.lang}
                                  onChangeCallback={this.setLangList}
                                  required
                                  helperText="Para melhores resultados, selecione por ordem de relevância"
                                  errorText="Deve selecionar pelo menos uma língua"/>
                </Box>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '30%',
                }}>
                    <TextField ref={this.dpiField}
                               label="DPI (Dots Per Inch)"
                               inputProps={{ inputMode: "numeric", pattern: "[1-9][0-9]*" }}
                               error={isNaN(this.state.dpiVal)
                                   || (this.state.dpiVal !== null
                                   && this.state.dpiVal !== "" && !(/^[1-9][0-9]*$/.test(this.state.dpiVal)))}
                               value={this.state.dpiVal}
                               onChange={(e) => this.changeDpi(e.target.value)}
                               variant='outlined'
                               size="small"
                               className="simpleInput"
                               sx={{
                                   "& input:focus:invalid + fieldset": {borderColor: "red", borderWidth: 2}
                                }}
                    />

                    <FormControl className="simpleDropdown borderTop">
                        <FormLabel id="label-ocr-engine-select">Motor de OCR</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-ocr-engine-select"
                            value={this.state.engine}
                            onChange={(e) => this.changeEngine(e.target.value)}>
                            {
                                this.state.engineOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <FormControl className="simpleDropdown borderTop">
                        <FormLabel id="label-engine-type-select">Modo do motor</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-engine-type-select"
                            value={this.state.engineMode}
                            onChange={(e) => this.changeEngineMode(e.target.value)}>
                            {
                                this.state.engineModeOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <FormControl className="simpleDropdown borderTop">
                        <FormLabel id="label-segmentation-select">Segmentação</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-segmentation-select"
                            value={this.state.segmentMode}
                            onChange={(e) => this.changeSegmentationMode(e.target.value)}>
                            {
                                this.state.segmentModeOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <FormControl className="simpleDropdown borderTop">
                        <FormLabel id="label-thresholding-select">Thresholding</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-thresholding-select"
                            value={this.state.thresholdMethod}
                            onChange={(e) => this.changeThresholdingMethod(e.target.value)}>
                            {
                                this.state.thresholdMethodOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <TextField ref={this.moreParams}
                               label="Parâmetros adicionais"
                               value={this.state.otherParams}
                               onChange={(e) => this.changeAdditionalParams(e.target.value)}
                               variant='outlined'
                               className="simpleInput borderTop"
                               size="small"
                               InputLabelProps={{sx: {top: "0.5rem"}}}
                    />
                </Box>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <CheckboxList title={"Formatos de resultado"}
                                  options={tesseractOutputsList}
                                  checked={this.state.outputs}
                                  onChangeCallback={this.setOutputList}
                                  required
                                  errorText="Deve selecionar pelo menos um formato de resultado"/>
                </Box>

                {/*
                <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                    <Button variant="contained" onClick={() => this.performOCR()}>
                        Começar
                    </Button>
                </Box>
                */}
            </Box>
        </>
        );
    }
}

OcrMenu.defaultProps = {
    _private: false,
    sessionId: "",
    current_folder: null,
    filename: null,
    isFolder: false,
    isSinglePage: false,
    customConfig: null,
    // functions:
    closeOCRMenu: null,
    showStorageForm: null,
}

export default OcrMenu;
