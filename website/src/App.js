import './App.css';
import React, {useEffect, useState} from 'react';
import axios from "axios";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/pt";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import loadComponent from './utils/loadComponents';
import footerBanner from './static/footerBanner.png';

import LockIcon from '@mui/icons-material/Lock';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import HelpIcon from '@mui/icons-material/Help';

import {
    BrowserRouter,
    Navigate,
    Outlet,
    Route,
    Routes, useLocation,
    useNavigate,
    useParams
} from "react-router";

import {
    fileSystemState,
    layoutMenuState,
    editingMenuState,
    searchMenuState,
    closeFileSystemMenus,
    ocrMenuState
} from "./states";
import StorageManager from "./Components/Admin/Geral/StorageManager";

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

const VERSION = "1.1.0";

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

    const ProtectedRoute = ({ isAuthenticated }) => {
        const location = useLocation();
        return (isAuthenticated
        ? <Outlet/>
        : <Navigate to="/admin/login" state={{ originPath: location.pathname }} replace />);
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

                fileOpened: null,
                currentFolderPathList: [""],

                filesChoice: [],
                algorithmChoice: [],
                configChoice: [],

                privateSessionsOpen: false,
                privateSessions: [],
                freeSpace: props.freeSpace || 0,
                freeSpacePercentage: props.freeSpacePercentage || 0,
            }

            this.header = React.createRef();

            this.fileSystem = React.createRef();

            this.setCurrentPath = this.setCurrentPath.bind(this);
            this.enterOcrMenu = this.enterOcrMenu.bind(this);
            this.enterLayoutMenu = this.enterLayoutMenu.bind(this);
            this.enterEditingMenu = this.enterEditingMenu.bind(this);
            this.exitMenus = this.exitMenus.bind(this);
        }

        getPrivateSession() {
            if (["", "ocr", "ocr-dev", "ocr-prod"].includes(this.props.sessionId)) return null;
            return this.props.sessionId;
        }

        /*
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
         */

        createPrivateSession() {
            return axios.get(API_URL + '/create-private-session')
            .then(({data}) => {return data["sessionId"]});
        }

        setCurrentPath(new_path_list, isDocument=false) {
            // replace(/^\//, '') removes '/' from the start of the path. the server expects non-absolute paths
            let fileOpened = null;
            if (isDocument) {
                fileOpened = new_path_list.pop();
            }
            // ensure empty root item, lost if the path was joined into a string and split again
            if (new_path_list[0] !== "") new_path_list.unshift("");

            this.setState({...fileSystemState, currentFolderPathList: new_path_list, fileOpened: fileOpened},
                () => this.fileSystem.current.setState({
                    ...closeFileSystemMenus,
                    current_folder: new_path_list.join('/').replace(/^\//, ''),
                    fileOpened: fileOpened,
                })
            );
        }

        enterOcrMenu(filename, isFolder=false, isSinglePage=false, customConfig=null) {
            this.setState({...ocrMenuState, fileOpened: filename},
                () => this.fileSystem.current.setState(
                    {
                        ...ocrMenuState,
                        fileOpened: filename,
                        isFolder: isFolder,
                        isSinglePage: isSinglePage,
                        customConfig: customConfig
                    })
            );
        }

        enterLayoutMenu(filename) {
            this.setState({...layoutMenuState, fileOpened: filename},
                () => this.fileSystem.current.setState({...layoutMenuState, fileOpened: filename})
            );
        }

        enterEditingMenu(filename) {
            this.setState({...editingMenuState, fileOpened: filename},
                () => this.fileSystem.current.setState({...editingMenuState, fileOpened: filename})
            );
        }

        exitMenus(callback) {
            this.setState({...fileSystemState, fileOpened: null},
        () => this.fileSystem.current.setState({...closeFileSystemMenus},
                    () => { if (callback) callback(); })
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
            const buttonsDisabled = this.state.ocrMenu || this.state.searchMenu || this.state.layoutMenu || this.state.editingMenu;
            return (
                <Box className="App" sx={{height: '100vh'}}>
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
                                className="menuButton"
                            >
                                Sessão Privada
                            </Button>

                            <Button
                                disabled={buttonsDisabled}
                                variant="contained"
                                startIcon={<CreateNewFolderIcon/>}
                                onClick={() => this.fileSystem.current.createFolder()}
                                className="menuButton"
                                sx={{ml: '0.5rem'}}
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

                                        // Show hint of collapsed names when inside deep folder
                                        if (folderDepth > 3 && index === 1) {
                                            return (
                                                <Box sx={{display: "flex", flexDirection: "row", lineHeight: "2rem"}}>
                                                    <p key={index} style={{margin: 0}}>... /</p>
                                                </Box>
                                            )
                                        }

                                        // Hide intermediate folder names when inside deep folder
                                        if (folderDepth > 3 && index > 0 && index < folderDepth - 2) return null;

                                        // If not in menu or inside document "folder" containing original and results,
                                        // make current folder non-clickable (folder names are clickable to go back)
                                        if (!this.state.fileOpened && index > 0 && index === folderDepth - 1) {
                                            return <p className="pathElement">
                                                {name}
                                            </p>
                                        } else return (
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
                                    (!buttonsDisabled
                                        && !this.state.fileOpened
                                        && (this.state.currentFolderPathList.length > 1 || Boolean(this.getPrivateSession())))
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

                            {/* TODO: update help document */}
                            <Button
                                disabled={true}
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
                                            enterOcrMenu={this.enterOcrMenu}
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
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt">
            <BrowserRouter basename={`/${process.env.REACT_APP_BASENAME}`}>
                <Routes>
                    <Route index element={<WrappedForm />} />
                    <Route path="/session/:sessionId" element={<WrappedForm />} />

                    <Route element={<ProtectedRoute isAuthenticated={isAuthenticated}/>} >
                        <Route exact path="/admin" element={<AdminDashboard />} />
                        <Route exact path="/admin/storage" element={<StorageManager />} />
                    </Route>
                    <Route exact path="/admin/login" element={<LoginPage isAuthenticated={isAuthenticated} setLoggedIn={login}/>} />
                </Routes>
            </BrowserRouter>
        </LocalizationProvider>
    );
}

export default App;
