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
import OcrMenu from '../Form/OcrMenu';
import DeleteMenu from '../Form/DeleteMenu';

import FolderRow from './FolderRow';
import FileRow from './FileRow';

import Notification from '../Notification/Notifications';

import NoteAddIcon from '@mui/icons-material/NoteAdd';
import UndoIcon from '@mui/icons-material/Undo';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import SearchIcon from '@mui/icons-material/Search';
import SwapVertIcon from '@mui/icons-material/SwapVert';

import { v4 as uuidv4 } from 'uuid';

const UPDATE_TIME = 15;
const validExtensions = [".pdf", ".jpg", ".jpeg"];

const chunkSize = 1048576 * 100;

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
        this.ocrMenu = React.createRef();
        this.deleteMenu = React.createRef();

        this.successNot = React.createRef();
        this.errorNot = React.createRef();

        this.interval = null;
        this.rowRefs = [];
    }

    componentDidMount() {
        /**
         * Fetch the files and info from the server
         */
        fetch(process.env.REACT_APP_API_URL + 'files', {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            var info = data["info"];
            var files = {'files': data["files"]};
            this.setState({files: files, info: info, loading: false}, this.displayFileSystem);
        });

        // Update the info every UPDATE_TIME seconds
        this.interval = setInterval(() => {
            fetch(process.env.REACT_APP_API_URL + 'info?path=' + this.state.current_folder.join("/"), {
                method: 'GET'
            })
            .then(response => {return response.json()})
            .then(data => {
                var info = data["info"];

                this.setState({info: info}, this.updateInfo);
            });
        }, 1000 * UPDATE_TIME);
    }

    updateInfo() {
        this.rowRefs.forEach(ref => {
            var rowInfo = this.getInfo(this.state.current_folder.join("/") + "/" + ref.current.state.name);
            ref.current.updateInfo(rowInfo);
        });
    }

    componentWillUnmount() {
        if (this.interval)
            clearInterval(this.interval);
    }

    updateFiles(data) {
        /**
         * Update the files and info
         */

        var files = {'files': data['files']}
        var info = data['info'];

        this.setState({ files: files, info: info }, this.displayFileSystem);
    }

    createFolder() {
        /**
         * Open the folder menu
         */
        this.folderMenu.current.currentPath(this.state.current_folder.join('/'));
        this.folderMenu.current.toggleOpen();
    }

    performOCR(multiple, file=null) {
        var path = this.state.current_folder.join('/');
        if (file !== null) path += '/' + file;
        this.ocrMenu.current.currentPath(path);
        this.ocrMenu.current.setMultiple(multiple);
        this.ocrMenu.current.performOCR("Tesseract", ["por"], path, multiple);

        // Right now, we dont want to show the menu. Assume default settings
        // this.ocrMenu.current.toggleOpen();
    }

    createFile() {
        /**
         * This is a hack to get around the fact that the input type="file" element
         * cannot be accessed from the React code. This is because the element is
         * not rendered by React, but by the browser itself.
         *
         * Function to select the files to be submitted
         */

        var el = window._protected_reference = document.createElement("INPUT");
        el.type = "file";
        el.accept = validExtensions.join(',');
        el.multiple = true;

        el.addEventListener('change', () => {
            if (el.files.length === 0) return;

            for (let i = 0; i < el.files.length; i++) {
                var fileBlob = el.files[i];
                var fileSize = el.files[i].size;
                var fileName = el.files[i].name;
                var fileType = el.files[i].type;

                const _totalCount = fileSize % chunkSize === 0
                ? fileSize / chunkSize
                : Math.floor(fileSize / chunkSize) + 1;

                const _fileID = uuidv4() + "." + fileName.split('.').pop();

                var startChunk = 0;
                var endChunk = chunkSize;

                for (let i = 0; i < _totalCount; i++) {
                    console.log("Uploading chunk " + (i+1) + " of " + _totalCount + " for file " + fileName);
                    var chunk = fileBlob.slice(startChunk, endChunk, fileType);
                    startChunk = endChunk;
                    endChunk = endChunk + chunkSize;

                    var formData = new FormData();
                    formData.append('file', chunk);
                    formData.append('path', this.state.current_folder.join('/'))
                    formData.append('name', fileName);
                    formData.append("fileID", _fileID);
                    formData.append('counter', i+1);
                    formData.append('totalCount', _totalCount);

                    fetch(process.env.REACT_APP_API_URL + 'upload-file', {
                        method: 'POST',
                        body: formData
                    }).then(response => {return response.json()})
                    .then(data => {
                        if (data['success'] && data["finished"]) {
                            var filesystem = data["filesystem"];
                            var info = filesystem["info"];
                            var files = {'files': filesystem["files"]};
                            this.setState({files: files, info: info}, this.displayFileSystem);    
                        }
                    });
                }
            }
        });
        el.click();
    }

    goBack() {
        /**
         * Go back to the previous folder
         */
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

    getDocument(type, file) {
        /**
         * Export the .txt or .pdf file
         */
        var path = this.state.current_folder.join('/') + '/' + file;

        fetch(process.env.REACT_APP_API_URL + "get_" + type + '?path=' + path, {
            method: 'GET'
        })
        .then(response => {return response.blob()})
        .then(data => {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(data);

            var basename = file.split('.').slice(0, -1).join('.');
            a.download = basename + '.' + type;
            a.click();
            a.remove();
        });
    }

    getTxt(file) {
        /**
         * Export the .txt file
         */
        this.getDocument("txt", file);
    }

    getPdf(file) {
        /**
         * Export the .pdf file
         */
        this.getDocument("pdf", file);
    }

    editFile(file) {
        /**
         * Open the file in the editor
         */
        var path = this.state.current_folder.join('/');
        var filename = path + '/' + file;
        this.state.app.editFile(path, filename);
    }

    viewFile(file, algorithm, config) {
        var path = this.state.current_folder.slice(1).join('/');
        file = file.split('/')[0];
        var filename = path + '/' + file;
        this.state.app.viewFile(filename, algorithm, config);
    }

    deleteItem(name) {
        /**
         * Open the delete menu
         */
        this.deleteMenu.current.currentPath(this.state.current_folder.join('/') + '/' + name);
        this.deleteMenu.current.toggleOpen();
    }

    enterFolder(folder) {
        /**
         * Enter the folder and update the path
         */
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
        /**
         * Find the folder in the files
         */
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
        /**
         * Get the contents of the current folder
         */
        var files = this.state.files;
        var current_folder = this.state.current_folder;

        for (let f in current_folder) {
            var key = current_folder[f];
            files = this.findFolder(files, key);
        }

        return files;
    }

    getInfo(path) {
        /**
         * Get the info of the file
         */
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

    sortByName(contents) {
        /**
         * Order 'Nome' column
         * by A-Z or Z-A when
         * the  column is clicked
         */

        const isSorted = (a) => {
            let sorted = true;
            if (a.length > 1) {
                if (a[0].key.localeCompare(a[1].key) === 1){
                    sorted = false;
                }
            }
            return sorted;
        }

        if (isSorted(contents)) {
            this.setState({components: contents.sort((a, b) => (b.key).localeCompare(a.key))}, this.updateInfo);
        } else {
            this.setState({components: contents.sort((a, b) => (a.key).localeCompare(b.key))}, this.updateInfo);
        }
    }

    displayFileSystem() {
        /**
         * Iterate the contents of the folder and build the components
         */
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
        this.setState({components: items}, this.updateInfo);
    }

    generateTable() {
        return (
            <TableContainer component={Paper}>
                <Table aria-label="filesystem table" sx={{border:"1px solid #d9d9d9"}}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{borderLeft:"1px solid #d9d9d9"}}>
                                <Button
                                    startIcon={<SwapVertIcon />}
                                    sx={{backgroundColor: '#ffffff', color: '#000000', ':hover': {bgcolor: '#dddddd'}, textTransform: 'none'}}
                                    onClick={() => this.sortByName(this.state.components)}>
                                    <b>Nome</b>
                                </Button>
                            </TableCell>
                            <TableCell align='center' sx={{borderLeft:"1px solid #d9d9d9"}}><b>Páginas/Bytes</b></TableCell>
                            <TableCell align='center' sx={{borderLeft:"1px solid #d9d9d9"}}><b>Data de Criação</b></TableCell>
                            <TableCell align='center' sx={{borderLeft:"1px solid #d9d9d9"}}><b>OCR</b></TableCell>
                            <TableCell align='center' sx={{borderLeft:"1px solid #d9d9d9"}}><b>Texto</b></TableCell>
                            <TableCell align='center' sx={{borderLeft:"1px solid #d9d9d9"}}><b>PDF</b></TableCell>
                            <TableCell align='center' sx={{borderLeft:"1px solid #d9d9d9"}}><b>PDF Indexado</b></TableCell>
                            <TableCell align='center' sx={{borderLeft:"1px solid #d9d9d9"}}><b>Entidades</b></TableCell>
                            <TableCell align='center' sx={{borderLeft:"1px solid #d9d9d9"}}><b>Ações</b></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.state.components}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }

    indexFile(file, multiple) {
        var path = this.state.current_folder.join('/') + '/' + file;

        fetch(process.env.REACT_APP_API_URL + 'index-doc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "path": path,
                "multiple": multiple
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.successNot.current.setMessage(data.message)
                this.successNot.current.open();
            } else {
                this.errorNot.current.open();
            }

            this.updateFiles(data.files);
        })
    }

    removeIndexFile(file, multiple) {
        var path = this.state.current_folder.join('/') + '/' + file;

        fetch(process.env.REACT_APP_API_URL + 'remove-index-doc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "path": path,
                "multiple": multiple
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.successNot.current.setMessage(data.message)
                this.successNot.current.open();
            } else {
                this.errorNot.current.open();
            }

            this.updateFiles(data.files);
        })
    }

    checkOCRComplete() {
        let obj = this.state.info;

        for (let key in obj) {
            if (obj[key] && typeof obj[key] === 'object') {
              if (obj[key].ocr && !obj[key].ocr.complete) {
                return false;
              }
            }
        }
        return true;
    }

    render() {
        return (
            <Box sx={{
                ml: '1.5rem',
                mr: '1.5rem',
                mb: '1.5rem',
            }}>
                <Notification message={""} severity={"success"} ref={this.successNot}/>
                <Notification message={""} severity={"error"} ref={this.errorNot}/>

                <FolderMenu filesystem={this} ref={this.folderMenu}/>
                <OcrMenu filesystem={this} ref={this.ocrMenu}/>
                <DeleteMenu filesystem={this} ref={this.deleteMenu} />

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap'
                }}>
                    <Button
                        disabled={this.state.buttonsDisabled}
                        variant="contained"
                        startIcon={<UndoIcon />}
                        sx={{backgroundColor: '#ffffff', color: '#000000', border: '1px solid black', mr: '1rem', mb: '0.5rem', ':hover': {bgcolor: '#ddd'}}}
                        onClick={() => this.goBack()}
                    >
                        Voltar atrás
                    </Button>

                    <Button
                        color="success"
                        variant="contained"
                        startIcon={<CreateNewFolderIcon />}
                        sx={{border: '1px solid black', mr: '1rem', mb: '0.5rem'}}
                        onClick={() => this.createFolder()}
                    >
                        Criar pasta
                    </Button>

                    <Button
                        disabled={this.state.buttonsDisabled}
                        variant="contained"
                        startIcon={<NoteAddIcon />}
                        onClick={() => this.createFile()}
                        sx={{border: '1px solid black', mb: '0.5rem'}}
                    >
                        Adicionar documento
                    </Button>

                    <Button
                        disabled={this.state.buttonsDisabled || this.state.components.length === 0 || !this.checkOCRComplete()}
                        variant="contained"
                        startIcon={<SearchIcon />}
                        onClick={() => this.performOCR(true)}
                        sx={{border: '1px solid black', mb: '0.5rem', alignSelf: 'flex-end', ml: 'auto', backgroundColor: '#e5de00', color: '#000', ':hover': {bgcolor: '#e6cc00'}}}
                    >
                        Realizar o OCR
                    </Button>
                </Box>

                {
                    this.generateTable()
                }
            </Box>
        );
    }
}

export { FileExplorer };
