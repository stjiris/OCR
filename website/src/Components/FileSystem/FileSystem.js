import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import FolderMenu from '../Form/FolderMenu';
import FileMenu from '../Form/FileMenu';
import DeleteMenu from '../Form/DeleteMenu';

import FolderRow from './FolderRow';
import FileRow from './FileRow';

import NoteAddIcon from '@mui/icons-material/NoteAdd';
import UndoIcon from '@mui/icons-material/Undo';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';


class FileExplorer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            app: props.app,
            files: props.files,
            current_folder: props.current_folder.split('/'),
            contents: [],
            buttonsDisabled: props.current_folder.split('/').length === 1,
        }

        this.folderMenu = React.createRef();
        this.fileMenu = React.createRef();
        this.deleteMenu = React.createRef();
    }

    componentDidMount() {
        fetch(process.env.REACT_APP_API_URL + 'files', {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            this.setState({files: data}, this.contentsOfFolder);
        });
    }

    updateFiles(files) {
        this.setState({ files: files }, this.contentsOfFolder);
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

    createFolder() {
        this.folderMenu.current.currentPath(this.state.current_folder.join('/'));
        this.folderMenu.current.toggleOpen();
    }

    createFile() {
        this.fileMenu.current.currentPath(this.state.current_folder.join('/'));
        this.fileMenu.current.toggleOpen();
    }

    getDocument(route, name) {
        var path = this.state.current_folder.join('/') + '/' + name;
        fetch(process.env.REACT_APP_API_URL + route + '?path=' + path, {
            method: 'GET'
        })
        .then(response => {return response.blob()})
        .then(data => {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(data);
            a.download = name + ((route === "get_txt") ? "-Text.txt" : "");
            a.click();
            a.remove();
        });
    }

    goBack() {
        var current_folder = this.state.current_folder;
        current_folder.pop();
        var buttonsDisabled = current_folder.length === 1;
        var createFileButtonDisabled = current_folder.length === 1;
        this.state.app.setState({path: current_folder.join('/')});
        this.setState({
            current_folder: current_folder,
            buttonsDisabled: buttonsDisabled,
            createFileButtonDisabled: createFileButtonDisabled},
        this.contentsOfFolder);
    }

    editFile(file) {
        var path = this.state.current_folder.join('/');
        var filename = path + '/' + file;
        this.state.app.openFile(path, filename);
    }

    viewFile(file) {
        var path = this.state.current_folder.join('/');
        var filename = path + '/' + file;
        this.state.app.viewFile(filename);
    }

    deleteItem(name) {
        this.deleteMenu.current.currentPath(this.state.current_folder.join('/') + '/' + name);
        this.deleteMenu.current.toggleOpen();
    }

    enterFolder(folder) {
        var current_folder = this.state.current_folder;
        current_folder.push(folder);
        this.state.app.setState({path: current_folder.join('/')});
        this.setState({
            current_folder: current_folder,
            buttonsDisabled: false,
            createFileButtonDisabled: false},
        this.contentsOfFolder);
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

    getPathContents() {
        var files = this.state.files;
        var current_folder = this.state.current_folder;

        for (let f in current_folder) {
            var key = current_folder[f];
            files = this.findFolder(files, key);
        }

        return files;
    }

    displayFileSystem() {
        var contents = this.getPathContents();

        var items = [];

        for (let f in contents) {
            var item = contents[f];
            if (typeof item === 'string' || item instanceof String) {
                items.push(
                    <FileRow key={item} name={item} filesystem={this} />
                )
            } else {
                var key = Object.keys(item)[0];
                items.push(
                    <FolderRow key={key} name={key} filesystem={this} />
                )
            }
        }
        return items;
    }

    generateTable() {
        return (
            <TableContainer component={Paper}>
                <Table aria-label="filesystem table">
                    <TableHead>
                        <TableRow>
                            <TableCell><b>Name</b></TableCell>
                            <TableCell align='center'><b>Date Created</b></TableCell>
                            <TableCell align='center'><b>Date Modified</b></TableCell>
                            <TableCell align='center'><b>Number of Files</b></TableCell>
                            <TableCell align='center'><b>Size</b></TableCell>
                            <TableCell align='center'></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.displayFileSystem()}
                    </TableBody>
                </Table>
            </TableContainer>
        )
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
                    disabled={this.state.buttonsDisabled}
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
                    disabled={this.state.buttonsDisabled}
                    variant="contained"
                    startIcon={<NoteAddIcon />}
                    onClick={() => this.createFile()}
                    sx={{border: '1px solid black', mb: '0.5rem'}}
                >
                    Add Document
                </Button>

                {
                    this.generateTable()
                }
            </Box>
        );
    }
}

export { FileExplorer };