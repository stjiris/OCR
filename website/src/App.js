import './App.css';
import React from 'react';

import { Box, Link, IconButton } from '@mui/material';
import Notification from './Components/Notification/Notifications';
import VersionsMenu from './Components/Form/VersionsMenu';

import { FileExplorer } from './Components/FileSystem/FileSystem.js';
import ESPage from './Components/ElasticSearchPage/ESPage';
import EditPage from './Components/EditPage/EditPage';

import InfoIcon from '@mui/icons-material/Info';

/**
 * About Versioning:
 * Version -> MAJOR.MINOR.PATCH
 * MAJOR version when you make incompatible API changes
 * MINOR version when you add functionality in a backwards compatible manner
 * PATCH version when you make backwards compatible bug fixes
 */

const VERSION = "0.9.3";

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

        this.versionsMenu = React.createRef();

        this.fileSystem = React.createRef();
        this.editPage = React.createRef();

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

    openVersionsMenu() {
        /**
         * Open the versions menu
         */
        this.versionsMenu.current.toggleOpen();
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
                this.successNot.current.setMessage("Texto submetido com sucesso");
                this.successNot.current.open();
                this.setState({contents: [], fileOpened: "", fileSystemMode: true, editFileMode: false})

                var info = data["info"];
                this.fileSystem.current.setState({info: info}, this.fileSystem.current.updateInfo);
            } else {
                this.errorNot.current.setMessage(data.error);
                this.errorNot.current.open();
            }
        });
    }

    render() {
        return (
            <Box className="App" sx={{height: '100vh'}}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    ml: '1.5rem',
                    mr: '1.5rem',
                    zIndex: '100',
                }}>
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
                            <h1>Início</h1>
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
                            <h1>Pesquisar</h1>
                        </Link>

                        <Notification message={""} severity={"success"} ref={this.successNot}/>
                        <Notification message={""} severity={"error"} ref={this.errorNot}/>
                    </Box>

                    <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                        <p>{`Versão: ${VERSION}`}</p>
                        <IconButton onClick={() => this.openVersionsMenu()}>
                            <InfoIcon />
                        </IconButton>
                    </Box>
                </Box>

                <VersionsMenu ref={this.versionsMenu}/>

                <Box sx={{}}>
                    {
                        this.state.fileSystemMode
                        ? <FileExplorer ref={this.fileSystem} current_folder={this.state.path} files={{"files": []}} app={this}/>
                        : this.state.editFileMode
                            ? <EditPage ref={this.editPage} app={this}/>
                            : <ESPage app={this}/>
                    }
                </Box>
            </Box>
        )
    }
}

return (
    <Form />
);
}

export default App;
