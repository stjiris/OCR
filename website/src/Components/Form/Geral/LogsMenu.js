import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
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

class LogsMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            logs: [],
        }
    }

    setLogs(logs) {
        this.setState({ logs: logs });
    }

    addLogs(logs) {
        this.setState({ logs: this.state.logs.concat(logs) });
    }

    requestUpdate() {

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
                            Logs
                        </Typography>

                        <Box style={{ maxHeight: '50vh', overflowY: 'scroll' }}>
                            {this.state.logs.map((log, index) => {
                                if (log[log.length -2] !== "-") return null;
                                var dateTime = log.split(" ").slice(0, 2).join(" ");
                                var endpoint = log.split("\"")[1].replace("\"", "");
                                var statusResponse = log.split("\"")[2].replace(" -", "");
                                return (
                                    <Box key={index} sx={{
                                        backgroundColor: statusResponse.includes("200") ? '#f5f5f5' : "#fa2343",
                                        borderRadius: '10px',
                                        padding: '0.5rem',
                                        mb: '2px',
                                        border: '1px solid #080808'
                                    }}>
                                        <span><b>Date and Time: </b>{dateTime}</span>
                                        <br />
                                        <span><b>Endpoint: </b>{endpoint}</span>
                                        <br />
                                        <span><b>Status Response: </b>{statusResponse}</span>
                                    </Box>
                                )
                            })}
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

export default LogsMenu;
