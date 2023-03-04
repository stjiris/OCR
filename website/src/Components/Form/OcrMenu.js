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

const tesseractChoice = [{"name": "Portuguese", "code": "por"}]
const tesseractLangList = [
    {"name": "Afrikaans", "code": "afr"},
    {"name": "Amharic", "code": "amh"},
    {"name": "Arabic", "code": "ara"},
    {"name": "Assamese", "code": "asm"},
    {"name": "Azerbaijani", "code": "aze"},
    {"name": "Azerbaijani - Cyrilic", "code": "aze_cyrl"},
    {"name": "Belarusian", "code": "bel"},
    {"name": "Bengali", "code": "ben"},
    {"name": "Tibetan", "code": "bod"},
    {"name": "Bosnian", "code": "bos"},
    {"name": "Breton", "code": "bre"},
    {"name": "Bulgarian", "code": "bul"},
    {"name": "Catalan; Valencian", "code": "cat"},
    {"name": "Cebuano", "code": "ceb"},
    {"name": "Czech", "code": "ces"},
    {"name": "Chinese - Simplified", "code": "chi_sim"},
    {"name": "Chinese - Traditional", "code": "chi_tra"},
    {"name": "Cherokee", "code": "chr"},
    {"name": "Corsican", "code": "cos"},
    {"name": "Welsh", "code": "cym"},
    {"name": "Danish", "code": "dan"},
    {"name": "German", "code": "deu"},
    {"name": "Dzongkha", "code": "dzo"},
    {"name": "Greek, Modern (1453-)", "code": "ell"},
    {"name": "English", "code": "eng"},
    {"name": "English, Middle (1100-1500)", "code": "enm"},
    {"name": "Esperanto", "code": "epo"},
    {"name": "Math / equation detection module", "code": "equ"},
    {"name": "Estonian", "code": "est"},
    {"name": "Basque", "code": "eus"},
    {"name": "Faroese", "code": "fao"},
    {"name": "Persian", "code": "fas"},
    {"name": "Filipino (old - Tagalog)", "code": "fil"},
    {"name": "Finnish", "code": "fin"},
    {"name": "French", "code": "fra"},
    {"name": "German - Fraktur", "code": "frk"},
    {"name": "French, Middle (ca.1400-1600)", "code": "frm"},
    {"name": "Western Frisian", "code": "fry"},
    {"name": "Scottish Gaelic", "code": "gla"},
    {"name": "Irish", "code": "gle"},
    {"name": "Galician", "code": "glg"},
    {"name": "Greek, Ancient (to 1453) (contrib)", "code": "grc"},
    {"name": "Gujarati", "code": "guj"},
    {"name": "Haitian; Haitian Creole", "code": "hat"},
    {"name": "Hebrew", "code": "heb"},
    {"name": "Hindi", "code": "hin"},
    {"name": "Croatian", "code": "hrv"},
    {"name": "Hungarian", "code": "hun"},
    {"name": "Armenian", "code": "hye"},
    {"name": "Inuktitut", "code": "iku"},
    {"name": "Indonesian", "code": "ind"},
    {"name": "Icelandic", "code": "isl"},
    {"name": "Italian", "code": "ita"},
    {"name": "Italian - Old", "code": "ita_old"},
    {"name": "Javanese", "code": "jav"},
    {"name": "Japanese", "code": "jpn"},
    {"name": "Kannada", "code": "kan"},
    {"name": "Georgian", "code": "kat"},
    {"name": "Georgian - Old", "code": "kat_old"},
    {"name": "Kazakh", "code": "kaz"},
    {"name": "Central Khmer", "code": "khm"},
    {"name": "Kirghiz; Kyrgyz", "code": "kir"},
    {"name": "Kurmanji (Kurdish - Latin Script)", "code": "kmr"},
    {"name": "Korean", "code": "kor"},
    {"name": "Korean (vertical)", "code": "kor_vert"},
    {"name": "Lao", "code": "lao"},
    {"name": "Latin", "code": "lat"},
    {"name": "Latvian", "code": "lav"},
    {"name": "Lithuanian", "code": "lit"},
    {"name": "Luxembourgish", "code": "ltz"},
    {"name": "Malayalam", "code": "mal"},
    {"name": "Marathi", "code": "mar"},
    {"name": "Macedonian", "code": "mkd"},
    {"name": "Maltese", "code": "mlt"},
    {"name": "Mongolian", "code": "mon"},
    {"name": "Maori", "code": "mri"},
    {"name": "Malay", "code": "msa"},
    {"name": "Burmese", "code": "mya"},
    {"name": "Nepali", "code": "nep"},
    {"name": "Dutch; Flemish", "code": "nld"},
    {"name": "Norwegian", "code": "nor"},
    {"name": "Occitan (post 1500)", "code": "oci"},
    {"name": "Oriya", "code": "ori"},
    {"name": "Orientation and script detection module", "code": "osd"},
    {"name": "Panjabi; Punjabi", "code": "pan"},
    {"name": "Polish", "code": "pol"},
    {"name": "Portuguese", "code": "por"},
    {"name": "Pushto; Pashto", "code": "pus"},
    {"name": "Quechua", "code": "que"},
    {"name": "Romanian; Moldavian; Moldovan", "code": "ron"},
    {"name": "Russian", "code": "rus"},
    {"name": "Sanskrit", "code": "san"},
    {"name": "Sinhala; Sinhalese", "code": "sin"},
    {"name": "Slovak", "code": "slk"},
    {"name": "Slovenian", "code": "slv"},
    {"name": "Sindhi", "code": "snd"},
    {"name": "Spanish; Castilian", "code": "spa"},
    {"name": "Spanish; Castilian - Old", "code": "spa_old"},
    {"name": "Albanian", "code": "sqi"},
    {"name": "Serbian", "code": "srp"},
    {"name": "Serbian - Latin", "code": "srp_latn"},
    {"name": "Sundanese", "code": "sun"},
    {"name": "Swahili", "code": "swa"},
    {"name": "Swedish", "code": "swe"},
    {"name": "Syriac", "code": "syr"},
    {"name": "Tamil", "code": "tam"},
    {"name": "Tatar", "code": "tat"},
    {"name": "Telugu", "code": "tel"},
    {"name": "Tajik", "code": "tgk"},
    {"name": "Thai", "code": "tha"},
    {"name": "Tigrinya", "code": "tir"},
    {"name": "Tonga", "code": "ton"},
    {"name": "Turkish", "code": "tur"},
    {"name": "Uighur; Uyghur", "code": "uig"},
    {"name": "Ukrainian", "code": "ukr"},
    {"name": "Urdu", "code": "urd"},
    {"name": "Uzbek", "code": "uzb"},
    {"name": "Uzbek - Cyrilic", "code": "uzb_cyrl"},
    {"name": "Vietnamese", "code": "vie"},
    {"name": "Yiddish", "code": "yid"},
    {"name": "Yoruba", "code": "yor"}
]

