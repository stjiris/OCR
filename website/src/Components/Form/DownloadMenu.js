import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

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

class DownloadMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            path: "",

            filesystem: props.filesystem,
        }
    }

    currentPath(path) {
        this.setState({ path: path });
    }

    toggleOpen() {
        this.setState({ open: !this.state.open });
    }

    downloadTxt() {
        this.state.filesystem.getDocument(this.state.path, "txt");
    }

    downloadPdf() {
        this.state.filesystem.getDocument(this.state.path, "pdf");
    }

    render() {
        return (
            <Box>
                <Modal open={this.state.open}>
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Select the download option
                        </Typography>

                        <Button
                            color="primary"
                            variant="contained"
                            sx={{border: '1px solid black', mt: '0.5rem', width: '100%'}}
                            onClick={() => this.downloadTxt()}
                        >
                            TXT
                        </Button>

                        <Button
                            color="success"
                            variant="contained"
                            sx={{border: '1px solid black', mt: '0.5rem', width: '100%'}}
                            onClick={() => this.downloadPdf()}
                        >
                            PDF
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

export default DownloadMenu;