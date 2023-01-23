import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import FolderMenu from '../Form/FolderMenu';
import FileMenu from '../Form/FileMenu';
import DeleteMenu from '../Form/DeleteMenu';

import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import UndoIcon from '@mui/icons-material/Undo';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const ICONS_SPACING = '1.1rem';
const ICONS_WIDTH = '100px';

var BASE_URL = 'http://localhost:5001/'

class FileItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: props.name,
            type: props.type,
            filesystem: props.filesystem,
            menu: false
        }
    }

    mouseHovering() {
        this.setState({ menu: true });
    }

    mouseNotHovering() {
        this.setState({ menu: false });
    }

    handleClick = event => {
        if (this.state.type === 'folder' && event.detail >= 2) {
            this.state.filesystem.enterFolder(this.state.name);
        } else if (this.state.type === 'file' && event.detail >= 2) {
            this.state.filesystem.openFile(this.state.name);
        }
    }

    deleteItem() {
        this.state.filesystem.deleteItem(this.state.name);
    }

    getTxt() {
        this.state.filesystem.getTxt(this.state.name);
    }

    render() {
        return (
            <div onMouseEnter={() => this.mouseHovering()} onMouseLeave={() => this.mouseNotHovering()}>

                <Box sx={{
                    m: ICONS_SPACING,
                    width: ICONS_WIDTH,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <link
                        rel="stylesheet"
                        href="https://fonts.googleapis.com/icon?family=Material+Icons"
                    />

                    {
                        this.state.type === 'folder'
                        ? <FolderOpenRoundedIcon onClick={this.handleClick} color="success" sx={{ fontSize: 60 }} />
                        : <InsertDriveFileOutlinedIcon onClick={this.handleClick} color="primary" sx={{ fontSize: 60 }} />
                    }

                    <span>{
                        this.state.name.length > 11
                        ? this.state.name.substring(0, 11) + '...'
                        : this.state.name
                    }</span>
                    
                    {
                        this.state.menu
                        ? <Box sx={{
                            position: 'absolute',
                            height: '2rem',
                            bgcolor: 'white',
                            border: '1px solid black',
                            borderRadius: '20px',
                            transform: 'translate(0, -100%)',
                            display: 'flex',
                            flexDirection: 'row',
                        }}>
                            {
                                this.state.type !== 'folder'
                                ? <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center'
                                }}>
                                    <IconButton color="error" aria-label="delete" onClick={() => this.deleteItem()} sx={{
                                        paddingRight: '0px',
                                    }}>
                                        <DeleteForeverIcon />
                                        <p style={{fontSize: '13px'}}>DEL</p>
                                    </IconButton>
                                    <IconButton color="info" aria-label="download_file" sx={{
                                        paddingRight: '0px'
                                    }}>
                                        <FileDownloadIcon />
                                        <p style={{fontSize: '13px'}}>
                                            {
                                                this.state.name.split('.')[1].toUpperCase()
                                            }
                                        </p>
                                    </IconButton>
                                    <IconButton color="success" aria-label="download_txt"
                                        onClick={() => this.getTxt()}
                                    >
                                        <FileDownloadIcon />
                                        <p style={{fontSize: '13px'}}>TXT</p>
                                    </IconButton>
                                </Box>
                                : <IconButton color="error" aria-label="delete" onClick={() => this.deleteItem()}>
                                        <DeleteForeverIcon />
                                        <p style={{fontSize: '13px'}}>DEL</p>
                                    </IconButton>
                            }
                        </Box>
                        : null
                    }
                </Box>
            </div>
        );
    }
}

