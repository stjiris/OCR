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
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

import {fileSystemState, layoutMenuState, editingMenuState, searchMenuState, closeFileSystemMenus} from "./states";

const Notification = loadComponent('Notification', 'Notifications');
const VersionsMenu = loadComponent('Form', 'VersionsMenu');
const LogsMenu = loadComponent('Form', 'LogsMenu');
const FileExplorer = loadComponent('FileSystem', 'FileSystem');
const ESPage = loadComponent('ElasticSearchPage', 'ESPage');

const TooltipIcon = loadComponent("TooltipIcon", "TooltipIcon");

/**
 * About Versioning:
 * Version -> MAJOR.MINOR.PATCH
 * MAJOR version when you make incompatible API changes
 * MINOR version when you add functionality in a backwards compatible manner
 * PATCH version when you make backwards compatible bug fixes
 */

const VERSION = "1.0.0";
const UPDATE_TIME = 30;

function App() {
    class Form extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                sessionId: window.location.href.split("/").pop(),

                searchMenu: false,
                editingMenu: false,
                layoutMenu: false,

                fileOpened: "",
                currentFolderPathList: [""],

                contents: [],

                filesChoice: [],
                algorithmChoice: [],
                configChoice: [],

                privateSessionsOpen: false,
                privateSessions: [],
                freeSpace: props.freeSpace || 0,
                freeSpacePercentage: props.freeSpacePercentage || 0,
            }

            this.header = React.createRef();

            this.successNot = React.createRef();
            this.errorNot = React.createRef();

            this.versionsMenu = React.createRef();
            this.logsMenu = React.createRef();

            this.fileSystem = React.createRef();

            this.setCurrentPath = this.setCurrentPath.bind(this);
            this.enterLayoutMenu = this.enterLayoutMenu.bind(this);
            this.enterEditingMenu = this.enterEditingMenu.bind(this);
            this.exitMenus = this.exitMenus.bind(this);
        }

        componentDidMount() {
            if (window.location.href.includes(process.env.REACT_APP_ADMIN)) {
                fetch(process.env.REACT_APP_API_URL + 'system-info', {
                    method: 'GET'
                })
                .then(response => {return response.json()})
                .then(data => {
                    // if (this.logsMenu.current !== null) this.logsMenu.current.setLogs(data["logs"]);
                    this.setState({
                        freeSpace: data["free_space"],
                        freeSpacePercentage: data["free_space_percentage"],
                        privateSessions: data["private_sessions"]
                    });
                });

                this.interval = setInterval(() => {
                    fetch(process.env.REACT_APP_API_URL + 'system-info', {
                        method: 'GET'
                    })
                    .then(response => {return response.json()})
                    .then(data => {
                        // if (this.logsMenu.current !== null) this.logsMenu.current.setLogs(data["logs"]);
                        this.setState({
                            freeSpace: data["free_space"],
                            freeSpacePercentage: data["free_space_percentage"],
                            privateSessions: data["private_sessions"]
                        });
                    });
                }, 1000 * UPDATE_TIME);
            }
        }

        getPrivateSession() {
            if (["", "ocr", "ocr-dev", "ocr-prod", process.env.REACT_APP_ADMIN].includes(this.state.sessionId)) return null;
            // if (this.state.sessionId.startsWith("localhost")) return null;
            return this.state.sessionId;
        }

        //editFile(path, file) {
        //    /**
        //     * Open a file in the text editor
        //     *
        //     * @param {string} path - The path of the file
        //     * @param {string} file - The name of the file
        //     */
        //    this.setState({path: path, fileOpened: file, fileSystemMode: false, editingMenu: true});
        //    this.textEditor.current.setFile(path, file);
        //    this.textEditor.current.toggleOpen();
        //}
        //viewFile(file, algorithm, config) {
            /**
             * View a file in ES page
             *
             * @param {string} file - The name of the file
             */
            /*
            this.setState(
                {
                    fileSystemMode: false,
                    editingMenu: false,
                    filesChoice: [{name: file, code: file}],
                    algorithmChoice: [{name: algorithm, code: algorithm}],
                    configChoice: [{name: config, code: config}]
                }
            );
        }
            */
        /*
        updateContents(event, index) {
             //
             //Update the content of the text editor
             //
             //@param {event} event - The event
             //@param {int} index - The index of the text field changed
             //
            let contents = this.state.contents;
            contents[index]["content"] = event.target.value;
            this.setState({contents: contents});
        }
         */

        redirectHome() {
            const currentURL = window.location.href;

            // Check if the current URL is deployed
            if (currentURL.includes('iris.sysresearch.org')) {
                const deployedURL = currentURL.split("/")[3] + (currentURL.includes(process.env.REACT_APP_ADMIN) ? process.env.REACT_APP_ADMIN : "");
                window.location.href = 'https://iris.sysresearch.org/' + deployedURL + '/';
            }
            // Check if the current URL is in the local environment
            else if (currentURL.includes('localhost')) {
                const port = currentURL.split(":")[2].split("/")[0] + (currentURL.includes(process.env.REACT_APP_ADMIN) ? process.env.REACT_APP_ADMIN : "");
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

        /*
        sendChanges() {
             //
             //Send the changes to the server
             //
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
                    this.setState(fileSystemState);

                    const info = data["info"];
                    this.fileSystem.current.setState({info: info});
                } else {
                    this.errorNot.current.setMessage(data.error);
                    this.errorNot.current.open();
                }
            });
        }
         */

        createPrivateSession() {
            fetch(process.env.REACT_APP_API_URL + 'create-private-session', {
                method: 'GET'
            })
            .then(response => {return response.json()})
            .then(data => {
                const sessionId = data["sessionId"];
                if (window.location.href.endsWith('/')) {
                    window.location.href = window.location.href + `${sessionId}`;
                } else {
                    window.location.href = window.location.href + `/${sessionId}`;
                }
            });
        }

        setCurrentPath(new_path_list) {
            // replace(/^\//, '') removes '/' from the start of the path. the server expects non-absolute paths
            this.setState({...fileSystemState, currentFolderPathList: new_path_list},
                () => this.fileSystem.current.setState({...closeFileSystemMenus, current_folder: new_path_list.join('/').replace(/^\//, '')})
            );
        }

        enterLayoutMenu(filename = null) {
            this.setState({...layoutMenuState, fileOpened: filename},
                () => this.fileSystem.current.setState({...layoutMenuState, fileOpened: filename})
            );
        }

        enterEditingMenu(filename = null) {
            this.setState({...editingMenuState, fileOpened: filename},
                () => this.fileSystem.current.setState({...editingMenuState, fileOpened: filename})
            );
        }

        exitMenus() {
            this.setState({...fileSystemState, fileOpened: null},
                () => this.fileSystem.current.setState({...closeFileSystemMenus})
            );
        }

        changeFolderFromPath(folder_name) {
            let current_list = this.state.currentFolderPathList;

            // Remove the last element of the path until we find folder_name or until root
            while (current_list.length > 1 && current_list[current_list.length - 1] !== folder_name) {
                current_list.pop();
            }
            this.setCurrentPath(current_list);
        }

        deletePrivateSession(e, privateSession) {
            e.stopPropagation();
            fetch(process.env.REACT_APP_API_URL + "/delete-private-session", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "sessionId": privateSession
                })
            })
            .then(response => {return response.json()})
            .then(data => {
                if (data.success) {
                    this.setState({privateSessions: data["private_sessions"]})
                }
            });
        }

        render() {
            const buttonsDisabled = this.state.searchMenu || this.state.layoutMenu || this.state.editingMenu;
            return (
                <Box className="App" sx={{height: '100vh'}}>
                    <Notification message={""} severity={"success"} ref={this.successNot}/>
                    <Notification message={""} severity={"error"} ref={this.errorNot}/>

                    <VersionsMenu ref={this.versionsMenu}/>
                    <LogsMenu ref={this.logsMenu}/>
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
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    ml: '0.2rem'
                                }}
                            >
                                {
                                    this.state.currentFolderPathList.map((folder, index) => {
                                        const name = index > 0 ? folder : "Início";
                                        const folderDepth = this.state.currentFolderPathList.length;

                                        if (this.state.searchMenu && index > 0)
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
                                                    disabled={!this.state.searchMenu && buttonsDisabled}
                                                    key={folder}
                                                    onClick={() => {
                                                        if (index === 0 && this.state.searchMenu) {
                                                            this.setState({...fileSystemState,
                                                                filesChoice: [],
                                                                algorithmChoice: [],
                                                                configChoice: []
                                                            });
                                                        //} else if (this.getPrivateSession() !== null) {
                                                        //    this.redirectHome();
                                                        } else {
                                                            this.changeFolderFromPath(folder);
                                                        }
                                                    }}
                                                    className="pathElement pathButton"
                                                    variant="text"
                                                >
                                                    {name}
                                                </Button>
                                                <p key={index} style={{margin: 0}}>/</p>
                                            </Box>
                                        )
                                    })
                                }
                                <p className="pathElement">
                                    {this.state.fileOpened}
                                </p>
                                {
                                    (!buttonsDisabled && (this.state.currentFolderPathList.length > 1 || this.getPrivateSession() != null))  // in private session, root level can have docs
                                        ? <Button
                                            variant="text"
                                            startIcon={<NoteAddIcon/>}
                                            onClick={() => this.fileSystem.current.createFile()}
                                            className="pathElement"
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
                                    this.setState(searchMenuState)
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

                    {
                        window.location.href.includes(process.env.REACT_APP_ADMIN)
                        ? <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'right',
                            alignItems: "center",
                            zIndex: '5',
                            pt: '0.5rem',
                            pl: '0.5rem',
                            pb: '0.5rem',
                            pr: '0.5rem',
                        }}>
                            <Box sx={{display: "flex", flexDirection: "column"}}>
                                <Button
                                    sx={{
                                        alignItems: "center",
                                        textTransform: "none",
                                        height: "2rem",
                                        mr: "1.5rem"
                                    }}
                                    onClick={() => this.setState({privateSessionsOpen: !this.state.privateSessionsOpen})}
                                >
                                    Sessões Privadas
                                    {
                                        this.state.privateSessionsOpen
                                        ? <KeyboardArrowUpRoundedIcon sx={{ml: '0.3rem'}} />
                                        : <KeyboardArrowDownRoundedIcon sx={{ml: '0.3rem'}} />
                                    }
                                </Button>

                                {
                                    this.state.privateSessionsOpen
                                    ? <Box
                                        sx = {{
                                            display: "flex",
                                            flexDirection: "column",
                                            position: 'absolute',
                                            zIndex: "1",
                                            backgroundColor: "#fff",
                                            border: "1px solid black",
                                            borderRadius: '0.5rem',
                                            top: "5.5rem",
                                            p: "0rem 1rem",
                                            width: "8rem",

                                        }}
                                    >
                                        {
                                            this.state.privateSessions.map((privateSession, index) => {
                                                return (
                                                    <Box
                                                        key={index}
                                                        sx={{
                                                            display: "flex",
                                                            flexDirection: "row",
                                                            justifyContent: "space-between",
                                                            height: "2rem",
                                                            lineHeight: "2rem",
                                                            borderTop: index !== 0 ? "1px solid black" : "0px solid black",
                                                            cursor: "pointer"
                                                        }}
                                                        onClick={() => {
                                                            if (window.location.href.endsWith("/")) {
                                                                window.location.href += privateSession
                                                            } else {
                                                                window.location.href += "/" + privateSession
                                                            }
                                                        }}
                                                    >
                                                        <span>{privateSession}</span>
                                                        <TooltipIcon
                                                            color="#f00"
                                                            message="Apagar"
                                                            clickFunction={(e) => this.deletePrivateSession(e, privateSession)}
                                                            icon={<DeleteForeverIcon />}
                                                        />
                                                    </Box>
                                                )
                                            })
                                        }
                                    </Box>
                                    : null
                                }
                            </Box>

                            {/* <Button
                                sx={{
                                    p: 0,
                                    mr: "1.5rem",
                                    textTransform: "none",
                                }}
                                onClick={() => this.openLogsMenu()}
                            >
                                <AssignmentRoundedIcon sx={{mr: "0.3rem"}} />
                                Logs
                            </Button> */}

                            <span>Free Space: {this.state.freeSpace} ({this.state.freeSpacePercentage}%)</span>
                        </Box>
                        : null
                    }

                    <Box>
                        {
                            !this.state.searchMenu
                            ? <FileExplorer ref={this.fileSystem}
                                            _private={this.getPrivateSession() !== null}
                                            sessionId={this.state.sessionId || ""}  // sessionId or empty str if null
                                            current_folder={this.state.currentFolderPathList}
                                            setCurrentPath={this.setCurrentPath}
                                            enterLayoutMenu={this.enterLayoutMenu}
                                            enterEditingMenu={this.enterEditingMenu}
                                            exitMenus={this.exitMenus}/>
                            : <ESPage filesChoice={this.state.filesChoice}
                                      algorithmChoice={this.state.algorithmChoice}
                                      configChoice={this.state.configChoice}/>
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
