import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

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

class FolderMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            path: "",
            textFieldValue: "",

            filesystem: props.filesystem
        }

        this.textField = React.createRef();
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
        fetch(BASE_URL + 'create-folder', {
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
            if (data.success) {
                this.state.filesystem.updateFiles(data.files);
                this.toggleOpen();
                alert("Folder created");
            } else {
                alert(data.error);
            }
        });
    }

    render() {
        return (
            <Modal open={this.state.open}>
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Create a new folder
                    </Typography>
                    <TextField onChange={this.textFieldUpdate} ref={this.textField} sx={{width: '100%', mt: '0.5rem'}} id="outlined-basic" label="Folder name" variant="outlined" />
                    <Button
                        color="success"
                        variant="contained"
                        sx={{border: '1px solid black', mt: '0.5rem', mr: '1rem', mb: '0.5rem'}}
                        onClick={() => this.createFolder()}
                    >
                        Create
                    </Button>

                    <IconButton sx={crossStyle} aria-label="close" onClick={() => this.toggleOpen()}>
                        <CloseRoundedIcon />
                    </IconButton>
                </Box>
            </Modal>
        )
    }
}

export default FolderMenu;