class FileExplorer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            app: props.app,
            files: props.files,
            current_folder: props.current_folder.split('/'),
            contents: [],
            backButtonDisabled: true,

            pageContents: []
        }

        this.folderMenu = React.createRef();
        this.fileMenu = React.createRef();
        this.deleteMenu = React.createRef();
    }

    updateFiles(files) {
        this.setState({ files: files }, this.contentsOfFolder);
    }

    findFolder(files, folder) {
        if ( Array.isArray(files) ) {
            var i;
            for (i = 0; i < files.length; i++) {
                var dict = files[i];
                const key = Object.keys(dict)[0];
                if (key === folder) {
                    return dict[folder];
                }
            }
        }
        return files[folder];
    }

    contentsOfFolder() {
        var current_folder = this.state.current_folder;
        var files = this.state.files;

        for (let f in current_folder) {
            files = this.findFolder(files, current_folder[f]);
        }

        if (files === undefined) {
            files = [];
        }

        var fileCopy = [...files];

        this.setState({ contents: fileCopy })
    }

    componentDidMount() {
        fetch(BASE_URL + 'files', {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            this.setState({files: data}, this.contentsOfFolder);
        });
    }

    createFolder() {
        this.folderMenu.current.currentPath(this.state.current_folder.join('/'));
        this.folderMenu.current.toggleOpen();
    }

    createFile() {
        this.fileMenu.current.currentPath(this.state.current_folder.join('/'));
        this.fileMenu.current.toggleOpen();
    }

    deleteItem(name) {
        this.deleteMenu.current.currentPath(this.state.current_folder.join('/') + '/' + name);
        this.deleteMenu.current.toggleOpen();
    }

    getTxt(name) {
        var path = this.state.current_folder.join('/') + '/' + name;
        fetch(BASE_URL + 'get_txt?path=' + path, {
            method: 'GET'
        })
        .then(response => {return response.blob()})
        .then(data => {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(data);
            a.download = name + "-Text.txt";
            a.click();
            a.remove();
        });
    }

    goBack() {
        var current_folder = this.state.current_folder;
        current_folder.pop();
        var backButtonDisabled = current_folder.length === 1;
        var createFileButtonDisabled = current_folder.length === 1;
        this.setState({
            current_folder: current_folder,
            backButtonDisabled: backButtonDisabled,
            createFileButtonDisabled: createFileButtonDisabled},
        this.contentsOfFolder);
    }

    enterFolder(folder) {
        var current_folder = this.state.current_folder;
        current_folder.push(folder);
        this.setState({
            current_folder: current_folder,
            backButtonDisabled: false,
            createFileButtonDisabled: false},
        this.contentsOfFolder);
    }

    openFile(file) {
        var path = this.state.current_folder.join('/');
        var filename = path + '/' + file;
        this.state.app.openFile(path, filename);
    }

    render() {
        return (
            <Box sx={{
                ml: '1.5rem',
                mr: '1.5rem',
                mb: '1.5rem',
            }}>
                <FolderMenu filesystem={this} ref={this.folderMenu}/>
                <FileMenu filesystem={this} ref={this.fileMenu}/>
                <DeleteMenu filesystem={this} ref={this.deleteMenu} />

                <Button
                    disabled={this.state.backButtonDisabled}
                    variant="contained"
                    startIcon={<UndoIcon />} 
                    sx={{backgroundColor: '#ffffff', color: '#000000', border: '1px solid black', mr: '1rem', mb: '0.5rem', ':hover': {bgcolor: '#dddddd'}}}
                    onClick={() => this.goBack()}
                >
                    Go Back
                </Button>

                <Button
                    color="success"
                    variant="contained"
                    startIcon={<CreateNewFolderIcon />}
                    sx={{border: '1px solid black', mr: '1rem', mb: '0.5rem'}}
                    onClick={() => this.createFolder()}
                >
                    Create Folder
                </Button>

                <Button
                    variant="contained"
                    startIcon={<NoteAddIcon />}
                    onClick={() => this.createFile()}
                    sx={{border: '1px solid black', mb: '0.5rem'}}
                >
                    Submit File
                </Button>

                <Box sx={{
                    borderRadius: 1,
                    border: '1px solid grey',
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    height: '75vh',
                }}>
                    {
                        this.state.contents.length === 0
                        ? <p className='no-file'>No files or folders in here</p>
                        : this.state.contents.map(item => {
                            var path = this.state.current_folder.join("_") + "_";
                            if (typeof item === 'string' || item instanceof String) {
                                return(<FileItem key={path + item} type={"file"} name={item} filesystem={this} />);
                            } else {
                                const key = Object.keys(item)[0];
                                return(<FileItem key={path + key} type={"folder"} name={key} filesystem={this} />);
                            }
                        })
                    }
                </Box>
            </Box>
        );
    }
}

export { FileItem, FileExplorer };