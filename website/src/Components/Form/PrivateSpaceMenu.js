import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

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

class PrivateSpaceMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: true,
            buttonDisabled: false
        }

        this.errorNot = React.createRef();
    }

    checkHasFile() {
        if (this.props.rowRefsLength !== 0){
            return true;
        }
        return false;
    }

    toggleOpen() {
        this.setState({ open: !this.state.open });
    }

    uploadFile() {
        this.setState({ buttonDisabled: true, open: false });
        this.props.createFile();
    }

    render() {
        return (
            <Box>
                <Modal open={this.state.open}>
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            <b>Espaço Privado</b>
                        </Typography>
                        <Typography variant="body1" component="p" sx={{mt: '1rem', mb: '1rem'}}>
                            Para poder aceder a este espaço novamente no futuro, certifique-se que guarda o link do espaço privado num lugar seguro.
                            Os espaços privados são removidos ao fim de <b>{this.props.maxAge}</b> dia(s).
                        </Typography>
                        <Button
                            disabled={this.state.buttonDisabled}
                            variant="outlined"
                            onClick={() => navigator.clipboard.writeText(window.location.href)}
                        >
                            <Box sx={{display: 'flex'}}>
                                <Typography variant="button" display="block" sx={{mr: '0.3rem'}}>
                                    Copiar link
                                </Typography>
                                <ArrowForwardIcon sx={{mr: '0.3rem'}} />
                                <Typography variant="button" display="block" sx={{mr: '0.5rem'}}>
                                    <b>{window.location.href}</b>
                                </Typography>
                            </Box>
                            <ContentCopyIcon />
                        </Button>
                        <Typography variant="body1" component="p" sx={{mt: '1rem', mb: '1rem'}}>
                            Caso perca o link, não conseguirá aceder novamente a este espaço privado.
                        </Typography>
                        <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
                            <IconButton disabled={this.state.buttonDisabled} sx={crossStyle} aria-label="close" onClick={() => this.toggleOpen()}>
                                <CloseRoundedIcon/>
                            </IconButton>
                            <Button
                                disabled={this.checkHasFile()}
                                variant="contained"
                                sx={{border: '1px solid black'}}
                                onClick={() => this.uploadFile()}
                            >
                                Adicionar documento
                            </Button>
                        </Box>
                    </Box>
                </Modal>
            </Box>
        )
    }
}

PrivateSpaceMenu.defaultProps = {
    maxAge: null,
    rowRefsLength: null,
    // functions:
    createFile: null
}

export default PrivateSpaceMenu;
