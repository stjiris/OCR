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
const FileRow = loadComponent('FileSystem', 'FileRow');
const FolderRow = loadComponent('FileSystem', 'FolderRow');
const Notification = loadComponent('Notification', 'Notifications');
const FolderMenu = loadComponent('Form', 'FolderMenu');
const OcrMenu = loadComponent('Form', 'OcrMenu');
const DeleteMenu = loadComponent('Form', 'DeleteMenu');
const LayoutMenu = loadComponent('LayoutMenu', 'LayoutMenu');
const EditingMenu = loadComponent('EditingMenu', 'EditingMenu');
const FullStorageMenu = loadComponent('Form', 'FullStorageMenu');

const UPDATE_TIME = 15;
const STUCK_UPDATE_TIME = 10 * 60; // 10 Minutes

const validExtensions = ["application/pdf",
                                "image/jpeg",
                                "image/png",
                                "image/tiff",
                                "image/bmp",
                                "image/gif",
                                "image/webp",
                                "image/x-portable-anymap",
                                "image/jp2",
                                "application/zip"];

const chunkSize = 1024 * 1024 * 3; // 3 MB

class FileExplorer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            files: null,
            info: null,
            current_folder: props.current_folder.join('/'),
            components: [],

            updatingRows: [],
            updatingRate: 15,
            updateCount: 0,

            loading: false,

            layoutMenu: false,
            editingMenu: false,
            fileOpened: null,
        }

        this.folderMenu = React.createRef();
        this.ocrMenu = React.createRef();
        this.deleteMenu = React.createRef();
        this.storageMenu = React.createRef();

        this.successNot = React.createRef();
        this.errorNot = React.createRef();

        this.interval = null;
        this.rowRefs = [];

        // functions for file/folder rows
        this.enterFolder = this.enterFolder.bind(this);
        this.deleteItem = this.deleteItem.bind(this);
        this.getOriginalFile = this.getOriginalFile.bind(this);
        this.getDelimiterTxt = this.getDelimiterTxt.bind(this);
        this.getTxt = this.getTxt.bind(this);
        this.getEntities = this.getEntities.bind(this);
        this.requestEntities = this.requestEntities.bind(this);
        this.getCSV = this.getCSV.bind(this);
        this.getImages = this.getImages.bind(this);
        this.getPdf = this.getPdf.bind(this);
        this.getPdfSimples = this.getPdfSimples.bind(this);
        this.editText = this.editText.bind(this);
        this.performOCR = this.performOCR.bind(this);
        this.indexFile = this.indexFile.bind(this);
        this.removeIndexFile = this.removeIndexFile.bind(this);
        this.createLayout = this.createLayout.bind(this);

        // functions for OCR menu
        this.showStorageForm = this.showStorageForm.bind(this);

        // functions for layout menu
        this.closeLayoutMenu = this.closeLayoutMenu.bind(this);

        // functions for editing menu
        this.closeEditingMenu = this.closeEditingMenu.bind(this);

        // functions for menus
        this.updateFiles = this.updateFiles.bind(this);
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
            const info = data["info"];
            const files = {'files': data["files"]};
            this.setState({files: files, info: info, loading: false});
        });

        // Update the info every UPDATE_TIME seconds
        this.createUpdateInfo();

        // Check for stuck uploads every STUCK_UPDATE_TIME seconds
        this.interval = setInterval(() => {
            fetch(process.env.REACT_APP_API_URL + 'info?path=' + this.state.current_folder.replace(/^\//, ''), {
                method: 'GET'
            })
            .then(response => {return response.json()})
            .then(data => {
                const info = data["info"];
                // Find if a upload is stuck
                for (const [path, value] of Object.entries(info)) {
                    if (value.type === "file") {
                        if ("stored" in value && value["stored"] !== true) {
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
                                        "path": path.replace(/^\//, ''),
                                    }),
                                })
                                .then(response => response.json());
                            }
                        }
                    }
                }
                this.setState({info: info, updateCount: 0});
            });
        }, 1000 * STUCK_UPDATE_TIME);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.current_folder !== prevState.current_folder || this.state.files !== prevState.files || this.state.fileOpened !== prevState.fileOpened) {
            this.displayFileSystem();
        } else if (this.state.info !== prevState.info || this.state.components !== prevState.components) {
            this.updateInfo();
        }
    }

    createUpdateInfo() {
        this.interval = setInterval(() => {
            fetch(process.env.REACT_APP_API_URL + 'info?path=' + this.state.current_folder.replace(/^\//, ''), {
                method: 'GET'
            })
            .then(response => {return response.json()})
            .then(data => {
                const info = data["info"];
                this.setState({info: info, updateCount: 0});
            });
        }, 1000 * UPDATE_TIME);
    }

    updateInfo() {
        if (this.state.layoutMenu || this.state.editingMenu) return;
        this.rowRefs.forEach(ref => {
            const filename = (this.state.current_folder + '/' + ref.current.props.name);
            if (this.state.updatingRows.length === 0 || this.state.updatingRows.includes(filename)) {
                const rowInfo = this.getInfo(filename);
                ref.current.updateInfo(rowInfo);
            }
        });
        this.setState({updatingRows: []});
    }

    componentWillUnmount() {
        if (this.interval)
            clearInterval(this.interval);
    }

    /**
     * Update the files and info
     */
    updateFiles(data) {
        const files = {'files': data['files']}
        const info = data['info'];
        this.setState({ files: files, info: info });
    }

    /**
     * Open the folder menu
     */
    createFolder() {
        this.folderMenu.current.setPath(this.state.current_folder.replace(/^\//, ''));
        this.folderMenu.current.toggleOpen();
    }

    showStorageForm(errorMessage) {
        this.storageMenu.current.setMessage(errorMessage);
        this.storageMenu.current.toggleOpen();
    }

    performOCR(multiple, file=null) {
        let path = this.state.current_folder;
        if (file !== null) {
            path = (path + '/' + file).replace(/^\//, '');
        }
        this.ocrMenu.current.setPath(path);
        this.ocrMenu.current.setMultiple(multiple);
        this.ocrMenu.current.performOCR("Tesseract", ["por"], path, multiple);

        // Right now, we dont want to show the menu. Assume default settings
        // this.ocrMenu.current.toggleOpen();
    }

    sendChunk(i, chunk, fileName, _totalCount, _fileID) {
        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('path', this.state.current_folder.replace(/^\//, ''));
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
                const info = data["info"];

                const updatingList = this.state.updatingRows;
                const complete_filename = (this.state.current_folder + '/' + fileName).replace(/^\//, '');
                if (!updatingList.includes(complete_filename)) {
                    updatingList.push(complete_filename);
                }

                if (data["finished"] || this.state.updateCount === this.state.updatingRate) {
                    this.setState({info: info, updateCount: 0, updatingRows: updatingList});
                } else {
                    this.setState({updateCount: this.state.updateCount + 1});
                }
            } else {
                this.storageMenu.current.setMessage(data.error);
                this.storageMenu.current.toggleOpen();
            }
        })
        .catch(error => {
            // TODO: give feedback to user on communication error
            this.sendChunk(i, chunk, fileName, _totalCount, _fileID);
        });
    }

    /**
     * This is a hack to get around the fact that the input type="file" element
     * cannot be accessed from the React code. This is because the element is
     * not rendered by React, but by the browser itself.
     *
     * Function to select the files to be submitted
     */
    createFile() {
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
                        path: this.state.current_folder.replace(/^\//, ''),
                        name: fileName,
                    })
                }).then(response => {return response.json()})
                .then(data => {
                    if (data['success']) {
                        var filesystem = data["filesystem"];
                        var info = filesystem["info"];
                        var files = {'files': filesystem["files"]};
                        this.setState({files: files, info: info});
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
                    } else {
                        this.storageMenu.current.setMessage(data.error);
                        this.storageMenu.current.toggleOpen();
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
            if (window.location.href.endsWith('/')) {
                window.location.href = window.location.href + `${sessionId}`;
            } else {
                window.location.href = window.location.href + `/${sessionId}`;
            }
        });
    }

    goBack(current_folder_path) {
        /**
         * Go back to the given folder path
         */
        this.setState({layoutMenu: false, editingMenu: false,
            current_folder: current_folder_path.join('/')
        });
    }

    getDocument(type, file, suffix="") {
        /**
         * Export the .txt or .pdf file
         */
        const path = (this.state.current_folder + '/' + file).replace(/^\//, '');
        fetch(process.env.REACT_APP_API_URL + "get_" + type + '?path=' + path, {
            method: 'GET'
        })
        .then(response => {return response.blob()})
        .then(data => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(data);

            const basename = file.split('.').slice(0, -1).join('.');
            a.download = basename + '_ocr' + suffix + '.' + type.split('_')[0];
            a.click();
            a.remove();
        });
    }

    getEntities(file) {
        const path = (this.state.current_folder + '/' + file).replace(/^\//, '');
        fetch(process.env.REACT_APP_API_URL + "get_entities?path=" + path, {
            method: 'GET'
        })
        .then(response => {return response.blob()})
        .then(data => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(data);

            const basename = file.split('.').slice(0, -1).join('.');
            a.download = basename + '_entidades.json';
            a.click();
            a.remove();
        });
    }

    requestEntities(file) {
        const path = (this.state.current_folder + '/' + file).replace(/^\//, '');
        fetch(process.env.REACT_APP_API_URL + "request_entities?path=" + path, {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            if (data.success) {
                const filesystem = data["filesystem"];
                const info = filesystem["info"];
                const files = {'files': filesystem["files"]};

                this.setState({files: files, info: info});
            }
        });
    }

    getZip() {
        /**
         * Export the .zip file
         */
        const path = this.state.current_folder.replace(/^\//, '');

        fetch(process.env.REACT_APP_API_URL + "get_zip?path=" + path, {
            method: 'GET'
        })
        .then(response => {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            }

            this.successNot.current.setMessage("O seu download vai começar em breves momentos.")
            this.successNot.current.open();
            return response.blob()
        })
        .then(data => {
            // Check if data is a blob
            if (data instanceof Blob) {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(data);

                a.download = path.split('/').slice(-1)[0] + '.zip';
                a.click();
                a.remove();
            } else {
                this.errorNot.current.setMessage(data.message)
                this.errorNot.current.open();
            }
        });
    }


    getOriginalFile(file) {
        const path = (this.state.current_folder + '/' + file).replace(/^\//, '');
        fetch(process.env.REACT_APP_API_URL + "get_original?path=" + path, {
            method: 'GET'
        })
        .then(response => {return response.blob()})
        .then(data => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(data);

            a.download = file;
            a.click();
            a.remove();
        });
    }

    /**
     * Export the .txt file
     */
    getTxt(file) {
        this.getDocument("txt", file);
    }

    /**
     * Export the .txt file
     * with the delimiter
     */
    getDelimiterTxt(file) {
        this.getDocument("txt_delimitado", file, "_delimitado");
    }

    /**
     * Export the .csv file
     */
    getCSV(file) {
         this.getDocument("csv", file);
    }

    /**
     * Export the .zip file
     */
    getImages(file) {
        const path = (this.state.current_folder + '/' + file).replace(/^\//, '');
        fetch(process.env.REACT_APP_API_URL + "get_images?path=" + path, {
            method: 'GET'
        })
        .then(response => {return response.blob()})
        .then(data => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(data);

            a.download = path.split('/').slice(-1)[0] + '.zip';
            a.click();
            a.remove();
        });
    }

    /**
     * Export the .pdf file
     */
    getPdf(file) {
        this.getDocument("pdf", file, "_texto_indice");
    }

    /**
     * Export the .pdf file
     */
    getPdfSimples(file) {
        this.getDocument("pdf_simples", file, "_texto");
    }

    /*
    editFile(file) {
        const filename = this.state.current_folder + '/' + file;
        this.state.app.editFile(this.state.current_folder, filename);
    }
     */

    /*
    viewFile(file, algorithm, config) {
        var path = this.state.current_folder.slice(1).join('/');
        file = file.split('/')[0];
        var filename = path + '/' + file;
        this.state.app.viewFile(filename, algorithm, config);
    }
    */

    /**
     * Open the delete menu
     */
    deleteItem(name) {
        this.deleteMenu.current.setPath((this.state.current_folder + '/' + name).replace(/^\//, ''));
        this.deleteMenu.current.toggleOpen();
    }

    /**
     * Enter the folder and update the path
     */
    enterFolder(folder) {
        const current_folder_list = this.state.current_folder.split('/');
        current_folder_list.push(folder);
        this.props.setCurrentPath(current_folder_list);
    }

    /**
     * Find the folder in the files
     */
    findFolder(files, folder) {
        if (Array.isArray(files)) {
            for (let i = 0; i < files.length; i++) {
                const dict = files[i];
                const key = Object.keys(dict)[0];
                if (key === folder) {
                    return dict[folder];
                }
            }
        } else {
            // whole object was passed, return top-level array of folders
            return files["files"];
        }
    }

    /**
     * Get the contents of the current folder
     */
    getPathContents() {
        let files = this.state.files;
        let current_folder_list = this.state.current_folder.split('/');

        // if path is at top level, findFolder() is called once, returns whole list of folders and files
        for (let f in current_folder_list) {
            let key = current_folder_list[f];
            files = this.findFolder(files, key);
        }

        return files;
    }

    /**
     * Get the info of the file
     */
    getInfo(path) {
        return this.state.info[path];
    }

    /**
     * Sorts the contents of the current folder
     * First order by type (folder, file)
     * Then order by name
     */
    sortContents(contents) {
        let folders = [];
        let files = [];

        for (let f in contents) {
            const item = contents[f];
            if (typeof item === 'string' || item instanceof String) {
                files.push(item);
            } else {
                folders.push(item);
            }
        }

        folders.sort(function(d1, d2) {
            const key1 = Object.keys(d1)[0];
            const key2 = Object.keys(d2)[0];
            return key1.localeCompare(key2);
        });
        files.sort();

        return folders.concat(files);
    }

    sortByName(contents) {  // TODO: sort folders separately from files, like in operating system file explorers
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
            this.setState({components: contents.sort((a, b) => (b.key).localeCompare(a.key))});
        } else {
            this.setState({components: contents.sort((a, b) => (a.key).localeCompare(b.key))});
        }
    }

    displayFileSystem() {
        /**
         * Iterate the contents of the folder and build the components
         */
        const contents = this.sortContents(this.getPathContents());
        this.rowRefs = [];

        let items = [];

        for (let f in contents) {
            let ref = React.createRef();
            this.rowRefs.push(ref);

            const item = contents[f];
            if (typeof item === 'string' || item instanceof String) {
                items.push(
                    <FileRow
                        ref={ref}
                        key={item}
                        name={item}
                        _private={this.props._private}
                        info={this.getInfo(this.state.current_folder + '/' + item)}
                        deleteItem={this.deleteItem}
                        getOriginalFile={this.getOriginalFile}
                        getDelimiterTxt={this.getDelimiterTxt}
                        getTxt={this.getTxt}
                        getEntities={this.getEntities}
                        requestEntities={this.requestEntities}
                        getCSV={this.getCSV}
                        getImages={this.getImages}
                        getPdf={this.getPdf}
                        getPdfSimples={this.getPdfSimples}
                        editText={this.editText}
                        performOCR={this.performOCR}
                        indexFile={this.indexFile}
                        removeIndexFile={this.removeIndexFile}
                        createLayout={this.createLayout}
                    />
                )
            } else {
                const key = Object.keys(item)[0];
                items.push(
                    <FolderRow
                        ref={ref}
                        key={key}
                        name={key}
                        info={this.getInfo(this.state.current_folder + '/' + key)}
                        current_folder={this.state.current_folder}
                        enterFolder={this.enterFolder}
                        deleteItem={this.deleteItem}
                    />
                )
            }
        }
        this.setState({components: items});
    }

    createLayout(filename) {
        this.props.enterLayoutMenu(filename);
    }

    closeLayoutMenu() {
        this.props.exitMenus();
    }

    editText(filename) {
        this.props.enterEditingMenu(filename);
    }

    closeEditingMenu() {
        this.props.exitMenus();
    }

    generateTable() {
        return (
            <TableContainer component={Paper}>
                <Table aria-label="filesystem table" sx={{border:"1px solid #aaa"}}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{borderLeft:"1px solid #aaa"}}>
                                <Button
                                    startIcon={<SwapVertIcon />}
                                    sx={{backgroundColor: '#ffffff', color: '#000000', ':hover': {bgcolor: '#dddddd'}, textTransform: 'none'}}
                                    onClick={() => this.sortByName(this.state.components)}>
                                    <b>Nome</b>
                                </Button>
                            </TableCell>
                            <TableCell align='center' sx={{borderLeft:"1px solid #aaa"}}><b>Data de criação</b></TableCell>
                            <TableCell align='center' sx={{borderLeft:"1px solid #aaa"}}><b>Descrição</b></TableCell>
                            <TableCell align='center' sx={{borderLeft:"1px solid #aaa"}}><b>Tamanho</b></TableCell>
                            <TableCell align='center' sx={{borderLeft:"1px solid #aaa"}}><b>Ações</b></TableCell>
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
        const path = (this.state.current_folder + '/' + file).replace(/^\//, '');

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
        const path = (this.state.current_folder + '/' + file).replace(/^\//, '');

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

    /*
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

    changeFolderFromPath(folder_name) {
        var current_folder = this.state.current_folder;

        // Remove the last element of the path until we find folder_name
        while (current_folder[current_folder.length - 1] !== folder_name) {
            current_folder.pop();
        }

        var buttonsDisabled = current_folder.length === 1;
        var createFileButtonDisabled = current_folder.length === 1;

        this.setState({
            current_folder: current_folder,
            buttonsDisabled: buttonsDisabled,
            createFileButtonDisabled: createFileButtonDisabled,
        }, this.displayFileSystem);
    }

    generatePath() {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap'
            }}>
                {
                    this.state.current_folder.map((folder, index) => {
                        var name;
                        if (folder !== 'files') {
                            name = folder;
                        }
                        else {
                            name = 'Início';
                        }
                        return (
                            <Box sx={{display: "flex", flexDirection: "row"}} key={"Box" + folder}>
                                <Button
                                    key={folder}
                                    onClick={() => this.changeFolderFromPath(folder)}
                                    style={{
                                        margin: 0,
                                        padding: '0px 15px 0px 15px',
                                        textTransform: 'none',
                                        display: "flex",
                                        textAlign: "left",
                                        textDecoration: "underline",
                                    }}
                                    variant="text"
                                >
                                    {name}
                                </Button>
                                <p key={index}>/</p>
                            </Box>
                        )
                    })
                }
            </Box>
        )
    }
     */

    render() {
        return (
            <>
                {
                    this.state.layoutMenu
                    ? <LayoutMenu _private={this.props._private}
                                  sessionId={this.props._private ? this.props.sessionId : null}
                                  current_folder={this.state.current_folder}
                                  filename={this.state.fileOpened}
                                  closeLayoutMenu={this.closeLayoutMenu}/>
                    : this.state.editingMenu
                        ? <EditingMenu _private={this.props._private}
                                       sessionId={this.props._private ? this.props.sessionId : null}
                                       current_folder={this.state.current_folder}
                                       filename={this.state.fileOpened}
                                       closeEditingMenu={this.closeEditingMenu}/>
                        : <Box sx={{
                            ml: '1.5rem',
                            mr: '1.5rem',
                            mb: '1.5rem',
                        }}>
                            <Notification message={""} severity={"success"} ref={this.successNot}/>
                            <Notification message={""} severity={"error"} ref={this.errorNot}/>

                            <FolderMenu ref={this.folderMenu} _private={this.props._private} updateFiles={this.updateFiles}/>
                            <OcrMenu ref={this.ocrMenu} _private={this.props._private} updateFiles={this.updateFiles} showStorageForm={this.showStorageForm}/>
                            <DeleteMenu ref={this.deleteMenu} _private={this.props._private} updateFiles={this.updateFiles}/>
                            <FullStorageMenu ref={this.storageMenu}/>

                            {
                                this.generateTable()
                            }
                        </Box>
                }
            </>
        );
    }
}

FileExplorer.defaultProps = {
    _private: false,
    sessionId: "",
    current_folder: null,
    // functions:
    setCurrentPath: null,
    enterLayoutMenu: null,
    enterEditingMenu: null,
    exitMenus: null
}

export default FileExplorer;
