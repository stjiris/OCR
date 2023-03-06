import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import UndoIcon from '@mui/icons-material/Undo';
import SaveIcon from '@mui/icons-material/Save';

import EditImageDisplayer from '../Displayer/EditImageDisplayer.js';
import PageDisplayer from '../Displayer/PageDisplayer.js';
import CustomTextField from '../TextField/CustomTextField.js';
import Notification from '../Notification/Notifications.js';

export default class EditPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            app: props.app,
            file: props.app.state.fileOpened,
            contents: [],

            pageMode: true,
            pageOpened: 0,
            text: "",

            loading: true
        }

        this.successNot = React.createRef();
        this.errorNot = React.createRef();
    }

    setFile(file) { this.setState({file: file}); }
    editPage(index) { this.setState({pageMode: false, pageOpened: index, text: this.state.contents[index]["content"]}); }

    componentDidMount() {
        fetch(process.env.REACT_APP_API_URL + 'get-file?path=' + this.state.file, {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            this.setState({loading: false, contents: data["doc"].sort((a, b) =>
                (a["page_url"] > b["page_url"]) ? 1 : -1
            )});
        });
    }

    updateContents(e) {
        this.setState({text: e.target.value});
    }

    goBack() {
        if (!this.state.pageMode) {
            this.setState({pageMode: true});
        } else {
            this.state.app.setState({fileSystemMode: true, editFileMode: false});
        }
    }

    saveText() {
        if (!this.state.pageMode) {
            var contents = this.state.contents;
            contents[this.state.pageOpened]["content"] = this.state.text;
            this.setState({contents: contents, pageMode: true});
        } else {
            fetch(process.env.REACT_APP_API_URL + 'submit-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "text": this.state.contents
                })
            })
            .then(response => {return response.json()})
            .then(data => {
                if (data.success) {
                    this.successNot.current.setMessage("Texto submetido com sucesso");
                    this.successNot.current.open();

                    var info = data["info"];
                    this.state.app.setState({fileSystemMode: true, editFileMode: false, info: info})
    
                } else {
                    this.errorNot.current.setMessage(data.error);
                    this.errorNot.current.open();
                }
            });
        }
    }

    render() {
        return (
            <Box sx={{ml: '1.5rem', mr: '1.5rem'}}>
                <Notification message={""} severity={"success"} ref={this.successNot}/>
                <Notification message={""} severity={"error"} ref={this.errorNot}/>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                }}>
                    <Button
                        disabled={this.state.buttonsDisabled}
                        variant="contained"
                        startIcon={<UndoIcon />} 
                        sx={{backgroundColor: '#ffffff', color: '#000000', border: '1px solid black', mr: '1rem', mb: '0.5rem', ':hover': {bgcolor: '#ddd'}}}
                        onClick={() => this.goBack()}
                    >
                        Voltar atrás
                    </Button>

                    <Button
                        disabled={this.state.buttonsDisabled}
                        variant="contained"
                        color="success"
                        startIcon={<SaveIcon />} 
                        sx={{border: '1px solid black', mr: '1rem', mb: '0.5rem'}}
                        onClick={() => this.saveText()}
                    >
                        Guardar
                    </Button>
                </Box>
                {
                    this.state.loading
                    ? <p>Loading...</p>
                    : null
                }
                {
                    this.state.pageMode
                    ? <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            justifyContent: 'space-around',
                        }}
                    >
                        {
                            this.state.contents.map((page, index) => {
                                return <EditImageDisplayer index={index} path={page["page_url"]} key={index} editPage={this}/>
                            })
                        }
                    </Box>
                    : <Box sx={{display: 'flex', flexDirection: 'row'}}>
                        <Box>
                            <PageDisplayer                                           
                                path={this.state.contents[this.state.pageOpened]["page_url"]} maxWidth={'250px'}
                            />
                        </Box>
                        <Box sx={{width: '100%'}}>
                            <CustomTextField defaultValue={this.state.contents[this.state.pageOpened]["content"]} sx={{"& .MuiInputBase-root": {height: '100%'}}} ref={this.textEditor} rows={18} onChange={(e) => this.updateContents(e)} fullWidth disabled={this.state.disabled} multiline />
                        </Box>
                    </Box>
                }
            </Box>
        )
    }
}