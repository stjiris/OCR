import './App.css';
import React from 'react';

import { Box, Link, Button } from '@mui/material';
import CustomButton from './Components/Button/CustomButton.js';
import CustomTextField from './Components/TextField/CustomTextField.js';
import PageDisplayer from './Components/Displayer/PageDisplayer.js';
import Notification from './Components/Notification/Notifications';

import { FileExplorer } from './Components/FileSystem/FileSystem.js';
import ESPage from './Components/ElasticSearchPage/ESPage';

import UndoIcon from '@mui/icons-material/Undo';

function App() {
  class Form extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fileSystemMode: true,
            editFileMode: false,

            fileOpened: "",
            path: "files",

            contents: [],
            images: []
        }
        
        this.saveButton = React.createRef();
        this.textEditor = React.createRef();
        this.pageDisplayer = React.createRef();

        this.successNot = React.createRef();
        this.errorNot = React.createRef();

        this.sendChanges = this.sendChanges.bind(this);
    }

    openFile(path, file) {
        this.setState({path: path, fileOpened: file, fileSystemMode: false, editFileMode: true});
        fetch(process.env.REACT_APP_API_URL + 'get-file?path=' + file, {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            this.setState({contents: data.contents, images: data.images});
        });
    }

    updateContents(event, index) {
        var contents = this.state.contents;
        contents[index] = event.target.value;
        this.setState({contents: contents});
    }

    sendChanges() {
        fetch(process.env.REACT_APP_API_URL + 'submitText', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "text": this.state.contents,
                "filename": this.state.fileOpened
            })
        })
        .then(response => {return response.json()})
        .then(data => {
            if (data.success) {
                this.successNot.current.setMessage("Text submitted with success!");
                this.successNot.current.open();
                this.setState({contents: [], images: [], fileOpened: "", fileSystemMode: true, editFileMode: false})
            } else {
                this.errorNot.current.setMessage(data.error);
                this.errorNot.current.open();
            }
        });
    }

    render() {
        return (
            <div className="App">
                <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', ml: '1.5rem', mr: '2rem'}}>
                    <Box sx={{display: 'flex', flexDirection: 'row'}}>
                        <Link
                            className="link"
                            sx={{
                                color: ((this.state.fileSystemMode || this.state.editFileMode) ? '#338141' : '#48954f'),
                                mr: '2rem', mt: '0.25rem', fontSize: '0.75rem'
                            }}
                            style={{textDecoration: 'none'}}
                            onClick={() => this.setState({fileSystemMode: true, editFileMode: false})}
                            underline="hover"
                        >
                            <h1>Scan</h1>
                        </Link>
                        <Link
                            className="link"
                            sx={{
                                color: (!(this.state.fileSystemMode || this.state.editFileMode) ? '#338141' : '#48954f'),
                                mr: '0.05rem', mt: '0.25rem', fontSize: '0.75em'
                            }}
                            style={{textDecoration: 'none'}}
                            onClick={() => this.setState({fileSystemMode: false, editFileMode: false})}
                            underline="hover"
                        >
                            <h1>Files</h1>
                        </Link>

                        <Notification message={""} severity={"success"} ref={this.successNot}/>
                        <Notification message={""} severity={"error"} ref={this.errorNot}/>
                    </Box>
                </Box>

                {
                    this.state.fileSystemMode
                    ? <FileExplorer current_folder={this.state.path} files={{"files": []}} app={this}/>
                    : this.state.editFileMode
                        ? <Box>
                            <Button
                                disabled={this.state.backButtonDisabled}
                                variant="contained"
                                startIcon={<UndoIcon />} 
                                sx={{backgroundColor: '#ffffff', color: '#000000', border: '1px solid black', ml: '1.5rem', mb: '0.5rem', ':hover': {bgcolor: '#dddddd'}}}
                                onClick={() => this.setState({contents: [], images: [], fileOpened: "", fileSystemMode: true})}
                            >
                                Go Back
                            </Button>

                            {
                                this.state.contents.map((page, index) => {
                                    return (
                                        <Box key={index} sx={{display: 'flex', ml: '1.5rem', mr: '1.5rem', mb: '0.5rem'}}>
                                            <PageDisplayer                                           
                                                ref={this.pageDisplayer}
                                                filename={this.state.fileOpened}    
                                                page={index}
                                            />
                                            <CustomTextField defaultValue={page} sx={{"& .MuiInputBase-root": {height: '100%'}}} ref={this.textEditor} rows={13} onChange={(e) => this.updateContents(e, index)} fullWidth disabled={this.state.disabled} multiline />
                                        </Box>
                                    )
                                })
                            }

                            <div className="footer-div">
                                <CustomButton ref={this.saveButton} text="Save" disabled={this.state.disabled} clickFunction={this.sendChanges} />
                            </div>
                        </Box>
                        : <ESPage />
                }
            </div>
        )
    }
}

return (
    <Form />
);
}

export default App;