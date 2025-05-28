import './App.css';
import React, {useEffect, useState} from 'react';
import axios from "axios";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import loadComponent from './utils/loadComponents';
import footerBanner from './static/footerBanner.png';

import LockIcon from '@mui/icons-material/Lock';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import HelpIcon from '@mui/icons-material/Help';

import {fileSystemState, layoutMenuState, editingMenuState, searchMenuState, closeFileSystemMenus} from "./states";
import {BrowserRouter, Outlet, Route, Routes, useNavigate, useParams} from "react-router";

const Notification = loadComponent('Notification', 'Notifications');
const FileExplorer = loadComponent('FileSystem', 'FileSystem');
const ESPage = loadComponent('ElasticSearchPage', 'ESPage');
const LoginPage = loadComponent('Admin', 'LoginPage');
const AdminDashboard = loadComponent('Admin', 'Dashboard');

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;

/**
 * About Versioning:
 * Version -> MAJOR.MINOR.PATCH
 * MAJOR version when you make incompatible API changes
 * MINOR version when you add functionality in a backwards compatible manner
 * PATCH version when you make backwards compatible bug fixes
 */

const VERSION = "1.0.0";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const login = () => {
        setIsAuthenticated(true);
    };
    const logout = () => {
        setIsAuthenticated(false);
    };

    useEffect(() => {
        // Check if session already logged in
        axios.get(API_URL + "/account/check-auth")
            .then(r => {
                login();
            })
            .catch(e=>{});
    }, []);

    const ProtectedRoute = ({ isAuthenticated, setLoggedIn }) => {
        return (isAuthenticated
        ? <Outlet/>
        : <LoginPage setLoggedIn={setLoggedIn}/>);
    };

    // Allow Form to get the session ID parameter from the route URL
    const WrappedForm = (props) => {
        const { sessionId } = useParams();
        const navigate = useNavigate();
        return <Form sessionId={sessionId} navigate={navigate} />;
    }

    class Form extends React.Component {
        static defaultProps = {
            sessionId: null,
            navigate: null,
        }
        constructor(props) {
            super(props);
            this.state = {
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

            this.fileSystem = React.createRef();

            this.setCurrentPath = this.setCurrentPath.bind(this);
            this.enterLayoutMenu = this.enterLayoutMenu.bind(this);
            this.enterEditingMenu = this.enterEditingMenu.bind(this);
            this.exitMenus = this.exitMenus.bind(this);
        }

        getPrivateSession() {
            if (["", "ocr", "ocr-dev", "ocr-prod", process.env.REACT_APP_ADMIN].includes(this.props.sessionId)) return null;
            // if (this.state.sessionId.startsWith("localhost")) return null;
            return this.props.sessionId;
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

        /*
        sendChanges() {
             //
             //Send the changes to the server
             //
            fetch(API_URL + '/submit-text', {
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
            return fetch(API_URL + '/create-private-session', {
                method: 'GET'
            })
            .then(response => {return response.json()})
            .then(data => {return data["sessionId"]});
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

        render() {
            const buttonsDisabled = this.state.searchMenu || this.state.layoutMenu || this.state.editingMenu;
            return (
                <Box className="App" sx={{height: '100vh'}}>
                    <Notification message={""} severity={"success"} ref={this.successNot}/>
                    <Notification message={""} severity={"error"} ref={this.errorNot}/>

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
                                onClick={() => {
                                    this.createPrivateSession().then((sessionId) => {
                                        this.props.navigate(`/session/${sessionId}`);
                                    });
                                }}
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
                                    // in private session, root level can have docs
                                    (!buttonsDisabled && (this.state.currentFolderPathList.length > 1 || Boolean(this.getPrivateSession())))
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
                                disabled={buttonsDisabled || Boolean(this.getPrivateSession())}
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

                    <Box>
                        {
                            !this.state.searchMenu
                            ? <FileExplorer ref={this.fileSystem}
                                            _private={Boolean(this.getPrivateSession())}
                                            sessionId={this.props.sessionId || ""}  // sessionId or empty str if null
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
        <BrowserRouter>
            <Routes>
                <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} setLoggedIn={login} />} >
                    <Route exact path="/admin" element={<AdminDashboard />} />
                </Route>
                <Route exact path="/login" element={"TEMP LOGIN ROUTE"} />
                <Route index element={<WrappedForm />} />
                <Route path="/session/:sessionId" element={<WrappedForm />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
