import './App.css';
import React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import loadComponent from './utils/loadComponents';
import footerBanner from './static/footerBanner.png';

import LockIcon from '@mui/icons-material/Lock';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import HelpIcon from '@mui/icons-material/Help';




/**
 * About Versioning:
 * Version -> MAJOR.MINOR.PATCH
 * MAJOR version when you make incompatible API changes
 * MINOR version when you add functionality in a backwards compatible manner
 * PATCH version when you make backwards compatible bug fixes
 */

const VERSION = "0.22.3";
const UPDATE_TIME = 30;

function App() {
    class Form extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                sessionId: window.location.href.split("/").pop(),

                fileSystemMode: true,
                editFileMode: false,
                layoutMenu: false,

                fileOpened: "",
                path: "files",

                currentFolder: ["files"],

                contents: [],

                filesChoice: [],
                algorithmChoice: [],
                configChoice: [],
            }

            this.saveButton = React.createRef();
            this.textEditor = React.createRef();
            this.pageDisplayer = React.createRef();
            this.header = React.createRef();

            this.successNot = React.createRef();
            this.errorNot = React.createRef();

            this.versionsMenu = React.createRef();
            this.logsMenu = React.createRef();

            this.fileSystem = React.createRef();
            this.editPage = React.createRef();
            this.textEditor = React.createRef();

            this.sendChanges = this.sendChanges.bind(this);
        }

        componentDidMount() {
            if (window.location.href.includes(process.env.REACT_APP_ADMIN)) {
                fetch(process.env.REACT_APP_API_URL + 'system-info', {
                    method: 'GET'
                })
                .then(response => {return response.json()})
                .then(data => {
                    if (this.logsMenu.current !== null) this.logsMenu.current.setLogs(data["logs"]);
                    if (this.header.current !== null) {
                        this.header.current.setFreeSpace(data["free_space"], data["free_space_percentage"]);
                        this.header.current.setPrivateSessions(data["private_sessions"]);
                    }
                });

                this.interval = setInterval(() => {
                    fetch(process.env.REACT_APP_API_URL + 'system-info', {
                        method: 'GET'
                    })
                    .then(response => {return response.json()})
                    .then(data => {
                        if (this.logsMenu.current !== null) this.logsMenu.current.setLogs(data["logs"]);
                        if (this.header.current !== null) {
                            this.header.current.setFreeSpace(data["free_space"], data["free_space_percentage"]);
                            this.header.current.setPrivateSessions(data["private_sessions"]);
                        }
                    });
                }, 1000 * UPDATE_TIME);
            }
        }

        getPrivateSession() {
            if (["", "ocr", "ocr-dev", "ocr-prod", process.env.REACT_APP_ADMIN].includes(this.state.sessionId)) return null;
            // if (this.state.sessionId.startsWith("localhost")) return null;
            return this.state.sessionId;
        }

        editFile(path, file) {
            /**
             * Open a file in the text editor
             *
             * @param {string} path - The path of the file
             * @param {string} file - The name of the file
             */
            // this.setState({path: path, fileOpened: file, fileSystemMode: false, editFileMode: true});
            this.textEditor.current.setFile(path, file);
            this.textEditor.current.toggleOpen();
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
                var deployedURL = currentURL.split("/")[3] + (currentURL.includes(process.env.REACT_APP_ADMIN) ? process.env.REACT_APP_ADMIN : "");
                window.location.href = 'https://iris.sysresearch.org/' + deployedURL + '/';
            }
            // Check if the current URL is in the local environment
            else if (currentURL.includes('localhost')) {
                var port = currentURL.split(":")[2].split("/")[0] + (currentURL.includes(process.env.REACT_APP_ADMIN) ? process.env.REACT_APP_ADMIN : "");
                window.location.href = 'http://localhost:' + port + '/';
            }
        }

        openVersionsMenu() {
            /**
             * Open the versions menu
             */
            this.versionsMenu.current.toggleOpen();
        }

        openLogsMenu() {
            /**
             * Open the logs menu
             */
            this.logsMenu.current.toggleOpen();
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

        createPrivateSession() {
            fetch(process.env.REACT_APP_API_URL + 'create-private-session', {
                method: 'GET'
            })
            .then(response => {return response.json()})
            .then(data => {
                var sessionId = data["sessionId"];
                if (window.location.href.endsWith('/')) {
                    window.location.href = window.location.href + `${sessionId}`;
                } else {
                    window.location.href = window.location.href + `/${sessionId}`;
                }
            });
        }

        changeFolderFromPath(folder_name) {
            var current_folder = this.state.currentFolder;
    
            // Remove the last element of the path until we find folder_name
            while (current_folder[current_folder.length - 1] !== folder_name) {
                current_folder.pop();
            }
    
            this.setState({
                currentFolder: current_folder,  
                fileSystemMode: true,
                editFileMode: false, 
                layoutMenu: false,
            });

            this.fileSystem.current.setState({layoutMenu: false});
        }

        render() {
            const Notification = loadComponent('Notification', 'Notifications');
            // const Header = loadComponent('Header', 'Header');
            const VersionsMenu = loadComponent('Form', 'VersionsMenu');
            const LogsMenu = loadComponent('Form', 'LogsMenu');
            const FileExplorer = loadComponent('FileSystem', 'FileSystem');
            const PrivateFileExplorer = loadComponent('PrivateSession', 'PrivateFileSystem');
            // const EditPage = loadComponent('EditPage', 'EditPage');
            // const EditPage2 = loadComponent('EditPage2', 'EditPage');
            // const EditPage = loadComponent('EditPage3', 'EditPage');
            const EditPagePopUp = loadComponent('EditPage3', 'EditPagePopUp');
            const ESPage = loadComponent('ElasticSearchPage', 'ESPage');

            var buttonsDisabled = this.getPrivateSession() !== null || !this.state.fileSystemMode || this.state.layoutMenu;

            return (
                <Box className="App" sx={{height: '100vh'}}>
                    <Notification message={""} severity={"success"} ref={this.successNot}/>
                    <Notification message={""} severity={"error"} ref={this.errorNot}/>

                    <VersionsMenu ref={this.versionsMenu}/>
                    <LogsMenu ref={this.logsMenu}/>

                    <EditPagePopUp ref={this.textEditor} app={this}/>

                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        zIndex: '5',
                        // border: '1px solid #000000',
                        pt: '0.5rem',
                        pl: '0.5rem',
                        pb: '0.5rem',
                        pr: '0.5rem',
                    }}>
                        <Box sx={{display: "flex", flexDirection: "row"}}>
                            <Button
                                disabled={buttonsDisabled}
                                variant="contained"
                                startIcon={<LockIcon/>}
                                onClick={() => this.createPrivateSession()}
                                sx={{
                                    border: '1px solid black',
                                    height: '2rem',
                                    textTransform: 'none',
                                    fontSize: '0.75rem'
                                }}
                            >
                                Sessão Privada
                            </Button>
                            
                            <Button
                                disabled={buttonsDisabled}
                                variant="contained"
                                startIcon={<CreateNewFolderIcon/>}
                                onClick={() => this.fileSystem.current.createFolder()}
                                sx={{
                                    border: '1px solid black',
                                    height: '2rem',
                                    textTransform: 'none',
                                    ml: '0.5rem',
                                    fontSize: '0.75rem'
                                }}
                            >
                                Nova Pasta
                            </Button>

                            <Box
                                sx = {{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    ml: '0.2rem'
                                }}
                            >
                                {
                                    this.state.currentFolder.map((folder, index) => {
                                        var name = (folder !== "files" || index > 0) ? folder : "Início";
                                        var folderDepth = this.state.currentFolder.length;

                                        if (!this.state.fileSystemMode && !this.state.editFileMode && index > 0)
                                            return null;
                                        
                                        if (folderDepth > 3 && index === 1) {
                                            return (
                                                <Box sx={{display: "flex", flexDirection: "row", lineHeight: "2rem"}}>
                                                    <p key={index} style={{margin: 0}}>... /</p>
                                                </Box>
                                            )
                                        }

                                        if (folderDepth > 3 && index > 0 && index < folderDepth - 2) return null;

                                        return (
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    lineHeight: '2rem',
                                                }}
                                                key={"Box" + folder}
                                            >
                                                <Button
                                                    key={folder}
                                                    onClick={() => {
                                                        if (index === 0 && !this.state.fileSystemMode) {
                                                            this.setState({fileSystemMode: true, editFileMode: false, filesChoice: [], algorithmChoice: [], configChoice: []})
                                                        } else if (this.getPrivateSession() !== null) {
                                                            this.redirectHome();
                                                        } else {
                                                            this.changeFolderFromPath(folder);
                                                            this.fileSystem.current.setState({current_folder: this.state.currentFolder});
                                                            this.fileSystem.current.displayFileSystem();
                                                        }
                                                    }}
                                                    style={{
                                                        margin: 0,
                                                        padding: '0px 10px 0px 10px',
                                                        textTransform: 'none',
                                                        display: "flex",
                                                        textAlign: "left",
                                                        textDecoration: "underline",
                                                        height: '2rem',
                                                    }}
                                                    variant="text"
                                                >
                                                    {name}
                                                </Button>
                                                <p key={index} style={{margin: 0}}>/</p>
                                            </Box>
                                        )
                                    })
                                }
                                {
                                    !buttonsDisabled && this.state.currentFolder.length > 1
                                    ? <Button
                                        variant="text"
                                        startIcon={<NoteAddIcon/>}
                                        onClick={() => this.fileSystem.current.createFile()}
                                        style={{
                                            margin: 0,
                                            padding: '0px 10px 0px 10px',
                                            display: "flex",
                                            textAlign: "left",
                                            height: '2rem',
                                            textTransform: 'none',
                                        }}
                                    >
                                        Adicionar Documento
                                    </Button>
                                    : null
                                }
                                
                            </Box>
                        </Box>

                        
                        
                        <Box sx={{display: "flex", flexDirection: "row", lineHeight: "2rem"}}>
                            <Button
                                disabled={buttonsDisabled}
                                variant="text"
                                onClick={() => {
                                    this.setState({
                                        fileSystemMode: false,
                                        editFileMode: false,
                                        filesChoice: [],
                                        algorithmChoice: [],
                                        configChoice: []
                                    })
                                }}
                                sx={{
                                    mr: '1.5rem',
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    p: 0,
                                    fontSize: '1rem',
                                    textDecoration: 'underline'
                                }}
                            >
                                Pesquisar
                            </Button>

                            <p style={{margin: 0}}>{`Versão: ${VERSION}`}</p>

                            <Button
                                variant="text"
                                onClick={() => window.open("https://docs.google.com/document/d/e/2PACX-1vR7BhM0haXd5CIyQatS22NrM44woFjChYCAaUAlqOjGAslLuF0TRPaMhjNW-dX8cxuaL86O5N_3mQMv/pub", '_blank')}
                                startIcon={<HelpIcon/>}
                                sx={{
                                    ml: '1.5rem',
                                    textTransform: 'none',
                                    p: 0
                                }}
                            >
                                Ajuda
                            </Button>
                        </Box>
                    </Box>

                    {/* <Header ref={this.header} app={this} privateSession={this.getPrivateSession()} version={VERSION}/> */}

                    <Box>
                        {
                            this.state.fileSystemMode

                            ? this.getPrivateSession() == null
                                ? <FileExplorer ref={this.fileSystem} current_folder={this.state.path} files={{"files": []}} app={this}/>
                                : <PrivateFileExplorer ref={this.fileSystem} current_folder={"files/_private_sessions/" + this.state.sessionId} files={{"files": []}} app={this}/>

                            : <ESPage app={this}/>
                        }
                    </Box>
                    <Box sx={{display:"flex", alignItems:"center", marginTop: '1rem', justifyContent:"center"}}>
                        <a href={footerBanner} target='_blank' rel="noreferrer">
                            <img src={footerBanner} alt="Footer com logo do COMPETE 2020, STJ e INESC-ID" style={{height: '4.5rem', width: 'auto'}}/>
                        </a>
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
