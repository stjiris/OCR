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

import { PDFDocument } from "pdf-lib";

var BASE_URL = 'http://localhost:5001/'

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
            textFieldValue: "",
            buttonDisabled: false,

            filesystem: props.filesystem,
            pageContents: []
        }

        this.textField = React.createRef();
        this.successNot = React.createRef();
        this.errorNot = React.createRef();
        this.algoDropdown = React.createRef();

        this.tesseractLangs = React.createRef();
        this.easyLangs = React.createRef();
        this.loadingWheel = React.createRef();
    }

    currentPath(path) {
        this.setState({ path: path });
    }

    toggleOpen() {
        this.setState({ open: !this.state.open });
    }

    textFieldUpdate = event => {
        this.setState({ textFieldValue: event.target.value });
    }

    changeAlgorithm(algorithm) {
        if (algorithm === "Tesseract") {
            this.tesseractLangs.current.setVisible();
            this.easyLangs.current.setInvisible();
        } else {
            this.tesseractLangs.current.setInvisible();
            this.easyLangs.current.setVisible();
        }
    }

    // FILES FUNCTIONS
    createEmptyArray(size) {
        var emptyContents = []
        for (var i = 0; i < size; i++) {
            emptyContents.push("");
        }
        return emptyContents;
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = () => {
                resolve(reader.result);
            }
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async extractPdfPage(pdfSrcDoc, page) {
        const pdfNewDoc = await PDFDocument.create();
        const pages = await pdfNewDoc.copyPages(pdfSrcDoc, [page]);
        pages.forEach(page => pdfNewDoc.addPage(page));
        const newPdf = await pdfNewDoc.save();
        return newPdf;
    }

    i2hex(i) {
        return ('0' + i.toString(16)).slice(-2);
    }

    fileSubmitted() {
        var progress = this.isComplete();
        
        this.loadingWheel.current.setProgress(progress);

        if (progress === 100.00) {
            this.loadingWheel.current.hide();

            this.successNot.current.setMessage("File submitted with success");
            this.successNot.current.open();
            this.setState({open: false, buttonDisabled: false});
        }
    }

    isComplete() {
        var notEmpty = 0;
        for (var i = 0; i < this.state.pageContents.length; i++) {
            if (this.state.pageContents[i] !== "") {
                notEmpty += 1;
            }
        }
        return 100 * notEmpty / this.state.pageContents.length;
    }

    submitFile() {
        let algorithm = this.algoDropdown.current.state.algorithm;
        let config = "";

        if (algorithm === "Tesseract") {
            config = this.tesseractLangs.current.getChoice();
        } else {
            config = this.easyLangs.current.getChoice();
        }

        var el = window._protected_reference = document.createElement("INPUT");
        el.type = "file";
        el.accept = ".pdf";
            
        el.addEventListener('change', () => {
    
            // test some async handling
            new Promise(() => {
                setTimeout(async () => {

                    this.loadingWheel.current.show();
                    this.setState({ buttonDisabled: true });

                    if (el.files.length === 0) return;

                    const pdfArrayBuffer = await this.readFile(el.files[0]);
                    const pdfSrcDoc = await PDFDocument.load(pdfArrayBuffer);

                    this.setState({pageContents: this.createEmptyArray(pdfSrcDoc.getPageCount())})

                    fetch(BASE_URL + 'file-exists?path=' + this.state.path + '&file=' + el.files[0].name, {
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
                            for (let i = 0; i < pdfSrcDoc.getPageCount(); i++) {
                                const newPdfDoc = await this.extractPdfPage(pdfSrcDoc, i);
        
                                fetch(BASE_URL + 'submitFile', {
                                    method: 'POST',
                                    headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json',
                                        'Access-Control-Allow-Origin': '*',
                                        'Access-Control-Allow-Methods': 'DELETE, POST, GET, OPTIONS',
                                        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
                                    },
                                    body: JSON.stringify({
                                        file: Array.from(newPdfDoc).map(this.i2hex).join(''),
                                        filename: el.files[0].name,
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
            
                                        var currentContents = this.state.pageContents;
                                        currentContents[page - 1] = data["text"]
                                        this.setState({pageContents: currentContents}, this.fileSubmitted);
                                    } else {
                                        this.errorNot.current.setMessage(data.error);
                                        this.errorNot.current.open();
                                        this.loadingWheel.current.hide();
                                        this.setState({ buttonDisabled: false });
                                    }
                                })
                            }
                        }

                    })


                }, 1000);
            })
            .then(function() {
                // clear / free reference
                el = window._protected_reference = undefined;
                return null;
            });
        });
        el.click(); // open
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

                        <AlgoDropdown ref={this.algoDropdown} menu={this}/>

                        <ChecklistDropdown ref={this.tesseractLangs}/>
                        <LangDropdown ref={this.easyLangs}/>

                        <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', mt: '0.5rem'}}>
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