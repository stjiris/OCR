import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import Notification from '../Notification/Notifications';

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

            filesystem: props.filesystem,
            buttonDisabled: false
        }

        this.textField = React.createRef();
        this.successNot = React.createRef();
        this.errorNot = React.createRef();
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

    createFolder() {
        this.setState({ buttonDisabled: true });
        fetch(process.env.REACT_APP_API_URL + 'create-folder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "path": this.state.path,
                "folder": this.state.textFieldValue
            })
        })
        .then(response => {return response.json()})
        .then(data => {
            this.setState({ buttonDisabled: false });
            if (data.success) {
                this.state.filesystem.updateFiles(data.files);

                this.successNot.current.setMessage("Pasta criada com sucesso");
                this.successNot.current.open();

                this.toggleOpen();
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
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Crie uma nova pasta
                        </Typography>
                        <TextField onChange={this.textFieldUpdate} ref={this.textField} sx={{width: '100%', mt: '0.5rem'}} id="outlined-basic" label="Nome da pasta" variant="outlined" />
                        <Button
                            disabled={this.state.buttonDisabled}
                            color="success"
                            variant="contained"
                            sx={{border: '1px solid black', mt: '0.5rem', mr: '1rem'}}
                            onClick={() => this.createFolder()}
                        >
                            Criar
                        </Button>

                        <IconButton disabled={this.state.buttonDisabled} sx={crossStyle} aria-label="close" onClick={() => this.toggleOpen()}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>
                </Modal>
            </Box>
        )
    }
}

export default FolderMenu;