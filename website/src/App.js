import './App.css';
import React from 'react';

import { Box, Link, Button } from '@mui/material';
import CustomButton from './Components/Button/CustomButton.js';
import CustomTextField from './Components/TextField/CustomTextField.js';
import PageDisplayer from './Components/Displayer/PageDisplayer.js';

import { FileExplorer } from './Components/FileSystem/FileSystem.js';

import UndoIcon from '@mui/icons-material/Undo';

var BASE_URL = 'http://localhost:5001/'

function App() {
  class Form extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fileSystemMode: true,
            fileOpened: "",
            path: "files",

            contents: [],
            images: []
        }
        
        this.saveButton = React.createRef();
        this.textEditor = React.createRef();
        this.pageDisplayer = React.createRef();

        this.sendChanges = this.sendChanges.bind(this);
    }

    openFile(path, file) {
        this.setState({path: path, fileOpened: file, 'fileSystemMode': false});
        fetch(BASE_URL + 'get-file?path=' + file, {
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
        fetch(BASE_URL + 'submitText', {
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
                alert("Text submitted with success!");
            } else {
                alert(data.error);
            }
        });
    }

    render() {
        return (
            <div className="App">
                <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', ml: '1.5rem', mr: '2rem'}}>
                    <Box sx={{display: 'flex', flexDirection: 'row'}}>
                        <Link sx={{color: '#338141', mr: '2rem', mt: '0.25rem', fontSize: '0.75rem'}} style={{textDecoration: 'none'}} to="/" href="http://localhost/" underline="hover">
                            <h1>Scan</h1>
                        </Link>
                        <Link sx={{color: '#48954f', mr: '0.05rem', mt: '0.25rem', fontSize: '0.75em'}} style={{textDecoration: 'none'}} to="/files" href="http://localhost/files" underline="hover">
                            <h1>Files</h1>
                        </Link>
                    </Box>
                </Box>

                {
                    this.state.fileSystemMode
                    ? <FileExplorer current_folder={this.state.path} files={{"files": []}} app={this}/>
                    : <Box>
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