import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

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

            loading: false,
            loadingType: "",
        }
    }

    currentPath(path) {
        this.setState({ path: path });
    }

    toggleOpen() {
        if (this.state.open) {
            this.setState({ loading: false });
        }
        this.setState({ open: !this.state.open });
    }

    getDocument(type) {
        /**
         * Export the .txt or .pdf file
         */
        this.setState({ loading: true, loadingType: type });
        fetch(process.env.REACT_APP_API_URL + "get_" + type + '?path=' + this.state.path, {
            method: 'GET'
        })
        .then(response => {return response.blob()})
        .then(data => {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(data);

            var name = this.state.path.split('/').slice(-2)[0];
            var basename = name.split('.').slice(0, -1).join('.');
            a.download = basename + '.' + type;
            a.click();
            a.remove();
            this.setState({ loading: false });
        });
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
                            disabled={this.state.loading}
                            color="primary"
                            variant="contained"
                            sx={{border: '1px solid black', mt: '0.5rem', width: '100%'}}
                            onClick={() => this.getDocument("txt")}
                        >
                            TXT
                        </Button>

                        <Button
                            disabled={this.state.loading}
                            color="success"
                            variant="contained"
                            sx={{border: '1px solid black', mt: '0.5rem', width: '100%'}}
                            onClick={() => this.getDocument("pdf")}
                        >
                            PDF
                        </Button>

                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            {
                                this.state.loading
                                ? this.state.loadingType === "txt"
                                    ? <CircularProgress sx={{mt: '0.5rem'}} color="primary" />
                                    : <CircularProgress sx={{mt: '0.5rem'}} color="success" />
                                : null
                            }
                        </Box>

                        <IconButton disabled={this.state.loading} sx={crossStyle} aria-label="close" onClick={() => this.toggleOpen()}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>
                </Modal>
            </Box>
        )
    }
}

export default DownloadMenu;