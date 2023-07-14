import './App.css';
import React from 'react';

import Box from '@mui/material/Box';

// import { FileExplorer } from './Components/FileSystem/FileSystem.js';
// import ESPage from './Components/ElasticSearchPage/ESPage';
// import EditPage from './Components/EditPage/EditPage';
// import { PrivateFileExplorer } from './Components/PrivateSession/PrivateFileSystem';

import loadComponent from './utils/loadComponents';

/**
 * About Versioning:
 * Version -> MAJOR.MINOR.PATCH
 * MAJOR version when you make incompatible API changes
 * MINOR version when you add functionality in a backwards compatible manner
 * PATCH version when you make backwards compatible bug fixes
 */

const VERSION = "0.13.0";

function App() {
    class Form extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                sessionId: window.location.href.split("/").pop(),

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

        getPrivateSession() {
            if (["", "ocr", "ocr-dev"].includes(this.state.sessionId)) return null;
            return this.state.sessionId;
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

        redirectHome() {
            var currentURL = window.location.href;

            // Check if the current URL is deployed
            if (currentURL.includes('iris.sysresearch.org')) {
                var deployedURL = currentURL.split("/")[3];
                window.location.href = 'https://iris.sysresearch.org/' + deployedURL + '/';
            }
            // Check if the current URL is in the local environment
            else if (currentURL.includes('localhost')) {
                var port = currentURL.split(":")[2].split("/")[0];
                window.location.href = 'http://localhost:' + port + '/';
            }
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
            const Notification = loadComponent('Notification', 'Notifications');
            const Header = loadComponent('Header', 'Header');
            const VersionsMenu = loadComponent('Form', 'VersionsMenu');
            const FileExplorer = loadComponent('FileSystem', 'FileSystem');
            const PrivateFileExplorer = loadComponent('PrivateSession', 'PrivateFileSystem');
            const EditPage = loadComponent('EditPage', 'EditPage');
            const ESPage = loadComponent('ElasticSearchPage', 'ESPage');

            return (
                <Box className="App" sx={{height: '100vh'}}>
                    <Notification message={""} severity={"success"} ref={this.successNot}/>
                    <Notification message={""} severity={"error"} ref={this.errorNot}/>

                    <Header app={this} privateSession={this.getPrivateSession()} version={VERSION}/>

                    <VersionsMenu ref={this.versionsMenu}/>

                    <Box>
                        {
                            this.state.fileSystemMode

                            ? this.getPrivateSession() == null
                                ? <FileExplorer ref={this.fileSystem} current_folder={this.state.path} files={{"files": []}} app={this}/>
                                : <PrivateFileExplorer ref={this.fileSystem} current_folder={this.state.sessionId} files={{"files": []}} app={this}/>

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
    )
}

export default App;
