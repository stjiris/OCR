import React from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import loadComponent from '../../../utils/loadComponents';
import { CircularProgress } from '@mui/material';

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

const languages = [
    {"name": "Bengali", "code": "bn"},
    {"name": "Alemão", "code": "de"},
    {"name": "Inglês", "code": "en"},
    {"name": "Espanhol", "code": "es"},
    {"name": "Francês", "code": "fr"},
    {"name": "Hindi", "code": "hi"},
    {"name": "Italiano", "code": "it"},
    {"name": "Japonês", "code": "ja"},
    {"name": "Javanês", "code": "jv"},
    {"name": "Coreano", "code": "ko"},
    {"name": "Marathi", "code": "sr."},
    {"name": "Malaio", "code": "ms"},
    {"name": "Polaco", "code": "pl"},
    {"name": "Português", "code": "pt"},
    {"name": "Romeno", "code": "ro"},
    {"name": "Russo", "code": "ru"},
    {"name": "Tâmil", "code": "ta"},
    {"name": "Turco", "code": "tr"},
    {"name": "Ucraniano", "code": "uk"},
    {"name": "Chinês", "code": "zh"}
]

const choice = [{"name": "Português", "code": "pt"}]

class DictionaryMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            path: "",
            textFieldValue: "",

            page: props.page,
            words: props.words,
            buttonDisabled: false,
        }

        this.textField = React.createRef();
        this.successNot = React.createRef();
        this.errorNot = React.createRef();

        this.dropdown = React.createRef();
    }

    toggleOpen() {
        this.setState({ open: !this.state.open });
    }

    updateWords(words_list) {
        // Convert the dictionary words list to a list of words
        this.setState({
            words: Object.keys(words_list)
        });    
    }

    checkSintax() {
        this.setState({ buttonDisabled: true });
        fetch(process.env.REACT_APP_API_URL + 'check-sintax', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "languages": this.dropdown.current.getChoiceList(),
                "words": this.state.words,
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.state.page.updateSintax(data.result)
                this.setState({ open: false, buttonDisabled: false });
            }

        });
            
    }

    render() {
        const Notification = loadComponent('Notification', 'Notifications');
        const ChecklistDropdown = loadComponent('Dropdown', 'ChecklistDropdown');

        return (
            <Box>
                <Notification message={""} severity={"success"} ref={this.successNot}/>
                <Notification message={""} severity={"error"} ref={this.errorNot}/>

                <Modal open={this.state.open}>
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">
                            Que línguas quer usar?
                        </Typography>

                        <ChecklistDropdown
                            ref = {this.dropdown}
                            label = "Línguas"
                            options = {languages}
                            choice = {choice}
                        />

                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row'
                        }}>
                            {
                                this.state.buttonDisabled
                                ? <Button
                                    disabled={true}
                                    color="success"
                                    variant="contained"
                                    sx={{border: '1px solid black', mt: '0.5rem'}}
                                >
                                    <CircularProgress size={24}/>
                                </Button>
                                : <Button
                                    disabled={false}
                                    color="success"
                                    variant="contained"
                                    sx={{border: '1px solid black', mt: '0.5rem'}}
                                    onClick={() => this.checkSintax()}
                                >
                                    Verificar ortografia
                                </Button>
                            }
                        </Box>

                        <IconButton disabled={this.state.buttonDisabled} sx={crossStyle} aria-label="close" onClick={() => this.toggleOpen()}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>
                </Modal>
            </Box>
        )
    }
}

export default DictionaryMenu;
