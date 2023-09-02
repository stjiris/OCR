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
import SwapVertIcon from '@mui/icons-material/SwapVert';

import { v4 as uuidv4 } from 'uuid';
import loadComponent from '../../../utils/loadComponents';

const UPDATE_TIME = 15;
const STUCK_UPDATE_TIME = 10 * 60; // 10 Minutes 

const validExtensions = [".pdf", ".jpg", ".jpeg"];

const chunkSize = 1024 * 1024 * 3; // 3 MB

class PrivateFileExplorer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            app: props.app,
            files: props.files,

            info: {},
            current_folder: props.current_folder.split('/'),
            addDisabled: true,
            ocrDisabled: true,

            components: [],

            updatingRows: [],
            updatingRate: 15,
            updateCount: 0,

            loading: false,
        }

        this.folderMenu = React.createRef();
        this.ocrMenu = React.createRef();
        this.deleteMenu = React.createRef();
        this.privateSessionMenu = React.createRef();

        this.successNot = React.createRef();
        this.errorNot = React.createRef();

        this.interval = null;
        this.rowRefs = [];
    }

    componentDidMount() {
        /**
         * Fetch the files and info from the server
         */
        fetch(process.env.REACT_APP_API_URL + 'files?path=' + this.state.current_folder.join("/"), {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            var info = data["info"];

            var keys = Object.keys(data);
            keys.splice(keys.indexOf("info"), 1);
            var session = keys[0];
            var files = {};

            files[session] = data[session];

            var disabled = data[session].length !== 0;

            this.setState({files: files, info: info, loading: false, addDisabled: disabled}, this.displayFileSystem);
        });

        // Update the info every UPDATE_TIME seconds
        this.interval = setInterval(() => {
            fetch(process.env.REACT_APP_API_URL + 'info?path=' + this.state.current_folder.join("/"), {
                method: 'GET'
            })
            .then(response => {return response.json()})
            .then(data => {
                var info = data["info"];

                this.setState({info: info, updateCount: 0}, this.updateInfo);
            });
        }, 1000 * UPDATE_TIME);

        // Check for stuck uploads every STUCK_UPDATE_TIME seconds
        this.interval = setInterval(() => {
            fetch(process.env.REACT_APP_API_URL + 'info?path=' + this.state.current_folder.join("/"), {
                method: 'GET'
            })
            .then(response => {return response.json()})
            .then(data => {
                var info = data["info"];
                // Find if a upload is stuck
                for (const [path, value] of Object.entries(info)) {
                    if (value.type === "file") {
                        if ("progress" in value && value["progress"] !== true) {
                            const creationTime = new Date(value.creation.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:$6'));
                            const currentTime = new Date();
                            const timeDiffMinutes = (currentTime - creationTime) / (1000 * 60);
                        
                            if (timeDiffMinutes >= 10) {
                                fetch(process.env.REACT_APP_API_URL + 'set-upload-stuck', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        "path": path,
                                    }),
                                })
                                .then(response => response.json());                                
                            }
                        }
                    }
                }

                this.setState({info: info, updateCount: 0}, this.updateInfo);
            });
        }, 1000 * STUCK_UPDATE_TIME);
    }

    updateInfo() {
        this.rowRefs.forEach(ref => {
            var filename = this.state.current_folder.join("/") + "/" + ref.current.state.name;
            if (this.state.updatingRows.length === 0 || this.state.updatingRows.includes(filename)) {
                var rowInfo = this.getInfo(filename);
                ref.current.updateInfo(rowInfo);
            }
        });
        this.setState({updateCount: 0, updatingRows: []});
    }

    componentWillUnmount() {
        if (this.interval)
            clearInterval(this.interval);
    }

    updateFiles(data) {
        /**
         * Update the files and info
         */

        var files = {}
        files[this.state.current_folder.join("/")] = data[this.state.current_folder.join("/")]
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

    sendChunk(i, chunk, fileName, _totalCount, _fileID) {
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
            if (data['success']) {
                var info = this.state.info;

                for (var k in data["info"]) {
                    info[k] = data["info"][k];
                }

                var updatingList = this.state.updatingRows;
                var complete_filename = this.state.current_folder.join("/") + "/" + fileName;
                if (!updatingList.includes(complete_filename)) {
                    updatingList.push(complete_filename);
                }

                if (data["finished"] || this.state.updateCount === this.state.updatingRate) {
                    this.setState({info: info, updateCount: 0, updatingRows: updatingList}, this.updateInfo);
                } else {
                    this.setState({updateCount: this.state.updateCount + 1});
                }
            }
        })
        .catch(error => {
            this.sendChunk(i, chunk, fileName, _totalCount, _fileID);
        });
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

            // Sort files by size (ascending)
            var files = Array.from(el.files).sort((a, b) => a.size - b.size);

            for (let i = 0; i < files.length; i++) {
                let fileBlob = files[i];
                let fileSize = files[i].size;
                let fileName = files[i].name;
                let fileType = files[i].type;

                const _totalCount = fileSize % chunkSize === 0
                ? fileSize / chunkSize
                : Math.floor(fileSize / chunkSize) + 1;

                const _fileID = uuidv4() + "." + fileName.split('.').pop();

                fetch(process.env.REACT_APP_API_URL + 'prepare-upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        path: this.state.current_folder.join('/'),
                        name: fileName,
                    })
                }).then(response => {return response.json()})
                .then(data => {
                    if (data['success']) {
                        var filesystem = data["filesystem"];
                        var info = filesystem["info"];
                        var files = {}
                        files[this.state.current_folder.join("/")] = filesystem[this.state.current_folder.join("/")];

                        this.setState({files: files, info: info, addDisabled: true, ocrDisabled: false}, this.displayFileSystem);
                        fileName = data["filename"];

                        // Send chunks
                        var startChunk = 0;
                        var endChunk = chunkSize;
        
                        for (let i = 0; i < _totalCount; i++) {
                            var chunk = fileBlob.slice(startChunk, endChunk, fileType);
                            startChunk = endChunk;
                            endChunk = endChunk + chunkSize;
        
                            this.sendChunk(i, chunk, fileName, _totalCount, _fileID);
                        }
                    }
                });

            }
        });
        el.click();
    }

    createPrivateSession() {
        fetch(process.env.REACT_APP_API_URL + 'create-private-session', {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            var sessionId = data["sessionId"];
            window.location.href = window.location.href + `${sessionId}`;
        });
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
            a.download = basename + '_ocr.' + type;
            a.click();
            a.remove();
        });
    }

    getOriginalFile(file) {
        var path = this.state.current_folder.join('/') + '/' + file;

        fetch(process.env.REACT_APP_API_URL + "get_original?path=" + path, {
            method: 'GET'
        })
        .then(response => {return response.blob()})
        .then(data => {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(data);

            a.download = file;
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

    getCSV(file) {
        /**
         * Export the .csv file
         */
         this.getDocument("csv", file);
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
        const PrivateFileRow = loadComponent('PrivateSession', 'PrivateFileRow');
        const FolderRow = loadComponent('FileSystem', 'FolderRow');

        var contents = this.sortContents(this.getPathContents());
        this.rowRefs = [];

        var items = [];

        for (let f in contents) {
            var ref = React.createRef();
            this.rowRefs.push(ref);

            var item = contents[f];
            if (typeof item === 'string' || item instanceof String) {
                items.push(
                    <PrivateFileRow
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
                                    <b>Ficheiro</b>
                                </Button>
                            </TableCell>
                            <TableCell align='center' sx={{borderLeft:"1px solid #d9d9d9"}}><b>Detalhes</b></TableCell>
                            {/* <TableCell align='center' sx={{borderLeft:"1px solid #d9d9d9"}}><b>Data de Criação</b></TableCell> */}
                            <TableCell align='center' sx={{borderLeft:"1px solid #d9d9d9"}}><b>Progresso</b></TableCell>
                            {/* <TableCell align='center' sx={{borderLeft:"1px solid #d9d9d9"}}><b>Ações</b></TableCell> */}
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
                if (obj[key].ocr){
                    if ((obj[key].ocr.progress) !== obj[key].pages) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    render() {
        const Notification = loadComponent('Notification', 'Notifications');
        const FolderMenu = loadComponent('Form', 'FolderMenu');
        const OcrMenu = loadComponent('Form', 'OcrMenu');
        const DeleteMenu = loadComponent('Form', 'DeleteMenu');
        const PrivateSessionMenu = loadComponent('Form', 'PrivateSessionMenu');

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
                <PrivateSessionMenu filesystem={this} ref={this.privateSessionMenu} />

                {
                    this.generateTable()
                }
            </Box>
        );
    }
}

export default PrivateFileExplorer;
