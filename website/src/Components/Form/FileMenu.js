import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import AlgoDropdown from '../Dropdown/AlgoDropdown';
import Notification from '../Notification/Notifications';

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

            filesystem: props.filesystem,
            language: <ChecklistDropdown />
        }

        this.textField = React.createRef();
        this.successNot = React.createRef();
        this.errorNot = React.createRef();
        this.algoDropdown = React.createRef();

        this.tesseractLangs = React.createRef();
        this.easyLangs = React.createRef();
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

    createFile() {
        let algorithm = this.algoDropdown.current.state.algorithm;
        let config = "";

        if (algorithm === "Tesseract") {
            config = this.tesseractLangs.current.getChoice();
        } else {
            config = this.easyLangs.current.getChoice();
        }

        console.log(algorithm, config);

        var el = window._protected_reference = document.createElement("INPUT");
        el.type = "file";
        el.accept = ".pdf";
            
        el.addEventListener('change', () => {
    
            // test some async handling
            new Promise(() => {
                setTimeout(async () => {
                    // this.loadingWheel.current.show();
                    // this.setState({disabled: true, backDisabled: true, frontDisabled: true});
                    // this.saveButton.current.changeDisabledState(true);
                    // this.fileButton.current.changeDisabledState(true);

                    if (el.files.length === 0) return;

                    const pdfArrayBuffer = await this.readFile(el.files[0]);
                    const pdfSrcDoc = await PDFDocument.load(pdfArrayBuffer);

                    // this.setState({contents: this.createEmptyArray(pdfSrcDoc.getPageCount())})

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
                            // this.uploadedFile.current.innerHTML = data["file"];
                            var page = data["page"];
                            console.log(page);
                            // var currentContents = this.state.contents;
                            // currentContents[page - 1] = data["text"]
                            // this.setState({contents: currentContents, disabled: false, backDisabled: true, frontDisabled: true, page: 1}, this.fileSubmited);
                        })
                    }
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

                        <Button
                            variant="contained"
                            sx={{border: '1px solid black', mt: '0.5rem', mr: '1rem', mb: '0.5rem'}}
                            onClick={() => this.createFile()}
                        >
                            Create
                        </Button>

                        <IconButton sx={crossStyle} aria-label="close" onClick={() => this.toggleOpen()}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>
                </Modal>
            </Box>
        )
    }
}

export default FileMenu;