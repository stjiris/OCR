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
                            <p><b>Versão 0.5.0 - 09/03/2023</b></p>
                            <ul>                            
                                <li>Adiciona divisores entre colunas</li>
                                <li>Reordena os elementos de cada célula</li>
                                <li>Adiciona link para editar no fim da célula do OCR</li>
                            </ul>

                            <p><b>Versão 0.4.0 - 08/03/2023</b></p>
                            <ul>
                                <li>Ordenação da tabela por nome</li>
                            </ul>

                            <p><b>Versão 0.3.0 - 06/03/2023</b></p>
                            <ul>
                                <li>Nova estrutura da tabela</li>
                                <li>Novo menu de edição de texto</li>
                                <li>Geração de PDF e de TXT automaticamente após o OCR ou alteração de texto</li>
                            </ul>

                            <p><b>Versão 0.2.2 - 04/03/2023</b></p>
                            <ul>
                                <li>Website traduzido para português</li>
                                <li>Adicionado o menu de versões</li>
                            </ul>

                            <p><b>Versão 0.2.1 - 03/03/2023</b></p>
                            <ul>
                                <li>Correção de erro relativo ao download do PDF</li>
                            </ul>

                            <p><b>Versão 0.2.0 - 03/03/2023</b></p>
                            <ul>
                                <li>Texto no PDF inclui o texto alterado pelo utilizador</li>
                            </ul>

                            <p><b>Versão 0.1.0 - 28/02/2023</b></p>
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