import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import Notification from '../Notification/Notifications';

import AlgoDropdown from '../Dropdown/AlgoDropdown';
import ChecklistDropdown from '../Dropdown/ChecklistDropdown';

const tesseractChoice = [{"name": "Português", "code": "por"}]
const tesseractLangList = [
    {"name": "Africanês", "code": "afr"},
    {"name": "Albanês", "code": "sqi"},
    {"name": "Alemão", "code": "deu"},
    {"name": "Alemão - Fraktur", "code": "frk"},
    {"name": "Amárico", "code": "amh"},
    {"name": "Árabe", "code": "ara"},
    {"name": "Armênio", "code": "hye"},
    {"name": "Assamês", "code": "asm"},
    {"name": "Azerbaijão - Cirílico", "code": "aze_cyrl"},
    {"name": "Azerbaijão", "code": "aze"},
    {"name": "Basco", "code": "eus"},
    {"name": "Bengalês", "code": "ben"},
    {"name": "Bielorrusso", "code": "bel"},
    {"name": "Birmanês", "code": "mya"},
    {"name": "Breton", "code": "bre"},
    {"name": "Bósnio", "code": "bos"},
    {"name": "Búlgaro", "code": "bul"},
    {"name": "Catalão; Valenciano", "code": "cat"},
    {"name": "Cazaque", "code": "kaz"},
    {"name": "Cebuana Cebuano", "code": "ceb"},
    {"name": "Cherokee", "code": "chr"},
    {"name": "Chinês Simplificado", "code": "chi_sim"},
    {"name": "Chinês Tradicional", "code": "chi_tra"},
    {"name": "Coreano", "code": "kor"},
    {"name": "Coreano (vertical)", "code": "kor_vert"},
    {"name": "Córsega", "code": "cos"},
    {"name": "Crioulo Haitiano", "code": "hat"},
    {"name": "Croata", "code": "hrv"},
    {"name": "Dinamarquês", "code": "dan"},
    {"name": "Dzongkha", "code": "dzo"},
    {"name": "Pashto", "code": "pus"},
    {"name": "Eslovaco", "code": "slk"},
    {"name": "Esloveno", "code": "slv"},
    {"name": "Espanhol Castelhano", "code": "spa"},
    {"name": "Espanhol Castelhano - velho", "code": "spa_old"},
    {"name": "Esperanto", "code": "epo"},
    {"name": "Estoniano", "code": "est"},
    {"name": "Faroese", "code": "fao"},
    {"name": "Filipino (velho - tagalo)", "code": "fil"},
    {"name": "Finlandês", "code": "fin"},
    {"name": "Francês", "code": "fra"},
    {"name": "Francês (ca.1400-1600)", "code": "frm"},
    {"name": "Frísico ocidental", "code": "fry"},
    {"name": "Galego", "code": "glg"},
    {"name": "Gaélico Escocês", "code": "gla"},
    {"name": "Galês", "code": "cym"},
    {"name": "Georgiano", "code": "kat"},
    {"name": "Georgiano - velho", "code": "kat_old"},
    {"name": "Grego antigo (para 1453)", "code": "grc"},
    {"name": "Grego moderno (1453-)", "code": "ell"},
    {"name": "Guzerate", "code": "guj"},
    {"name": "Hebraico", "code": "heb"},
    {"name": "Hindi", "code": "hin"},
    {"name": "Holandês", "code": "nld"},
    {"name": "Húngaro", "code": "hun"},
    {"name": "Iídiche", "code": "yid"},
    {"name": "Indonésio", "code": "ind"},
    {"name": "Inglês", "code": "eng"},
    {"name": "Inglês (1100-1500)", "code": "enm"},
    {"name": "Inuktitut", "code": "iku"},
    {"name": "Ioruba", "code": "yor"},
    {"name": "Irlandês", "code": "gle"},
    {"name": "Islandês", "code": "isl"},
    {"name": "Italiano", "code": "ita"},
    {"name": "Italiano - velho", "code": "ita_old"},
    {"name": "Japonês", "code": "jpn"},
    {"name": "Javanês", "code": "jav"},
    {"name": "Kannada", "code": "kan"},
    {"name": "Khmer central", "code": "khm"},
    {"name": "Kyrgyz", "code": "kir"},
    {"name": "Kurmanji (curdo - script latino)", "code": "kmr"},
    {"name": "Laos", "code": "lao"},
    {"name": "Latim", "code": "lat"},
    {"name": "Letão", "code": "lav"},
    {"name": "Lituano", "code": "lit"},
    {"name": "Luxemburgo", "code": "ltz"},
    {"name": "Macedónio", "code": "mkd"},
    {"name": "Malaio", "code": "msa"},
    {"name": "Malaiala", "code": "mal"},
    {"name": "Maltês", "code": "mlt"},
    {"name": "Maori", "code": "mri"},
    {"name": "Marathi", "code": "mar"},
    {"name": "Módulo de detecção de matemática / equações", "code": "equ"},
    {"name": "Módulo de orientação e detecção de scripts", "code": "osd"},
    {"name": "Mongol", "code": "mon"},
    {"name": "Nepalês", "code": "nep"},
    {"name": "Norueguês", "code": "nor"},
    {"name": "Occitan (Após 1500)", "code": "oci"},
    {"name": "Oriya", "code": "ori"},
    {"name": "Persa", "code": "fas"},
    {"name": "Polonês", "code": "pol"},
    {"name": "Português", "code": "por"},
    {"name": "Punjabi", "code": "pan"},
    {"name": "Quechua", "code": "que"},
    {"name": "Romena", "code": "ron"},
    {"name": "Russo", "code": "rus"},
    {"name": "Sindhi", "code": "snd"},
    {"name": "Sinhala", "code": "sin"},
    {"name": "Siríaco", "code": "syr"},
    {"name": "Suaíli", "code": "swa"},
    {"name": "Sueco", "code": "swe"},
    {"name": "Sundanês", "code": "sun"},
    {"name": "Sânscrito", "code": "san"},
    {"name": "Sérvio", "code": "srp"},
    {"name": "Sérvio - latim", "code": "srp_latn"},
    {"name": "Tailandês", "code": "tha"},
    {"name": "Tajique", "code": "tgk"},
    {"name": "Tâmil", "code": "tam"},
    {"name": "Tatar", "code": "tat"},
    {"name": "Tcheco", "code": "ces"},
    {"name": "Telugu", "code": "tel"},
    {"name": "Tibetano", "code": "bod"},
    {"name": "Tigrinya", "code": "tir"},
    {"name": "Tonga", "code": "ton"},
    {"name": "Turco", "code": "tur"},
    {"name": "Ucraniano", "code": "ukr"},
    {"name": "Uigur", "code": "uig"},
    {"name": "Urdu", "code": "urd"},
    {"name": "Uzbek", "code": "uzb"},
    {"name": "Uzbek - Cirílico", "code": "uzb_cyrl"},
    {"name": "Vietnamita", "code": "vie"}
  ]

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

            filesystem: props.filesystem,

            languageOptions: tesseractLangList,
            languageChoice: tesseractChoice
        }

        this.successNot = React.createRef();
        this.errorNot = React.createRef();
        this.algoDropdown = React.createRef();

        this.langs = React.createRef();
    }

    // SETTERS
    currentPath(path) { this.setState({ path: path }) }
    setMultiple(multiple) { this.setState({ multiple: multiple }) }
    toggleOpen() { this.setState({ open: !this.state.open }) }

    // PROCESS FUNCTIONS
    changeAlgorithm(algorithm) {
        /**
         * Change the interface when the algorithm is changed
         */

        if (algorithm === "Tesseract") {
            this.langs.current.setChoice(tesseractChoice);
            this.langs.current.setOptions(tesseractLangList);
        } else {
            this.langs.current.setChoice(easyOCRChoice);
            this.langs.current.setOptions(easyOCRLangList);
        }
    }

    performOCR(algorithm = null, config = null, path = null, multiple = null) {
        /**
         * Request the OCR to the backend
         */
        if (algorithm === null) algorithm = this.algoDropdown.current.getChoice();
        if (config === null) config = this.langs.current.getChoiceList();
        if (path === null) path = this.state.path;
        if (multiple === null) multiple = this.state.multiple;

        fetch(process.env.REACT_APP_API_URL + 'perform-ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "path": path,
                "algorithm": algorithm,
                "config": config,
                "multiple": multiple
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.state.filesystem.updateFiles(data.files)

                this.successNot.current.setMessage(data.message);
                this.successNot.current.open();
            } else {
                this.errorNot.current.setMessage(data.message);
                this.errorNot.current.open();
            }

            this.state.filesystem.updateFiles(data.files)
            this.setState({ open: false });
        });
    }

    render() {
        return (
            <Box>
                <Notification message={""} severity={"success"} ref={this.successNot}/>
                <Notification message={""} severity={"error"} ref={this.errorNot}/>

                <Modal open={this.state.open}>
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Realizar o OCR
                        </Typography>

                        <p style={{color: 'red'}}><b>Se já fez o OCR antes, irá perder todas as alterações anteriormente feitas</b></p>

                        <AlgoDropdown ref={this.algoDropdown} menu={this}/>

                        <ChecklistDropdown ref={this.langs} label={"Língua"} options={tesseractLangList} choice={tesseractChoice}/>

                        <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                            <Button
                                variant="contained"
                                sx={{border: '1px solid black', mr: '1rem', backgroundColor: '#e5de00', color: '#000', ':hover': {bgcolor: '#e6cc00'}}}
                                onClick={() => this.performOCR()}
                            >
                                Começar
                            </Button>
                        </Box>

                        <IconButton sx={crossStyle} aria-label="close" onClick={() => this.toggleOpen()}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>
                </Modal>
            </Box>
        )
    }
}

export default OcrMenu;
