import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Paper } from '@mui/material';

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

class VersionsMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
        }
    }

    toggleOpen() {
        if (this.state.open) {
            this.setState({ loading: false });
        }
        this.setState({ open: !this.state.open });
    }

    render() {
        return (
            <Box>
                <Modal open={this.state.open}>
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Alterações
                        </Typography>

                        <Paper style={{ maxHeight: '50vh', overflow: 'auto' }}>
                            <p><b>Versão 0.2.2</b></p>
                            <ul>
                                <li>Website traduzido para português</li>
                                <li>Adicionado o menu de versões</li>
                            </ul>

                            <p><b>Versão 0.2.1</b></p>
                            <ul>
                                <li>Correção de erro relativo ao download do PDF</li>
                            </ul>

                            <p><b>Versão 0.2.0</b></p>
                            <ul>
                                <li>Texto no PDF inclui o texto alterado pelo utilizador</li>
                            </ul>

                            <p><b>Versão 0.1.0</b></p>
                            <ul>
                                <li>Primeira versão do website</li>
                            </ul>
                        </Paper>

                        <IconButton disabled={this.state.loading} sx={crossStyle} aria-label="close" onClick={() => this.toggleOpen()}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>
                </Modal>
            </Box>
        )
    }
}

export default VersionsMenu;