const easyOCRChoice = [{"name": "Portuguese","code": "pt"}]
const easyOCRLangList = [
    {"name": "Abaza","code": "abq"},
    {"name": "Adyghe","code": "ady"},
    {"name": "Afrikaans","code": "af"},
    {"name": "Angika","code": "ang"},
    {"name": "Arabic","code": "ar"},
    {"name": "Assamese","code": "as"},
    {"name": "Avar","code": "ava"},
    {"name": "Azerbaijani","code": "az"},
    {"name": "Belarusian","code": "be"},
    {"name": "Bulgarian","code": "bg"},
    {"name": "Bihari","code": "bh"},
    {"name": "Bhojpuri","code": "bho"},
    {"name": "Bengali","code": "bn"},
    {"name": "Bosnian","code": "bs"},
    {"name": "Simplified Chinese","code": "ch_sim"},
    {"name": "Traditional Chinese","code": "ch_tra"},
    {"name": "Chechen","code": "che"},
    {"name": "Czech","code": "cs"},
    {"name": "Welsh","code": "cy"},
    {"name": "Danish","code": "da"},
    {"name": "Dargwa","code": "dar"},
    {"name": "German","code": "de"},
    {"name": "English","code": "en"},
    {"name": "Spanish","code": "es"},
    {"name": "Estonian","code": "et"},
    {"name": "Persian (Farsi)","code": "fa"},
    {"name": "French","code": "fr"},
    {"name": "Irish","code": "ga"},
    {"name": "Goan Konkani","code": "gom"},
    {"name": "Hindi","code": "hi"},
    {"name": "Croatian","code": "hr"},
    {"name": "Hungarian","code": "hu"},
    {"name": "Indonesian","code": "id"},
    {"name": "Ingush","code": "inh"},
    {"name": "Icelandic","code": "is"},
    {"name": "Italian","code": "it"},
    {"name": "Japanese","code": "ja"},
    {"name": "Kabardian","code": "kbd"},
    {"name": "Kannada","code": "kn"},
    {"name": "Korean","code": "ko"},
    {"name": "Kurdish","code": "ku"},
    {"name": "Latin","code": "la"},
    {"name": "Lak","code": "lbe"},
    {"name": "Lezghian","code": "lez"},
    {"name": "Lithuanian","code": "lt"},
    {"name": "Latvian","code": "lv"},
    {"name": "Magahi","code": "mah"},
    {"name": "Maithili","code": "mai"},
    {"name": "Maori","code": "mi"},
    {"name": "Mongolian","code": "mn"},
    {"name": "Marathi","code": "mr"},
    {"name": "Malay","code": "ms"},
    {"name": "Maltese","code": "mt"},
    {"name": "Nepali","code": "ne"},
    {"name": "Newari","code": "new"},
    {"name": "Dutch","code": "nl"},
    {"name": "Norwegian","code": "no"},
    {"name": "Occitan","code": "oc"},
    {"name": "Pali","code": "pi"},
    {"name": "Polish","code": "pl"},
    {"name": "Portuguese","code": "pt"},
    {"name": "Romanian","code": "ro"},
    {"name": "Russian","code": "ru"},
    {"name": "Serbian (cyrillic)","code": "rs_cyrillic"},
    {"name": "Serbian (latin)","code": "rs_latin"},
    {"name": "Nagpuri","code": "sck"},
    {"name": "Slovak","code": "sk"},
    {"name": "Slovenian","code": "sl"},
    {"name": "Albanian","code": "sq"},
    {"name": "Swedish","code": "sv"},
    {"name": "Swahili","code": "sw"},
    {"name": "Tamil","code": "ta"},
    {"name": "Tabassaran","code": "tab"},
    {"name": "Telugu","code": "te"},
    {"name": "Thai","code": "th"},
    {"name": "Tajik","code": "tjk"},
    {"name": "Tagalog","code": "tl"},
    {"name": "Turkish","code": "tr"},
    {"name": "Uyghur","code": "ug"},
    {"name": "Ukranian","code": "uk"},
    {"name": "Urdu","code": "ur"},
    {"name": "Uzbek","code": "uz"},
    {"name": "Vietnamese","code": "vi"}
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

    performOCR() {
        /**
         * Request the OCR to the backend
         */

        let algorithm = this.algoDropdown.current.getChoice();
        let config = this.langs.current.getChoiceList();

        fetch(process.env.REACT_APP_API_URL + 'perform-ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "path": this.state.path,
                "algorithm": algorithm,
                "config": config,
                "multiple": this.state.multiple
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