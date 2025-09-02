import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DiscFullIcon from '@mui/icons-material/DiscFull';

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
    borderRadius: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
};

const crossStyle = {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem'
}

class FullStorageMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            message: ""
        }
    }

    openWithMessage(message = "") {
        this.setState({ open: true, message: message });
    }

    render() {
        return (
            <Box>
                <Modal open={this.state.open}>
                    <Box sx={style}>
                        <DiscFullIcon color="error" sx={{fontSize: 100}} />
                        <Typography variant="body1" component="p" sx={{mt: '1rem', mb: '1rem'}}>
                            {this.state.message}
                        </Typography>

                        <IconButton sx={crossStyle} aria-label="close" onClick={() => this.setState({open: false})}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>
                </Modal>
            </Box>
        )
    }
}

export default FullStorageMenu;
