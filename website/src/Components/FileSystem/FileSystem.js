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
import DownloadMenu from '../Form/DownloadMenu';

import FolderRow from './FolderRow';
import FileRow from './FileRow';

import Notification from '../Notification/Notifications';

import NoteAddIcon from '@mui/icons-material/NoteAdd';
import UndoIcon from '@mui/icons-material/Undo';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import SearchIcon from '@mui/icons-material/Search';

const UPDATE_TIME = 15;
const validExtensions = [".pdf", ".jpg", ".jpeg"];

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
        this.downloadMenu = React.createRef();

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

            var path = this.state.current_folder.join("/") + "/" + ref.current.state.name;
            var versions = [];

            var infoKeys = Object.keys(this.state.info);

            for (let i = 0; i < infoKeys.length; i++) {
                var infoKey = infoKeys[i];
                if (infoKey.includes(path) && infoKey !== path)
                    versions.push(infoKey.split("/").pop())
            }
            ref.current.updateVersions(versions);
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
        this.ocrMenu.current.toggleOpen();
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

            // Iterate the files and show the names
            for (let i = 0; i < el.files.length; i++) {
                var formData = new FormData();
                formData.append('file', el.files[i]);
                formData.append('path', this.state.current_folder.join('/'));

                fetch(process.env.REACT_APP_API_URL + 'upload-file', {
                    method: 'POST',
                    body: formData
                })
                .then(response => {return response.json()})
                .then(data => {
                    var filesystem = data["filesystem"];
                    var info = filesystem["info"];
                    var files = {'files': filesystem["files"]};
                    this.setState({files: files, info: info}, this.displayFileSystem);
                });
            }
        });
        el.click();
    }

    downloadFile(name) {
        /**
         * Download the file
         */
        this.downloadMenu.current.currentPath(this.state.current_folder.join('/') + '/' + name);
        this.downloadMenu.current.toggleOpen();
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

    getTxt(file) {
        /**
         * Export the .txt file
         */
        this.getDocument("get_txt", file);
    }

    getPdf(file) {
        /**
         * Export the .pdf file
         */
        this.getDocument("get_pdf", file);
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
        var info = {};
        var keys = Object.keys(this.state.info);
        for (let i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key.startsWith(path)) {
                info[key] = this.state.info[key];
            }
        }
        return info;
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
                var path = this.state.current_folder.join("/") + "/" + item;
                var versions = [];
                var infoKeys = Object.keys(this.state.info);

                for (let i = 0; i < infoKeys.length; i++) {
                    var infoKey = infoKeys[i];
                    if (infoKey.includes(path) && infoKey !== path)
                        versions.push(infoKey.split("/").pop())
                }

                items.push(
                    <FileRow
                        ref={ref}
                        key={item}
                        name={item}
                        info={this.getInfo(this.state.current_folder.join("/") + "/" + item)}
                        filesystem={this}
                        versions={versions}
                    />
                )
            } else {
                var key = Object.keys(item)[0];
                items.push(
                    <FolderRow
                        ref={ref}
                        key={key}
                        name={key}
                        info={this.state.info[this.state.current_folder.join("/") + "/" + key]}
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
                <Table aria-label="filesystem table">
                    <TableHead>
                        <TableRow>
                            <TableCell><b>Nome</b></TableCell>
                            <TableCell align='center'><b>Data de Criação</b></TableCell>
                            <TableCell align='center'><b>Data de Modificação</b></TableCell>
                            <TableCell align='center'><b>Número de Documentos/Páginas</b></TableCell>
                            <TableCell align='center'><b>Tamanho</b></TableCell>
                            <TableCell align='center'><b>Estado</b></TableCell>
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
                <DownloadMenu filesystem={this} ref={this.downloadMenu} />

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
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
                        disabled={this.state.buttonsDisabled || this.state.components.length === 0}
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