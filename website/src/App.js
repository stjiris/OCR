import './App.css';
import React, {useEffect, useState} from 'react';
import axios from "axios";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/pt";

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from "@mui/material/Typography";

import LockIcon from '@mui/icons-material/Lock';
import HelpIcon from '@mui/icons-material/Help';
import SearchIcon from '@mui/icons-material/Search';

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
    ocrMenuState
} from "./states";

import loadComponent from './utils/loadComponents';
const FileExplorer = loadComponent('FileSystem', 'FileSystem');
const ESPage = loadComponent('ElasticSearchPage', 'ESPage');
const LoginPage = loadComponent('Admin', 'LoginPage');
const AdminDashboard = loadComponent('Admin', 'Dashboard');
const StorageManager = loadComponent('Admin', 'StorageManager');
const ConfigManager = loadComponent('Admin', 'ConfigManager');
const Footer = loadComponent('Footer', 'Footer');

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;

/**
 * About Versioning:
 * Version -> MAJOR.MINOR.PATCH
 * MAJOR version when you make incompatible API changes
 * MINOR version when you add functionality in a backwards compatible manner
 * PATCH version when you make backwards compatible bug fixes
 */

const VERSION = "1.3.0a";

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const login = () => {
        setIsAuthenticated(true);
    };
    const logout = () => {
        setIsAuthenticated(false);
    };

    useEffect(() => {
        // Check if admin already logged in
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

    // Allow Form to get the space ID parameter from the route URL
    const WrappedForm = (props) => {
        const { spaceId } = useParams();
        const navigate = useNavigate();
        return <Form spaceId={spaceId} navigate={navigate} />;
    }

    class Form extends React.Component {
        static defaultProps = {
            spaceId: null,
            navigate: null,
        }
        constructor(props) {
            super(props);
            this.state = {
                searchMenu: false,
                editingMenu: false,
                layoutMenu: false,

                currentFileName: null,
                currentFolderPathList: [""],

                ocrTargetIsFolder: false,
                ocrTargetIsSinglePage: false,
                customConfig: null,

                filesChoice: [],
                algorithmChoice: [],
                configChoice: [],

                privateSpacesOpen: false,
                privateSpaces: [],
                freeSpace: props.freeSpace || 0,
                freeSpacePercentage: props.freeSpacePercentage || 0,
            }

            this.header = React.createRef();

            this.fileSystem = React.createRef();

            this.setCurrentPath = this.setCurrentPath.bind(this);
            this.returnToParentFolder = this.returnToParentFolder.bind(this);
            this.enterOcrMenu = this.enterOcrMenu.bind(this);
            this.setCurrentCustomConfig = this.setCurrentCustomConfig.bind(this);
            this.enterLayoutMenu = this.enterLayoutMenu.bind(this);
            this.enterEditingMenu = this.enterEditingMenu.bind(this);
            this.exitMenus = this.exitMenus.bind(this);
            this.closeSearchMenu = this.closeSearchMenu.bind(this);
        }

        getPrivateSpaceId() {
            if (["", "ocr", "ocr-dev", "ocr-prod"].includes(this.props.spaceId)) return null;
            return this.props.spaceId;
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

        createPrivateSpace() {
            return axios.get(API_URL + '/create-private-space')
            .then(({data}) => {return data["space_id"]});
        }

        setCurrentPath(new_path_list, isDocument=false) {
            // replace(/^\//, '') removes '/' from the start of the path. the server expects non-absolute paths
            let currentFileName = null;
            if (isDocument) {
                currentFileName = new_path_list.pop();
            }
            // ensure empty root item, lost if the path was joined into a string and split again
            if (new_path_list[0] !== "") new_path_list.unshift("");

            this.setState({...fileSystemState, currentFolderPathList: new_path_list, currentFileName: currentFileName});
        }

        enterOcrMenu(filename, ocrTargetIsFolder=false, ocrTargetIsSinglePage=false, customConfig=null) {
            this.setState({
                ...ocrMenuState,
                currentFileName: filename,
                ocrTargetIsFolder: ocrTargetIsFolder,
                ocrTargetIsSinglePage: ocrTargetIsSinglePage,
                customConfig: customConfig,
            });
        }

        /*
        Used to pass down an updated customConfig prop without fetching all info from the server
         */
        setCurrentCustomConfig(customConfig) {
            this.setState({customConfig: customConfig});
        }

        enterLayoutMenu(filename) {
            this.setState({...layoutMenuState, currentFileName: filename});
        }

        enterEditingMenu(filename) {
            this.setState({...editingMenuState, currentFileName: filename});
        }

        exitMenus(callback) {
            this.setState({...fileSystemState, currentFileName: null},
                () => { if (callback) callback(); }
            );
        }

        returnToParentFolder() {
            if (this.state.currentFileName !== null) {
                this.setState({currentFileName: null});
            } else {
                let current_list = this.state.currentFolderPathList;
                current_list.pop();
                this.setCurrentPath(current_list);
            }
        }

        changeFolderFromPath(folder_name) {
            let current_list = this.state.currentFolderPathList;

            // Remove the last element of the path until we find folder_name or until root
            while (current_list.length > 1 && current_list[current_list.length - 1] !== folder_name) {
                current_list.pop();
            }
            this.setCurrentPath(current_list);
        }

        closeSearchMenu() {
            this.setState({...fileSystemState,
                filesChoice: [],
                algorithmChoice: [],
                configChoice: []
            });
        }

        render() {
            const buttonsDisabled = this.state.ocrMenu || this.state.searchMenu || this.state.layoutMenu || this.state.editingMenu;
            return (
                <Box className="App" sx={{height: "100vh", display: "flex", flexDirection: "column"}}>
                    <Box sx={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                    }}>
                        <Typography
                            id="modal-modal-title"
                            variant="h3"
                            component="h1"
                            sx={{
                                textAlign: "center",
                                color: "#1976d2",
                                margin: "auto",
                            }}
                        >
                            {
                                this.getPrivateSpaceId()
                                    ? `Espaço Privado - ${this.getPrivateSpaceId()}`
                                    : "OCR - Reconhecimento Ótico de Caracteres"
                            }
                        </Typography>

                        {
                            this.getPrivateSpaceId()
                                ? <Button
                                    disabled={buttonsDisabled}
                                    variant="contained"
                                    startIcon={<LockIcon/>}
                                    onClick={() => { this.props.navigate("/"); }}
                                    className="menuButton"
                                    color="error"
                                    sx={{marginRight: "1rem"}}
                                >
                                    Sair do Espaço
                                </Button>
                                : <Button
                                    disabled={buttonsDisabled}
                                    variant="contained"
                                    startIcon={<LockIcon/>}
                                    onClick={() => {
                                        this.createPrivateSpace().then((spaceId) => {
                                            //this.setCurrentPath([""]);
                                            this.setState({currentFolderPathList: [""]});
                                            this.props.navigate(`/space/${spaceId}`);
                                        });
                                    }}
                                    className="menuButton"
                                    sx={{marginRight: "1rem"}}
                                >
                                    Novo Espaço Privado
                                </Button>
                        }
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        zIndex: '5',
                        // border: '1px solid #000000',
                        paddingTop: '0.5rem',
                        paddingBottom: '0.5rem',
                    }}>
                        <Box sx={{display: "flex", flexDirection: "row"}}>
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
                                        if (!this.state.currentFileName && index > 0 && index === folderDepth - 1) {
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
                                                            this.closeSearchMenu();
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
                                    {this.state.currentFileName}
                                </p>
                            </Box>
                        </Box>

                        <Box sx={{display: "flex", flexDirection: "row", lineHeight: "2rem"}}>
                            {buttonsDisabled || Boolean(this.getPrivateSpaceId())
                                ? null
                                : <Button
                                    variant="contained"
                                    startIcon={<SearchIcon />}
                                    onClick={() => {
                                        this.setState(searchMenuState)
                                    }}
                                    className="menuButton"
                                    sx={{mr: '1.5rem'}}
                                >
                                    Pesquisar
                                </Button>
                            }

                            <p style={{margin: 0}}>{`Versão: ${VERSION}`}</p>

                            {/* TODO: update help document */}
                            <Button
                                variant="text"
                                onClick={() => window.open("https://docs.google.com/document/d/e/2PACX-1vTjGei4_szYIrD8G7x2UmNKlbOsW_JZmVj0E2J4933-hXjkU9iuKGr0J8Aj6qpF25HlCb9y3vMadC23/pub", '_blank')}
                                startIcon={<HelpIcon/>}
                                sx={{
                                    marginLeft: '1.5rem',
                                    marginRight: '0.5rem',
                                    textTransform: 'none',
                                    p: 0
                                }}
                            >
                                Manual de Utilizador
                            </Button>
                        </Box>
                    </Box>

                    <Box>
                        {
                            !this.state.searchMenu
                            ? <FileExplorer ref={this.fileSystem}
                                            _private={Boolean(this.getPrivateSpaceId())}
                                            spaceId={this.props.spaceId || ""}  // spaceId or empty str if null
                                            current_folder={
                                                // replace(/^\//, '') removes '/' from the start of the path. the server expects non-absolute paths
                                                this.state.currentFolderPathList.join('/').replace(/^\//, '')
                                            }
                                            current_file_name={this.state.currentFileName}
                                            ocrTargetIsFolder={this.state.ocrTargetIsFolder}
                                            ocrTargetIsSinglePage={this.state.ocrTargetIsSinglePage}
                                            customConfig={this.state.customConfig}
                                            ocrMenu={this.state.ocrMenu}
                                            layoutMenu={this.state.layoutMenu}
                                            editingMenu={this.state.editingMenu}
                                            setCurrentPath={this.setCurrentPath}
                                            returnToParentFolder={this.returnToParentFolder}
                                            enterOcrMenu={this.enterOcrMenu}
                                            setCurrentCustomConfig={this.setCurrentCustomConfig}
                                            enterLayoutMenu={this.enterLayoutMenu}
                                            enterEditingMenu={this.enterEditingMenu}
                                            exitMenus={this.exitMenus}/>
                            : <ESPage filesChoice={this.state.filesChoice}
                                      algorithmChoice={this.state.algorithmChoice}
                                      configChoice={this.state.configChoice}
                                      closeSearchMenu={this.closeSearchMenu}/>
                        }
                    </Box>

                    <Footer />
                </Box>
            )
        }
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt">
            <BrowserRouter basename={`/${process.env.REACT_APP_BASENAME}`}>
                <Routes>
                    <Route index element={<WrappedForm />} />
                    <Route path="/space/:spaceId" element={<WrappedForm />} />

                    <Route element={<ProtectedRoute isAuthenticated={isAuthenticated}/>} >
                        <Route exact path="/admin" element={<AdminDashboard />} />
                        <Route exact path="/admin/storage" element={<StorageManager />} />
                        <Route exact path="/admin/config" element={<ConfigManager />} />
                    </Route>
                    <Route exact path="/admin/login" element={<LoginPage isAuthenticated={isAuthenticated} setLoggedIn={login}/>} />
                </Routes>
            </BrowserRouter>
        </LocalizationProvider>
    );
}

export default App;
