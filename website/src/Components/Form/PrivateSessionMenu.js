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
    width: 600,
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

    checkHasFile() {
        if (this.state.filesystem.rowRefs.length !== 0){
            return true;
        }
        return false;
    }

    toggleOpen() {
        this.setState({ open: !this.state.open });
    }

    createPrivateSession() {
        this.setState({ buttonDisabled: true, open: false });
        this.state.filesystem.createFile();        
    }

    render() {
        return (
            <Box>
                <Notification message={""} severity={"success"} ref={this.successNot}/>
                <Notification message={""} severity={"error"} ref={this.errorNot}/>
                <Modal open={this.state.open}>
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            <b>Sessão privada</b>
                        </Typography>
                        <Typography variant="body1" component="p" sx={{mt: '1rem', mb: '1rem'}}>
                            Para poder aceder a esta sessão novamente no futuro, certifique-se que guarda o link da sessão privada num lugar seguro. 
                        </Typography>
                        <Typography variant="body1" component="p" sx={{mt: '1rem', mb: '1rem'}}>
                            <b>{window.location.href}</b>
                        </Typography>
                        <Typography variant="body1" component="p" sx={{mt: '1rem', mb: '1rem'}}>
                            Caso perca o link, não conseguirá aceder novamente a esta sessão privada.
                        </Typography>
                        <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                            <Button
                                disabled={this.state.buttonDisabled}
                                variant="contained"
                                sx={{border: '1px solid black', mt: '0.5rem'}}
                                onClick={() => navigator.clipboard.writeText(window.location.href)}
                            >
                                Copiar link para a área de transferência
                            </Button>
                            {!this.checkHasFile() &&
                                <Button
                                    disabled={this.checkHasFile()}
                                    variant="contained"
                                    sx={{border: '1px solid black', ml: '0.5rem', mt: '0.5rem'}}
                                    onClick={() => this.createPrivateSession()}
                                >
                                    Adicionar documento
                                </Button>
                            }
                            {this.checkHasFile() &&
                                <IconButton disabled={this.state.buttonDisabled} sx={crossStyle} aria-label="close" onClick={() => this.toggleOpen()}>
                                    <CloseRoundedIcon />
                                </IconButton>
                            }                          
                        </Box>
                    </Box>
                </Modal>
            </Box>
        )
    }
}

export default PrivateSessionMenu;
