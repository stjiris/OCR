import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import ProgressWheel from '../ProgressBar/LoadingProgress';
import Notification from '../Notification/Notifications';

import AlgoDropdown from '../Dropdown/AlgoDropdown';
import ChecklistDropdown from '../Dropdown/ChecklistDropdown';
import LangDropdown from '../Dropdown/LangDropdown';

import { getPageCount, prepareDocument } from './FilePreparation';

const validExtensions = [".pdf", ".jpg", ".jpeg"];

const languages = [
    {"id": 1, "name": "Afrikaans", "code": "afr"},
    {"id": 2, "name": "Amharic", "code": "amh"},
    {"id": 3, "name": "Arabic", "code": "ara"},
    {"id": 4, "name": "Assamese", "code": "asm"},
    {"id": 5, "name": "Azerbaijani", "code": "aze"},
    {"id": 6, "name": "Azerbaijani - Cyrilic", "code": "aze_cyrl"},
    {"id": 7, "name": "Belarusian", "code": "bel"},
    {"id": 8, "name": "Bengali", "code": "ben"},
    {"id": 9, "name": "Tibetan", "code": "bod"},
    {"id": 10, "name": "Bosnian", "code": "bos"},
    {"id": 11, "name": "Breton", "code": "bre"},
    {"id": 12, "name": "Bulgarian", "code": "bul"},
    {"id": 13, "name": "Catalan; Valencian", "code": "cat"},
    {"id": 14, "name": "Cebuano", "code": "ceb"},
    {"id": 15, "name": "Czech", "code": "ces"},
    {"id": 16, "name": "Chinese - Simplified", "code": "chi_sim"},
    {"id": 17, "name": "Chinese - Traditional", "code": "chi_tra"},
    {"id": 18, "name": "Cherokee", "code": "chr"},
    {"id": 19, "name": "Corsican", "code": "cos"},
    {"id": 20, "name": "Welsh", "code": "cym"},
    {"id": 21, "name": "Danish", "code": "dan"},
    {"id": 22, "name": "German", "code": "deu"},
    {"id": 23, "name": "Dzongkha", "code": "dzo"},
    {"id": 24, "name": "Greek, Modern (1453-)", "code": "ell"},
    {"id": 25, "name": "English", "code": "eng"},
    {"id": 26, "name": "English, Middle (1100-1500)", "code": "enm"},
    {"id": 27, "name": "Esperanto", "code": "epo"},
    {"id": 28, "name": "Math / equation detection module", "code": "equ"},
    {"id": 29, "name": "Estonian", "code": "est"},
    {"id": 30, "name": "Basque", "code": "eus"},
    {"id": 31, "name": "Faroese", "code": "fao"},
    {"id": 32, "name": "Persian", "code": "fas"},
    {"id": 33, "name": "Filipino (old - Tagalog)", "code": "fil"},
    {"id": 34, "name": "Finnish", "code": "fin"},
    {"id": 35, "name": "French", "code": "fra"},
    {"id": 36, "name": "German - Fraktur", "code": "frk"},
    {"id": 37, "name": "French, Middle (ca.1400-1600)", "code": "frm"},
    {"id": 38, "name": "Western Frisian", "code": "fry"},
    {"id": 39, "name": "Scottish Gaelic", "code": "gla"},
    {"id": 40, "name": "Irish", "code": "gle"},
    {"id": 41, "name": "Galician", "code": "glg"},
    {"id": 42, "name": "Greek, Ancient (to 1453) (contrib)", "code": "grc"},
    {"id": 43, "name": "Gujarati", "code": "guj"},
    {"id": 44, "name": "Haitian; Haitian Creole", "code": "hat"},
    {"id": 45, "name": "Hebrew", "code": "heb"},
    {"id": 46, "name": "Hindi", "code": "hin"},
    {"id": 47, "name": "Croatian", "code": "hrv"},
    {"id": 48, "name": "Hungarian", "code": "hun"},
    {"id": 49, "name": "Armenian", "code": "hye"},
    {"id": 50, "name": "Inuktitut", "code": "iku"},
    {"id": 51, "name": "Indonesian", "code": "ind"},
    {"id": 52, "name": "Icelandic", "code": "isl"},
    {"id": 53, "name": "Italian", "code": "ita"},
    {"id": 54, "name": "Italian - Old", "code": "ita_old"},
    {"id": 55, "name": "Javanese", "code": "jav"},
    {"id": 56, "name": "Japanese", "code": "jpn"},
    {"id": 57, "name": "Kannada", "code": "kan"},
    {"id": 58, "name": "Georgian", "code": "kat"},
    {"id": 59, "name": "Georgian - Old", "code": "kat_old"},
    {"id": 60, "name": "Kazakh", "code": "kaz"},
    {"id": 61, "name": "Central Khmer", "code": "khm"},
    {"id": 62, "name": "Kirghiz; Kyrgyz", "code": "kir"},
    {"id": 63, "name": "Kurmanji (Kurdish - Latin Script)", "code": "kmr"},
    {"id": 64, "name": "Korean", "code": "kor"},
    {"id": 65, "name": "Korean (vertical)", "code": "kor_vert"},
    {"id": 66, "name": "Lao", "code": "lao"},
    {"id": 67, "name": "Latin", "code": "lat"},
    {"id": 68, "name": "Latvian", "code": "lav"},
    {"id": 69, "name": "Lithuanian", "code": "lit"},
    {"id": 70, "name": "Luxembourgish", "code": "ltz"},
    {"id": 71, "name": "Malayalam", "code": "mal"},
    {"id": 72, "name": "Marathi", "code": "mar"},
    {"id": 73, "name": "Macedonian", "code": "mkd"},
    {"id": 74, "name": "Maltese", "code": "mlt"},
    {"id": 75, "name": "Mongolian", "code": "mon"},
    {"id": 76, "name": "Maori", "code": "mri"},
    {"id": 77, "name": "Malay", "code": "msa"},
    {"id": 78, "name": "Burmese", "code": "mya"},
    {"id": 79, "name": "Nepali", "code": "nep"},
    {"id": 80, "name": "Dutch; Flemish", "code": "nld"},
    {"id": 81, "name": "Norwegian", "code": "nor"},
    {"id": 82, "name": "Occitan (post 1500)", "code": "oci"},
    {"id": 83, "name": "Oriya", "code": "ori"},
    {"id": 84, "name": "Orientation and script detection module", "code": "osd"},
    {"id": 85, "name": "Panjabi; Punjabi", "code": "pan"},
    {"id": 86, "name": "Polish", "code": "pol"},
    {"id": 87, "name": "Portuguese", "code": "por"},
    {"id": 88, "name": "Pushto; Pashto", "code": "pus"},
    {"id": 89, "name": "Quechua", "code": "que"},
    {"id": 90, "name": "Romanian; Moldavian; Moldovan", "code": "ron"},
    {"id": 91, "name": "Russian", "code": "rus"},
    {"id": 92, "name": "Sanskrit", "code": "san"},
    {"id": 93, "name": "Sinhala; Sinhalese", "code": "sin"},
    {"id": 94, "name": "Slovak", "code": "slk"},
    {"id": 95, "name": "Slovenian", "code": "slv"},
    {"id": 96, "name": "Sindhi", "code": "snd"},
    {"id": 97, "name": "Spanish; Castilian", "code": "spa"},
    {"id": 98, "name": "Spanish; Castilian - Old", "code": "spa_old"},
    {"id": 99, "name": "Albanian", "code": "sqi"},
    {"id": 100, "name": "Serbian", "code": "srp"},
    {"id": 101, "name": "Serbian - Latin", "code": "srp_latn"},
    {"id": 102, "name": "Sundanese", "code": "sun"},
    {"id": 103, "name": "Swahili", "code": "swa"},
    {"id": 104, "name": "Swedish", "code": "swe"},
    {"id": 105, "name": "Syriac", "code": "syr"},
    {"id": 106, "name": "Tamil", "code": "tam"},
    {"id": 107, "name": "Tatar", "code": "tat"},
    {"id": 108, "name": "Telugu", "code": "tel"},
    {"id": 109, "name": "Tajik", "code": "tgk"},
    {"id": 110, "name": "Thai", "code": "tha"},
    {"id": 111, "name": "Tigrinya", "code": "tir"},
    {"id": 112, "name": "Tonga", "code": "ton"},
    {"id": 113, "name": "Turkish", "code": "tur"},
    {"id": 114, "name": "Uighur; Uyghur", "code": "uig"},
    {"id": 115, "name": "Ukrainian", "code": "ukr"},
    {"id": 116, "name": "Urdu", "code": "urd"},
    {"id": 117, "name": "Uzbek", "code": "uzb"},
    {"id": 118, "name": "Uzbek - Cyrilic", "code": "uzb_cyrl"},
    {"id": 119, "name": "Vietnamese", "code": "vie"},
    {"id": 120, "name": "Yiddish", "code": "yid"},
    {"id": 121, "name": "Yoruba", "code": "yor"}
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

class FileMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            path: "",
            buttonDisabled: false,

            filesystem: props.filesystem,
            totalPages: 0,
            pages: [],

            file: null,
        }

        this.textField = React.createRef();
        this.successNot = React.createRef();
        this.errorNot = React.createRef();
        this.algoDropdown = React.createRef();
        this.fileSelected = React.createRef();

        this.tesseractLangs = React.createRef();
        this.easyLangs = React.createRef();
        this.loadingWheel = React.createRef();
    }

    // SETTERS
    currentPath(path) { this.setState({ path: path }) }
    toggleOpen() { this.setState({ open: !this.state.open }) }

    // PROCESS FUNCTIONS
    changeAlgorithm(algorithm) {
        /**
         * Change the interface when the algorithm is changed
         */

        if (algorithm === "Tesseract") {
            this.tesseractLangs.current.setVisible();
            this.easyLangs.current.setInvisible();
        } else {
            this.tesseractLangs.current.setInvisible();
            this.easyLangs.current.setVisible();
        }
    }

    createEmptyArray(size) {
        /**
         * Create an empty array of size 'size'
         * 
         * @param {number} size The size of the array
         * 
         * @returns {array} An empty array of size 'size'
         */

        var emptyContents = []
        for (var i = 0; i < size; i++) {
            emptyContents.push("");
        }
        return emptyContents;
    }

    fileSubmitted() {
        /**
         * When dealing with multiple pages, check if all pages have been
         * submitted to the server
         */

        var progress = this.isComplete();
        
        this.loadingWheel.current.setProgress(progress);

        if (progress === 100.00) {
            this.loadingWheel.current.hide();

            this.successNot.current.setMessage("File submitted with success");
            this.successNot.current.open();
            this.setState({open: false, buttonDisabled: false, pages: []});
        }
    }

    isComplete() {
        /**
         * Calculate the progress of the file submission
         * 
         * @returns {number} The percentage of pages that have been submitted
         */

        return 100 * this.state.pages.length / this.state.totalPages;
    }

    async processRequest(filename, algorithm, config) {
        /**
         * Make the POST requests to the server
         * 
         * @param {string} filename The name of the file
         * @param {string} algorithm The algorithm to use
         * @param {string} config The configuration of the algorithm
         */

        this.loadingWheel.current.show();
        this.setState({ buttonDisabled: true });

        var extension = filename.split('.').pop().toLowerCase();

        // Check if the file is an image
        if (["jpg", "jpeg"].includes(extension)) {
            var payload = new FormData();
            payload.append('file', this.state.file);
            payload.append('filename', filename);
            payload.append('algorithm', algorithm);
            payload.append('config', config);
            payload.append('path', this.state.path);

            fetch(process.env.REACT_APP_API_URL + 'submitImageFile', {
                method: 'POST',
                body: payload
            })
            .then(response => {return response.json()})
            .then(data => {
                if (data.success) {
                    var files = data["files"];

                    this.state.filesystem.updateFiles(files);

                    this.setState({totalPages: 1, pages: [1]}, this.fileSubmitted);
                } else {
                    this.errorNot.current.setMessage(data.error);
                    this.errorNot.current.open();
                    this.loadingWheel.current.hide();
                    this.setState({ buttonDisabled: false });
                }
            });

        // Check if the file is a PDF / multi-page document
        } else {
            var pageCount = await getPageCount(this.state.file);
            this.setState({totalPages: pageCount});
    
            for (let i = 0; i < pageCount; i++) {
                var page = await prepareDocument(this.state.file, i);
                fetch(process.env.REACT_APP_API_URL + 'submitFile', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'DELETE, POST, GET, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
                    },
                    body: JSON.stringify({
                        file: page,
                        filename: filename,
                        page: i + 1,
                        algorithm: algorithm,
                        config: config,
                        path: this.state.path
                    })
                })
                .then(response => {return response.json()})
                .then(data => {
                    if (data.success) {
                        var page = data["page"];
                        var files = data["files"];
    
                        this.state.filesystem.updateFiles(files);

                        var pages = this.state.pages;
                        pages.push(page);

                        this.setState({pages: pages}, this.fileSubmitted);
                    } else {
                        this.errorNot.current.setMessage(data.error);
                        this.errorNot.current.open();
                        this.loadingWheel.current.hide();
                        this.setState({ buttonDisabled: false });
                    }
                })
            }
        }
    }

    submitFile() {
        /**
         * Send the file to the server and the OCR algorithm and configuration
         * 
         * Steps:
         * 1. Check if a file is selected
         * 2. Get the algorithm and configuration
         * 3. Send the file to the server
         */

        // 1. Check if a file is selected
        if (this.state.file === null) {
            this.errorNot.current.setMessage("No file selected");
            this.errorNot.current.open();
            return;
        }

        // 2. Get the algorithm and configuration
        let algorithm = this.algoDropdown.current.state.algorithm;

        let algo_abreviation = "";
        let config = "";
        if (algorithm === "Tesseract") {
            algo_abreviation = "TESS";
            config = this.tesseractLangs.current.getChoice();
        } else {
            algo_abreviation = "EASY";
            config = this.easyLangs.current.getChoice();
        }

        // 3. Send the file to the server
        var filename = this.state.file.name;
        var extension = filename.split('.').pop();
        var filename_no_ext = filename.split('.').slice(0, -1).join('.');

        var final_filename = filename_no_ext + "_" + algo_abreviation + "_" + config + "." + extension;

        fetch(process.env.REACT_APP_API_URL + 'file-exists?path=' + this.state.path + '&file=' + final_filename, {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(async (data) => {
            if (!data.success) {
                this.errorNot.current.setMessage(data.error);
                this.errorNot.current.open();
                this.loadingWheel.current.hide();
                this.setState({ buttonDisabled: false });

            } else {

                await this.processRequest(final_filename, algorithm, config);

            }
        })
    }

    selectFile() {
        /**
         * This is a hack to get around the fact that the input type="file" element
         * cannot be accessed from the React code. This is because the element is
         * not rendered by React, but by the browser itself.
         * 
         * Function to select the file to be submitted
         */

        var el = window._protected_reference = document.createElement("INPUT");
        el.type = "file";
        el.accept = validExtensions.join(',');
            
        el.addEventListener('change', () => {
            if (el.files.length === 0) return;

            var filename = el.files[0].name;

            var extension = filename.split('.').pop();
            if (!validExtensions.includes("." + extension)) {
                this.errorNot.current.setMessage("Only PDF, JPG and JPEG files are accepted currently! The file submitted is named " + filename);
                this.errorNot.current.open();
                return;
            }

            this.setState({file: el.files[0]});
            this.fileSelected.current.innerHTML = filename;
        });
        el.click();
    }

    render() {
        return (
            <Box>
                <Notification message={""} severity={"success"} ref={this.successNot}/>
                <Notification message={""} severity={"error"} ref={this.errorNot}/>

                <Modal open={this.state.open}>
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Create a new file
                        </Typography>

                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                            <Button
                                disabled={this.state.buttonDisabled}
                                variant="contained"
                                size="small"
                                sx={{
                                    border: '1px solid black',
                                    mr: '1rem',
                                }}
                                onClick={() => this.selectFile()}
                            >
                                Choose Document
                            </Button>
                            <p ref={this.fileSelected} style={{

                            }}>No file selected</p>
                        </Box>

                        <AlgoDropdown ref={this.algoDropdown} menu={this}/>

                        <ChecklistDropdown ref={this.tesseractLangs} label={"Language"} options={languages} choice={[{"id": 87, "name": "Portuguese", "code": "por"}]}/>
                        <LangDropdown ref={this.easyLangs}/>

                        <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                            <Button
                                disabled={this.state.buttonDisabled}
                                variant="contained"
                                sx={{border: '1px solid black', mr: '1rem'}}
                                onClick={() => this.submitFile()}
                            >
                                Submit
                            </Button>
                            <ProgressWheel ref={this.loadingWheel}/>
                        </Box>

                        <IconButton disabled={this.state.buttonDisabled} sx={crossStyle} aria-label="close" onClick={() => this.toggleOpen()}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>
                </Modal>
            </Box>
        )
    }
}

export default FileMenu;