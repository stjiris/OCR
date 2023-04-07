import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
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

class DeleteMenu extends React.Component {
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

    deleteItem() {
        this.setState({ buttonDisabled: true });
        fetch(process.env.REACT_APP_API_URL + 'delete-path', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "path": this.state.path
            })
        })
        .then(response => {return response.json()})
        .then(data => {
            this.setState({ buttonDisabled: false });
            if (data.success) {
                this.state.filesystem.updateFiles(data.files);

                this.successNot.current.setMessage(data.message);
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
                            Tem a certeza que quer apagar?
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

                        <IconButton disabled={this.state.buttonDisabled} sx={crossStyle} aria-label="close" onClick={() => this.toggleOpen()}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>
                </Modal>
            </Box>
        )
    }
}

export default DeleteMenu;
