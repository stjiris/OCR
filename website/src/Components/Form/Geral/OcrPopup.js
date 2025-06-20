import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ClickAwayListener from "@mui/material/ClickAwayListener";

import loadComponent from '../../../utils/loadComponents';
const Notification = loadComponent('Notifications', 'Notification');

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;
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

            path: "",
            filename: null,
            isFolder: false,
            alreadyOcr: false,
            customConfig: null,
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

    openMenu(path, filename, isFolder=false, alreadyOcr=false, customConfig=null) {
        this.setState({
            open: true,
            path: path,
            filename: filename,
            isFolder: isFolder,
            alreadyOcr: alreadyOcr,
            customConfig: customConfig,
        });
    }

    closeMenu(callback = null) {
        this.setState({
            open: false,
            path: "",
            filename: null,
            isFolder: false,
            alreadyOcr: false,
            customConfig: null,
        }, callback);
    }

    /**
     * Request OCR of the file on the given path from the backend
     */
    performOCR() {
        const path = this.state.path + '/' + this.state.filename;
        const body = {
            "path": path,
            "multiple": this.state.isFolder,
            "_private": this.props._private
        }
        if (this.state.customConfig) {
            body["config"] = this.state.customConfig;
        }

        fetch(API_URL + '/perform-ocr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.successNot.current.openNotif(data.message);
                } else {
                    if (data.error) {
                        this.props.showStorageForm(data.error);
                    } else {
                        this.errorNot.current.openNotif(data.message);
                    }
                }

                this.closeMenu(this.props.submitCallback);
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
    // functions:
    submitCallback: null,
    showStorageForm: null,
}

export default OcrPopup;
