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

class PrivateSessionMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: true,
            filesystem: props.filesystem,
            buttonDisabled: false
        }

        this.successNot = React.createRef();
        this.errorNot = React.createRef();
    }

    toggleOpen() {
        this.setState({ open: !this.state.open });
    }

    createPrivateSession() {
        this.setState({ buttonDisabled: true, open: false });        
    }

    render() {
        return (
            <Box>
                <Notification message={""} severity={"success"} ref={this.successNot}/>
                <Notification message={""} severity={"error"} ref={this.errorNot}/>
                <Modal open={this.state.open}>
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Sessão privada
                        </Typography>
                        <Typography variant="body1" component="p" sx={{mt: '1rem', mb: '1rem'}}>
                            Para poder aceder a esta sessão novamente no futuro, certifique-se de guardar o link da sessão privada (<b>{window.location.href}</b>) num lugar seguro. Caso perca o link, não conseguirá aceder novamente a esta sessão privada.
                        </Typography>
                        <Button
                            disabled={this.state.buttonDisabled}
                            variant="contained"
                            sx={{border: '1px solid black', mt: '0.5rem', mr: '1rem'}}
                            onClick={() => this.createPrivateSession()}
                        >
                            OK
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

export default PrivateSessionMenu;
