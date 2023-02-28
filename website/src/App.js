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

const VERSION = "0.1.0";

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

            filesChoice: [],
            algorithmChoice: [],
            configChoice: [],
        }
        
        this.saveButton = React.createRef();
        this.textEditor = React.createRef();
        this.pageDisplayer = React.createRef();

        this.successNot = React.createRef();
        this.errorNot = React.createRef();

        this.sendChanges = this.sendChanges.bind(this);
    }

    editFile(path, file) {
        /**
         * Open a file in the text editor
         * 
         * @param {string} path - The path of the file
         * @param {string} file - The name of the file
         */
        this.setState({path: path, fileOpened: file, fileSystemMode: false, editFileMode: true});
        fetch(process.env.REACT_APP_API_URL + 'get-file?path=' + file, {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            this.setState({contents: data["doc"].sort((a, b) =>
                (a["page_url"] > b["page_url"]) ? 1 : -1
            )});
        });
    }

    viewFile(file, algorithm, config) {
        /**
         * View a file in ES page
         * 
         * @param {string} file - The name of the file
         */
        this.setState(
            {
                fileSystemMode: false,
                editFileMode: false,
                filesChoice: [{name: file, code: file}],
                algorithmChoice: [{name: algorithm, code: algorithm}],
                configChoice: [{name: config, code: config}]
            }
        );
    }

    updateContents(event, index) {
        /**
         * Update the content of the text editor
         * 
         * @param {event} event - The event
         * @param {int} index - The index of the text field changed
         */
        var contents = this.state.contents;
        contents[index]["content"] = event.target.value;
        this.setState({contents: contents});
    }

    sendChanges() {
        /**
         * Send the changes to the server
         */
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
                this.successNot.current.setMessage("Text submitted with success!");
                this.successNot.current.open();
                this.setState({contents: [], fileOpened: "", fileSystemMode: true, editFileMode: false})
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
                            onClick={() => this.setState({fileSystemMode: true, editFileMode: false, filesChoice: [], algorithmChoice: [], configChoice: []})}
                            underline="hover"
                        >
                            <h1>Home</h1>
                        </Link>
                        <Link
                            className="link"
                            sx={{
                                color: (!(this.state.fileSystemMode || this.state.editFileMode) ? '#338141' : '#48954f'),
                                mr: '0.05rem', mt: '0.25rem', fontSize: '0.75em'
                            }}
                            style={{textDecoration: 'none'}}
                            onClick={() => this.setState({fileSystemMode: false, editFileMode: false, filesChoice: [], algorithmChoice: [], configChoice: []})}
                            underline="hover"
                        >
                            <h1>Search</h1>
                        </Link>

                        <Notification message={""} severity={"success"} ref={this.successNot}/>
                        <Notification message={""} severity={"error"} ref={this.errorNot}/>
                    </Box>

                    <p>{`Version: ${VERSION}`}</p>
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
                                onClick={() => this.setState({contents: [], fileOpened: "", fileSystemMode: true})}
                            >
                                Go Back
                            </Button>

                            {
                                this.state.contents.map((page, index) => {
                                    return (
                                        <Box key={index} sx={{display: 'flex', ml: '1.5rem', mr: '1.5rem', mb: '0.5rem'}}>
                                            <Box>
                                                <PageDisplayer                                           
                                                    path={page["page_url"]}
                                                />
                                            </Box>
                                            <Box sx={{width: '100%'}}>
                                                <CustomTextField defaultValue={page["content"]} sx={{"& .MuiInputBase-root": {height: '100%'}}} ref={this.textEditor} rows={13} onChange={(e) => this.updateContents(e, index)} fullWidth disabled={this.state.disabled} multiline />
                                            </Box>
                                        </Box>
                                    )
                                })
                            }

                            <div className="footer-div">
                                <CustomButton ref={this.saveButton} text="Save" disabled={this.state.disabled} clickFunction={this.sendChanges} />
                            </div>
                        </Box>
                        : <ESPage app={this}/>
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