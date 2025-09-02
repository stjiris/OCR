import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import Notification from 'Components/Notifications/Geral/Notification';

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;

const folderNameRegex = /(^[_\/\\].*)|(.*[\/\\].*)/;

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

class FolderMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            path: "",
            textFieldValue: "",
            buttonDisabled: false,
        }

        this.textField = React.createRef();
        this.successNot = React.createRef();
        this.errorNot = React.createRef();
    }

    openMenu(path) {
        this.setState({ path: path, open: true });
    }

    closeMenu(callback = null) {
        this.setState({ open: false }, callback);
    }

    textFieldUpdate = event => {
        this.setState({ textFieldValue: event.target.value });
    }

    createFolder() {
        this.setState({ buttonDisabled: true });
        fetch(API_URL + '/create-folder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "path": this.state.path,
                "folder": this.state.textFieldValue,
                "_private": this.props._private
            })
        })
        .then(response => {return response.json()})
        .then(data => {
            this.setState({ buttonDisabled: false });
            if (data.success) {
                this.successNot.current.openNotif("Pasta criada com sucesso");

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
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Crie uma nova pasta
                        </Typography>
                        <TextField
                            ref={this.textField}
                            label="Nome da pasta"
                            error={folderNameRegex.test(this.state.textFieldValue)}
                            helperText="O nome não pode começar por '_' nem conter '/' ou '\'"
                            onChange={this.textFieldUpdate}
                            onKeyUp={e => { if (e.key === 'Enter') { this.createFolder() }}}
                            variant="outlined"
                            sx={{width: '100%', mt: '0.5rem'}}
                        />
                        <Button
                            disabled={this.state.buttonDisabled || folderNameRegex.test(this.state.textFieldValue)}
                            variant="contained"
                            sx={{border: '1px solid black', mt: '0.5rem', mr: '1rem'}}
                            onClick={() => this.createFolder()}
                        >
                            Criar
                        </Button>

                        <IconButton disabled={this.state.buttonDisabled} sx={crossStyle} aria-label="close" onClick={() => this.closeMenu()}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>
                </Modal>
            </Box>
        )
    }
}

FolderMenu.defaultProps = {
    _private: false,
    // functions:
    submitCallback: null,
}

export default FolderMenu;
