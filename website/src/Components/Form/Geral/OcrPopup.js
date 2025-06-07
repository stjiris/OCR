import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ClickAwayListener from "@mui/material/ClickAwayListener";

import loadComponent from '../../../utils/loadComponents';
const Notification = loadComponent('Notification', 'Notifications');

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'fit-content',
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

class OcrPopup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,

            current_folder: null,
            filename: null,
            isFolder: false,
            alreadyOcr: false,

            //languageChoice: [tesseractLangList[defaultLangIndex]],

            dpiVal: null,
            //engine: defaultEngine,
            //engineMode: defaultEngineMode,
            //segmentMode: defaultSegmentationMode,
            //thresholdMethod: defaultThresholding,
            otherParams: null,
        }

        this.successNot = React.createRef();
        this.errorNot = React.createRef();
        //this.algoDropdown = React.createRef();

        this.storageMenu = React.createRef();

        this.langs = React.createRef();
        this.dpiField = React.createRef();
        this.moreParams = React.createRef();

        // handler to close menu on click outside box
        this.handleClickOutsideMenu = this.handleClickOutsideMenu.bind(this);
    }

    handleClickOutsideMenu() {
        if (this.state.open) {
            this.closeMenu();
        }
    }

    openMenu(filename, isFolder, alreadyOcr) {
        this.setState({
            open: true,
            filename: filename,
            isFolder: isFolder,
            alreadyOcr: alreadyOcr,
        });
    }

    closeMenu() {
        this.setState({
            open: false,
            filename: null,
            isFolder: false,
            alreadyOcr: false,
        });
    }

    getConfig() {
        return {
            engine: this.state.engine,
            lang: this.langs.current.getChoiceList().join('+'),
            engineMode: this.state.engineMode,
            segmentMode: this.state.segmentMode,
            thresholdMethod: this.state.thresholdMethod,
        }
    }

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

        if (multiple === null) multiple = this.state.isFolder;

        if (path == null) {
            path = (this.props.sessionId + '/' + this.props.current_folder + '/' + this.state.filename)
                    .replace(/^\//, '');
        }

        fetch(process.env.REACT_APP_API_URL + 'perform-ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "path": path,
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
                        <Box sx={style}>
                            <Typography id="modal-modal-title" variant="h6" component="h2">
                                Realizar OCR {this.state.isFolder ? 'da pasta' : 'do ficheiro'} <b>{this.state.filename}</b>
                            </Typography>

                            {this.state.alreadyOcr
                                && <p style={{color: 'red'}}><b>Irá perder os resultados e alterações anteriores!</b></p>
                            }

                            <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                                <Button variant="contained" onClick={() => this.performOCR()}>
                                    Começar
                                </Button>
                            </Box>

                            <IconButton sx={crossStyle} aria-label="close" onClick={() => this.closeMenu()}>
                                <CloseRoundedIcon />
                            </IconButton>
                        </Box>
                    </ClickAwayListener>
                </Modal>
            </Box>
        )
    }
}

OcrPopup.defaultProps = {
    _private: false,
    sessionId: "",
    current_folder: null,
    // functions:
    updateFiles: null,
    showStorageForm: null
}

export default OcrPopup;
