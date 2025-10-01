import React, {useCallback, useRef, useState} from "react";
import axios from "axios";

import Box from '@mui/material/Box';
import TextField from "@mui/material/TextField";
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ClickAwayListener from "@mui/material/ClickAwayListener";

import Notification from 'Components/Notifications/Notification';

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

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;
const numberDaysRegex = /^[1-9][0-9]*$/;

function ChangeMaxAgePopup(
    {
        open = false,
        maxAge = "1",
        // functions:
        submitCallback = null,  // required
        cancelCallback = null,  // required
    }) {
    const successNotifRef = useRef(null);
    const errorNotifRef = useRef(null);

    const [newMaxAge, setNewMaxAge] = useState(maxAge);

    function handleClickOutsideMenu() {
        if (open) {
            cancelCallback();
        }
    }

    function handleAgeValueChange(value) {
        value = value.trim();
        if (!(numberDaysRegex.test(value)) && value !== '') {
            errorNotifRef.current.openNotif("O número de dias deve ser um valor inteiro positivo!");
        }
        setNewMaxAge(value);
    }

    const sendMaxAgeChangeRequest = useCallback(() => {
        axios.post(API_URL + "/admin/set-max-private-space-age",
            {
                "new_max_age": newMaxAge
            },
        )
        .then(({ data }) => {
            submitCallback(newMaxAge, data["message"]);
        })
        .catch(err => {
            successNotifRef.current.openNotif(err.message);
        });
    }, [newMaxAge]);

    return (
        <Box>
            <Notification message={""} severity={"success"} ref={successNotifRef}/>
            <Notification message={""} severity={"error"} ref={errorNotifRef}/>
            <Modal open={open}>
                <ClickAwayListener
                    mouseEvent="onMouseDown"
                    touchEvent="onTouchStart"
                    onClickAway={() => handleClickOutsideMenu()}
                >
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h5" component="h2">
                            Alterar idade máxima
                        </Typography>

                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <span>
                                Idade máxima dos espaços privados (dias):
                            </span>
                            <TextField
                                error={!(numberDaysRegex.test(newMaxAge))}
                                value={newMaxAge}
                                onChange={(e) => handleAgeValueChange(e.target.value)}
                                hiddenLabel
                                size="small"
                                variant="outlined"
                                className="simpleInput"
                                sx={{
                                    width: '4rem',
                                    marginLeft: '0.3rem',
                                    marginRight: '0.3rem',
                                    textAlign: "center",
                                }}
                            />
                        </Box>
                        <Button
                            disabled={!numberDaysRegex.test(newMaxAge)}
                            color="success"
                            variant="contained"
                            sx={{border: '1px solid black', mt: '0.5rem'}}
                            onClick={() => sendMaxAgeChangeRequest()}
                        >
                            Confirmar
                        </Button>

                        <IconButton sx={crossStyle} aria-label="close" onClick={() => cancelCallback()}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>
                </ClickAwayListener>
            </Modal>
        </Box>
    );
}

export default ChangeMaxAgePopup;
