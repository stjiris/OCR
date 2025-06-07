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

class DeletePopup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
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

    openMenu(filename) {
        this.setState({ open: true, filename: filename });
    }

    closeMenu() {
        this.setState({ open: false, filename: null });
    }

    deleteItem() {
        this.setState({ buttonDisabled: true });
        const path = (this.props.sessionId + '/' + this.props.current_folder + '/' + this.state.filename)
            .replace(/^\//, '');
        fetch(process.env.REACT_APP_API_URL + 'delete-path', {
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
                this.props.updateFiles(data.files);

                this.successNot.current.setMessage(data.message);
                this.successNot.current.open();

                this.closeMenu();
            } else {
                this.errorNot.current.setMessage(data.error);
                this.errorNot.current.open();
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
    sessionId: null,
    current_folder: null,
    // functions:
    updateFiles: null
}

export default DeletePopup;
