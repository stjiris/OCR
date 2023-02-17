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

const UPDATE_TIME = 15;

class FileExplorer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            app: props.app,
            files: props.files,
            info: {},
            current_folder: props.current_folder.split('/'),
            buttonsDisabled: props.current_folder.split('/').length === 1,
            components: [],

            loading: false,
        }

        this.folderMenu = React.createRef();
        this.fileMenu = React.createRef();
        this.deleteMenu = React.createRef();

        this.interval = null;
        this.rowRefs = [];
    }

    componentDidMount() {
        fetch(process.env.REACT_APP_API_URL + 'files', {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            var info = data["info"];
            var files = {'files': data["files"]};
            this.setState({files: files, info: info, loading: false}, this.displayFileSystem);
        });

        this.interval = setInterval(() => {
            fetch(process.env.REACT_APP_API_URL + 'info', {
                method: 'GET'
            })
            .then(response => {return response.json()})
            .then(data => {
                var info = data["info"];
                    
                this.rowRefs.forEach(ref => {
                    var rowInfo = info[this.state.current_folder.join("/") + "/" + ref.current.state.name];
                    ref.current.updateInfo(rowInfo);
                });

                this.setState({info: info});
            });
        }, 1000 * UPDATE_TIME);
    }

    componentWillUnmount() {
        if (this.interval)
            clearInterval(this.interval);
    }

    updateFiles(data) {
        var files = {'files': data['files']}
        var info = data['info'];

        this.setState({ files: files, info: info }, this.displayFileSystem);
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

        this.setState({ components: fileCopy })
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
        this.displayFileSystem);
    }

    getTxt(file) {
        this.getDocument("get_txt", file);
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
        this.displayFileSystem);
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

    getInfo(path) {
        return this.state.info[path];
    }

    sortContents(contents) {
        /**
         * Sorts the contents of the current folder
         * First order by type (folder, file)
         * Then order by name
         */
        var folders = [];
        var files = [];

        for (let f in contents) {
            var item = contents[f];
            if (typeof item === 'string' || item instanceof String) {
                files.push(item);
            } else {
                folders.push(item);
            }
        }

        folders.sort(function(d1, d2) {
            var key1 = Object.keys(d1)[0];
            var key2 = Object.keys(d2)[0];
            return key1.localeCompare(key2);
        });
        files.sort();

        return folders.concat(files);
    }

    displayFileSystem() {
        var contents = this.sortContents(this.getPathContents());
        this.rowRefs = [];

        var items = [];

        for (let f in contents) {
            var ref = React.createRef();
            this.rowRefs.push(ref);
            var item = contents[f];
            if (typeof item === 'string' || item instanceof String) {
                items.push(
                    <FileRow
                        ref={ref}
                        key={item}
                        name={item}
                        info={this.getInfo(this.state.current_folder.join("/") + "/" + item)}
                        filesystem={this}
                    />
                )
            } else {
                var key = Object.keys(item)[0];
                items.push(
                    <FolderRow
                        ref={ref}
                        key={key}
                        name={key}
                        info={this.getInfo(this.state.current_folder.join("/") + "/" + key)}
                        filesystem={this}
                    />
                )
            }
        }
        this.setState({components: items});
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
                            <TableCell align='center'><b>Number of Files/Pages</b></TableCell>
                            <TableCell align='center'><b>Size</b></TableCell>
                            <TableCell align='center'><b>Progress</b></TableCell>
                            <TableCell align='center'></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.state.components}
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