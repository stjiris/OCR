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

class DeletePopup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            path: "",
            filename: null,
            buttonDisabled: false
        }

        this.textField = React.createRef();
        this.successNot = React.createRef();
        this.errorNot = React.createRef();

        // handler to close menu on click outside box
        this.handleClickOutsideMenu = this.handleClickOutsideMenu.bind(this);
    }

    handleClickOutsideMenu() {
        if (this.state.open) {
            this.closeMenu();
        }
    }

    openMenu(path, filename) {
        this.setState({ open: true, path: path, filename: filename });
    }

    closeMenu(callback = null) {
        this.setState({ open: false }, callback);
    }

    deleteItem() {
        this.setState({ buttonDisabled: true });
        const path = this.state.path + '/' + this.state.filename;
        fetch(API_URL + '/delete-path', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "path": path,
                "_private": this.props._private
            })
        })
        .then(response => {return response.json()})
        .then(data => {
            this.setState({ buttonDisabled: false });
            if (data.success) {
                this.successNot.current.openNotif(data.message);

                this.closeMenu(this.props.submitCallback);
            } else {
                this.errorNot.current.openNotif(data.error);
            }
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
                                Tem a certeza que quer apagar <b>{this.state.filename}</b>?
                            </Typography>

                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'row'
                            }}>
                                <Button
                                    disabled={this.state.buttonDisabled}
                                    color="error"
                                    variant="contained"
                                    sx={{border: '1px solid black', mt: '0.5rem'}}
                                    onClick={() => this.deleteItem()}
                                >
                                    Apagar
                                </Button>
                            </Box>

                            <IconButton disabled={this.state.buttonDisabled} sx={crossStyle} aria-label="close" onClick={() => this.closeMenu()}>
                                <CloseRoundedIcon />
                            </IconButton>
                        </Box>
                    </ClickAwayListener>
                </Modal>
            </Box>
        )
    }
}

DeletePopup.defaultProps = {
    _private: false,
    // functions:
    submitCallback: null,
}

export default DeletePopup;
