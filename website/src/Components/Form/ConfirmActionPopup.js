import React, {useRef} from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ClickAwayListener from "@mui/material/ClickAwayListener";

import Notification from 'Components/Notifications/Geral/Notification';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'fit-content',
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

function ConfirmActionPopup(
    {
        open = false,
        message = "",
        confirmButtonColor = null,
        // functions:
        submitCallback = null,  // required
        cancelCallback = null,  // required
    }) {
        const successNotif = useRef(null);
        const errorNotif = useRef(null);

        function handleClickOutsideMenu() {
            if (open) {
                cancelCallback();
            }
        }

        return (
            <Box>
                <Notification message={""} severity={"success"} ref={successNotif}/>
                <Notification message={""} severity={"error"} ref={errorNotif}/>
                <Modal open={open}>
                    <ClickAwayListener
                        mouseEvent="onMouseDown"
                        touchEvent="onTouchStart"
                        onClickAway={() => handleClickOutsideMenu()}
                    >
                        <Box sx={style}>
                            <Typography id="modal-modal-title" variant="h6" component="h2">
                                {message}
                            </Typography>

                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'row'
                            }}>
                                <Button
                                    color={confirmButtonColor ? confirmButtonColor : "info"}
                                    variant="contained"
                                    sx={{border: '1px solid black', mt: '0.5rem'}}
                                    onClick={() => submitCallback()}
                                >
                                    Confirmar
                                </Button>
                            </Box>

                            <IconButton sx={crossStyle} aria-label="close" onClick={() => cancelCallback()}>
                                <CloseRoundedIcon />
                            </IconButton>
                        </Box>
                    </ClickAwayListener>
                </Modal>
            </Box>
        );
}

export default ConfirmActionPopup;
