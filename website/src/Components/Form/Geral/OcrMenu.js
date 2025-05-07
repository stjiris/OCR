import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import ClickAwayListener from "@mui/material/ClickAwayListener";
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Collapse from "@mui/material/Collapse";
import {ExpandLess, ExpandMore} from "@mui/icons-material";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";

import loadComponent from '../../../utils/loadComponents';
const Notification = loadComponent('Notification', 'Notifications');
//const AlgoDropdown = loadComponent('Dropdown', 'AlgoDropdown');
const ChecklistDropdown = loadComponent('Dropdown', 'ChecklistDropdown');

const defaultLangIndex = 6;  // Português
const tesseractLangList = [
    {"name": "Alemão", "code": "deu"},
    {"name": "Espanhol Castelhano", "code": "spa"},
    {"name": "Francês", "code": "fra"},
    {"name": "Inglês", "code": "eng"},
    {"name": "Módulo de detecção de matemática / equações", "code": "equ"},
    {"name": "Módulo de orientação e detecção de scripts", "code": "osd"},
    {"name": "Português", "code": "por"},
]

const tesseractOutputsList = [
    {"name": "PDF com texto e índice", "code": "pdf_indexed"},
    {"name": "PDF com texto (por defeito)", "code": "pdf"},
    {"name": "Texto", "code": "txt"},
    {"name": "Texto com separador por página", "code": "txt_delimited"},
    {"name": "Índice de palavras", "code": "csv"},
    // {"name": "Entidades (NER)", "code": "ner"},
    {"name": "hOCR (apenas documentos com 1 página)", "code": "hocr"},
    {"name": "ALTO (apenas documentos com 1 página)", "code": "xml"},
]
const defaultOutputs = [tesseractOutputsList[1]];

const defaultEngine = 0;
const engineList = [
    { value: 0, description: "PyTesseract"},
    //{ value: 1, description: "TesserOCR"},
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

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    borderRadius: 2
};

const crossStyle = {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem'
}

class OcrMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            path: "",
            multiple: false,

            advancedOpen: false,
            dpiVal: null,
            engineOptions: engineList,
            engine: defaultEngine,
            engineModeOptions: tesseractModeList,
            engineMode: defaultEngineMode,
            segmentModeOptions: tesseractSegmentList,
            segmentMode: defaultSegmentationMode,
            thresholdMethodOptions: tesseractThreshList,
            thresholdMethod: defaultThresholding,
            otherParams: null,
        }

        this.successNot = React.createRef();
        this.errorNot = React.createRef();
        //this.algoDropdown = React.createRef();

        this.storageMenu = React.createRef();

        this.langs = React.createRef();
        this.outputs = React.createRef();
        this.dpiField = React.createRef();
        this.moreParams = React.createRef();

        // handler to close OCR menu on click outside box
        this.handleClickOutsideMenu = this.handleClickOutsideMenu.bind(this);
    }

    handleClickOutsideMenu() {
        if (this.state.open) {
            this.setState({ open: false });
        }
    }

    toggleAdvanced() {
        this.setState({ advancedOpen: !this.state.advancedOpen });
    }

    getConfig() {
        return {
            engine: this.state.engine,
            lang: this.langs.current.getChoiceList().join('+'),
            outputs: this.outputs.current.getChoiceList(),
            engineMode: this.state.engineMode,
            segmentMode: this.state.segmentMode,
            thresholdMethod: this.state.thresholdMethod,
        }
    }

    changeDpi(value) {
        if (isNaN(value)) {
            this.errorNot.current.setMessage("O valor de DPI deve ser um número inteiro!");
            this.errorNot.current.open();
        } else {
            this.setState({dpiVal: Number(value)});
        }
    }

    changeEngine(value) {
        this.setState({ engine: value });
    }

    changeEngineMode(value) {
        this.setState({ engineMode: value });
    }

    changeSegmentationMode(value) {
        this.setState({ segmentMode: value });
    }

    changeThresholdingMethod(value) {
        this.setState({ thresholdMethod: value });
    }

    changeAdditionalParams(value) {
        this.setState({ otherParams: value });
    }

    // PROCESS FUNCTIONS
    /*
    changeAlgorithm(algorithm) {
        //
        //Change the interface when the algorithm is changed
        //

        if (algorithm === "Tesseract") {
            this.langs.current.setChoice(tesseractChoice);
            this.langs.current.setOptions(tesseractLangList);
        } else {
            this.langs.current.setChoice(easyOCRChoice);
            this.langs.current.setOptions(easyOCRLangList);
        }
    }
    */

    /**
     * Request OCR of the file on the given path from the backend
     */
    performOCR(algorithm = null, config = null, path = null, multiple = null) {
        //if (algorithm === null) algorithm = this.algoDropdown.current.getChoice();
        if (config === null) config = this.getConfig();
        console.log(this.state.dpiVal);
        if (this.state.dpiVal && this.state.dpiVal != "") {
            config.dpi = this.state.dpiVal;
        }
        if (this.state.otherParams && this.state.otherParams != "") {
            config.otherParams = this.state.otherParams;
        }

        if (path === null) path = this.state.path;
        if (multiple === null) multiple = this.state.multiple;

        fetch(process.env.REACT_APP_API_URL + 'perform-ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "path": path.replace(/^\//, ''),
                "config": config,
                "multiple": multiple,
                "_private": this.props._private
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.props.updateFiles(data.files)

                this.successNot.current.setMessage(data.message);
                this.successNot.current.open();
            } else {
                if (data.error) {
                    this.props.showStorageForm(data.error);
                } else {
                    this.errorNot.current.setMessage(data.message);
                    this.errorNot.current.open();
                }
            }

            this.props.updateFiles(data.files)

            this.setState({ open: false });
        });
    }

    render() {
        return (
        <Box>
            <Notification message={""} severity={"success"} ref={this.successNot}/>
            <Notification message={""} severity={"error"} ref={this.errorNot}/>

            <Modal open={this.state.open}>
                <ClickAwayListener
                    mouseEvent="onMouseDown"
                    touchEvent="onTouchStart"
                    onClickAway={this.handleClickOutsideMenu}
                >
                    <Box role="presentation" sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Realizar o OCR
                        </Typography>

                        <p style={{color: 'red'}}><b>Se já fez o OCR antes, irá perder todas as alterações anteriormente feitas</b></p>

                        {
                        //<AlgoDropdown ref={this.algoDropdown} menu={this}/>
                        }

                        <ChecklistDropdown ref={this.langs}
                                           label={"Língua"}
                                           helperText={"Para melhores resultados, selecione por ordem de relevância"}
                                           options={tesseractLangList}
                                           defaultChoice={[tesseractLangList[defaultLangIndex]]}/>

                        <ChecklistDropdown ref={this.outputs}
                                           label={"Formatos de resultado"}
                                           options={tesseractOutputsList}
                                           defaultChoice={defaultOutputs}
                                           allowCheckAll={true}/>

                        <Button onClick={() => this.toggleAdvanced()}>
                            Opções avançadas
                            {this.state.advancedOpen ? <ExpandLess/> : <ExpandMore/>}
                        </Button>
                        <Collapse sx={{display: 'flex', flexDirection: 'column'}} in={this.state.advancedOpen}>

                            <TextField ref={this.dpiField}
                                       label="DPI (Dots Per Inch)"
                                       inputProps={{ inputMode: "numeric", pattern: "[1-9][0-9]*" }}
                                       onChange={(e) => this.changeDpi(e.target.value)}
                                       variant='outlined'
                                       size="small"
                                       sx={{
                                           width: '100%',
                                           mb: '0.3rem',
                                           "& input:focus:invalid + fieldset": {borderColor: "red", borderWidth: 2}
                                        }}
                            />

                            <FormControl className="simpleDropdown">
                                <InputLabel>Motor de OCR</InputLabel>
                                <Select
                                    label={"Motor de OCR"}
                                    value={this.state.engine}
                                    onChange={(e) => this.changeEngine(e.target.value)}>
                                    {
                                        this.state.engineOptions.map((item) => (
                                            <MenuItem value={item.value}>
                                                {item.description}
                                            </MenuItem>
                                        ))
                                    }
                                </Select>
                            </FormControl>

                            <FormControl className="simpleDropdown">
                                <InputLabel>Modo do motor</InputLabel>
                                <Select
                                    label={"Modo do motor"}
                                    value={this.state.engineMode}
                                    onChange={(e) => this.changeEngineMode(e.target.value)}>
                                    {
                                        this.state.engineModeOptions.map((item) => (
                                            <MenuItem value={item.value}>
                                                {item.description}
                                            </MenuItem>
                                        ))
                                    }
                                </Select>
                            </FormControl>

                            <FormControl className="simpleDropdown">
                                <InputLabel>Segmentação</InputLabel>
                                <Select
                                    label={"Segmentação"}
                                    value={this.state.segmentMode}
                                    onChange={(e) => this.changeSegmentationMode(e.target.value)}>
                                    {
                                        this.state.segmentModeOptions.map((item) => (
                                            <MenuItem value={item.value}>
                                                {item.description}
                                            </MenuItem>
                                        ))
                                    }
                                </Select>
                            </FormControl>

                            <FormControl className="simpleDropdown">
                                <InputLabel>Thresholding</InputLabel>
                                <Select
                                    label={"Thresholding"}
                                    value={this.state.thresholdMethod}
                                    onChange={(e) => this.changeThresholdingMethod(e.target.value)}>
                                    {
                                        this.state.thresholdMethodOptions.map((item) => (
                                            <MenuItem value={item.value}>
                                                {item.description}
                                            </MenuItem>
                                        ))
                                    }
                                </Select>
                            </FormControl>

                            <TextField ref={this.moreParams}
                                       label="Parâmetros adicionais"
                                       onChange={(e) => this.changeAdditionalParams(e.target.value)}
                                       variant='outlined' size="small" sx={{width: '100%', mb: '0.3rem'}}/>
                        </Collapse>

                        <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                            <Button variant="contained" onClick={() => this.performOCR()}>
                                Começar
                            </Button>
                        </Box>

                        <IconButton sx={crossStyle} aria-label="close" onClick={() => this.setState({ open: false })}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>
                </ClickAwayListener>
            </Modal>
        </Box>
        );
    }
}

OcrMenu.defaultProps = {
    _private: false,
    // functions:
    updateFiles: null,
    showStorageForm: null
}

export default OcrMenu;
