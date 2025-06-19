import React from 'react';
import axios from 'axios';

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
const ArrowDownAZIcon = loadComponent('Icons', 'ArrowDownAZIcon');
const ArrowUpZAIcon = loadComponent('Icons', 'ArrowUpZAIcon');
const DocumentRow = loadComponent('FileSystem', 'DocumentRow');
const StaticFileRow = loadComponent('FileSystem', 'StaticFileRow');
const FileIcon = loadComponent('CustomIcons', 'FileIcon');
const TxtIcon = loadComponent('CustomIcons', 'TxtIcon');
const PdfIcon = loadComponent('CustomIcons', 'PdfIcon');
const CsvIcon = loadComponent('CustomIcons', 'CsvIcon');
const AltoIcon = loadComponent('CustomIcons', 'AltoIcon');
const JsonIcon = loadComponent('CustomIcons', 'JsonIcon');
const ZipIcon = loadComponent('CustomIcons', 'ZipIcon');
const PrivateSessionMenu = loadComponent('Form', 'PrivateSessionMenu');
const FolderRow = loadComponent('FileSystem', 'FolderRow');
const Notification = loadComponent('Notification', 'Notifications');
const FolderMenu = loadComponent('Form', 'FolderMenu');
const DeletePopup = loadComponent('Form', 'DeletePopup');
const OcrPopup = loadComponent('Form', 'OcrPopup');
const OcrMenu = loadComponent('OcrMenu', 'OcrMenu');
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
            // replace(/^\//, '') removes '/' from the start of the path. the server expects non-absolute paths
            current_folder: props.current_folder.join('/').replace(/^\//, ''),
            components: [],
            sorting: 0,

            updatingRows: [],
            updatingRate: 15,
            updateCount: 0,

            loading: false,

            ocrMenu: false,
            layoutMenu: false,
            editingMenu: false,
            fileOpened: null,
            isFolder: false,
            isSinglePage: false,
            customConfig: null,
        }

        this.folderMenu = React.createRef();
        this.ocrPopup = React.createRef();
        this.deletePopup = React.createRef();
        if (props._private) {
            this.privateSessionMenu = React.createRef();
        }
        this.storageMenu = React.createRef();

        this.successNot = React.createRef();
        this.errorNot = React.createRef();

        this.interval = null;
        this.rowRefs = [];

        this.fetchInfo = this.fetchInfo.bind(this);

        // functions for private session opening menu
        this.createFile = this.createFile.bind(this);

        // functions for file/folder rows
        this.enterFolder = this.enterFolder.bind(this);
        this.deleteItem = this.deleteItem.bind(this);
        this.getOriginalFile = this.getOriginalFile.bind(this);
        this.getDelimiterTxt = this.getDelimiterTxt.bind(this);
        this.getTxt = this.getTxt.bind(this);
        this.getEntities = this.getEntities.bind(this);
        this.requestEntities = this.requestEntities.bind(this);
        this.getAlto = this.getAlto.bind(this);
        this.getCSV = this.getCSV.bind(this);
        this.getImages = this.getImages.bind(this);
        this.getPdfIndexed = this.getPdfIndexed.bind(this);
        this.getPdfSimple = this.getPdfSimple.bind(this);
        this.getHocr = this.getHocr.bind(this);
        this.editText = this.editText.bind(this);
        this.performOCR = this.performOCR.bind(this);
        this.configureOCR = this.configureOCR.bind(this);
        this.indexFile = this.indexFile.bind(this);
        this.removeIndexFile = this.removeIndexFile.bind(this);
        this.createLayout = this.createLayout.bind(this);

        // functions for OCR menu
        this.closeOCRMenu = this.closeOCRMenu.bind(this);
        this.showStorageForm = this.showStorageForm.bind(this);

        // functions for layout menu
        this.closeLayoutMenu = this.closeLayoutMenu.bind(this);

        // functions for editing menu
        this.closeEditingMenu = this.closeEditingMenu.bind(this);

        // functions for menus
        this.fetchFiles = this.fetchFiles.bind(this);
        this.updateFiles = this.updateFiles.bind(this);
    }

    componentDidMount() {
        /**
         * Fetch the files and info from the server
         */
        axios.get(process.env.REACT_APP_API_URL + 'files?'
            + '_private=' + this.props._private
            + '&path=' + (this.props._private ? this.props.sessionId : ""))
        .then(({ data }) => {
            const info = data["info"];
            const files = data["files"];
            this.setState({files: files, info: info, loading: false});
        });

        // Update the info every UPDATE_TIME seconds
        this.createFetchInfoInterval();

        // Check for stuck uploads every STUCK_UPDATE_TIME seconds
        this.interval = setInterval(() => {
            axios.get(process.env.REACT_APP_API_URL + 'info?'
                        + '_private=' + this.props._private
                        + '&path=' + (this.props._private
                                        ? this.props.sessionId
                                        : this.state.current_folder))
            .then(({ data }) => {
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
                                        _private: this.props._private,
                                        path: (this.props._private
                                                ?  this.props.sessionId + '/' + path.replace(/^\//, '')
                                                : path.replace(/^\//, '')),
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
        if (this.state.current_folder !== prevState.current_folder  // moved to different folder
            || this.state.files !== prevState.files                 // created/deleted document or folder
            || this.state.fileOpened !== prevState.fileOpened) {    // exited menu or entered/exited document "folder"
            this.displayFileSystem();
        } else if (this.state.info !== prevState.info) { //|| this.state.components !== prevState.components) {
            this.updateInfo();
        }
    }

    createFetchInfoInterval() {
        this.interval = setInterval(this.fetchInfo, 1000 * UPDATE_TIME);
    }

    fetchInfo() {
        axios.get(process.env.REACT_APP_API_URL + 'info?'
                    + '_private=' + this.props._private
                    + '&path=' + (this.props._private
                                    ? this.props.sessionId + '/' + this.state.current_folder
                                    : this.state.current_folder))
        .then(({ data }) => {
            const info = data["info"];
            this.setState({info: info, updateCount: 0});
        });
    }

    updateInfo() {
        if (this.state.ocrMenu || this.state.layoutMenu || this.state.editingMenu) return;
        if (this.state.fileOpened) {
            // update rows for document's files (original and outputs)
            this.rowRefs.forEach(ref => {
                const filename = ref.current.props.filename;
                const rowInfo = this.getInfo(filename);
                // TODO: give appropriate info to each of the document's files (original, results, etc.)
                ref.current.updateInfo(rowInfo);
            });
        } else {
            // update info of rows for current folder's contents
            this.rowRefs.forEach(ref => {
                const filename = ref.current.props.name;
                if (this.state.updatingRows.length === 0 || this.state.updatingRows.includes(filename)) {
                    const rowInfo = this.getInfo(filename);
                    ref.current.updateInfo(rowInfo);
                }
            });
            this.setState({updatingRows: []});
        }
    }

    componentWillUnmount() {
        if (this.interval)
            clearInterval(this.interval);
    }

    fetchFiles() {
        axios.get(process.env.REACT_APP_API_URL + 'files?'
            + '_private=' + this.props._private
            + '&path=' + (this.props._private
                ? this.props.sessionId + '/' + this.state.current_folder
                : this.state.current_folder))
            .then(({ data }) => {
                const files = data['files'];
                const info = data["info"];
                this.setState({files: files, info: info, updateCount: 0});
            });
    }

    /**
     * Update the files and info
     */
    updateFiles(data) {
        const files = data['files'];
        const info = data['info'];
        this.setState({ files: files, info: info });
    }

    /**
     * Open the folder menu
     */
    createFolder() {
        let path = this.state.current_folder;
        if (this.props._private) { path = this.props.sessionId + '/' + path }
        this.folderMenu.current.openMenu(path);
    }

    showStorageForm(errorMessage) {
        this.storageMenu.current.setMessage(errorMessage);
        this.storageMenu.current.toggleOpen();
    }

    performOCR(filename, isFolder=false, alreadyOcr=false, customConfig=null) {
        let path = this.state.current_folder;
        if (this.props._private) { path = this.props.sessionId + '/' + path }
        this.ocrPopup.current.openMenu(path, filename, isFolder, alreadyOcr, customConfig);
    }

    sendChunk(i, chunk, fileName, _totalCount, _fileID) {
        let path = this.state.current_folder;
        if (this.props._private) { path = this.props.sessionId + '/' + path }

        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('_private', this.props._private);
        formData.append('path', path);
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
                if (!updatingList.includes(fileName)) {
                    updatingList.push(fileName);
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
        let path = this.state.current_folder;
        if (this.props._private) { path = this.props.sessionId + '/' + path }

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
                        _private: this.props._private,
                        path: path,
                        name: fileName,
                    })
                }).then(response => {return response.json()})
                .then(data => {
                    if (data['success']) {
                        var filesystem = data["filesystem"];
                        var info = filesystem["info"];
                        var files = filesystem["files"];
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

    /**
     * Export the .txt or .pdf file
     */
    getDocument(type, file, extension, suffix="") {
        this.successNot.current.openNotif("A transferência do ficheiro começou, por favor aguarde");

        let path = this.state.current_folder + '/' + file;
        if (this.props._private) { path = this.props.sessionId + '/' + path }

        fetch(process.env.REACT_APP_API_URL + 'get_' + type + '?_private=' + this.props._private + '&path=' + path, {
            method: 'GET'
        })
        .then(response => {return response.blob()})
        .then(data => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(data);

            const basename = file.split('.').slice(0, -1).join('.');
            a.download = basename + '_ocr' + suffix + '.' + extension;
            a.click();
            a.remove();
        });
    }

    getEntities(file) {
        this.successNot.current.openNotif("A transferência do ficheiro começou, por favor aguarde");

        let path = this.state.current_folder + '/' + file;
        if (this.props._private) { path = this.props.sessionId + '/' + path }

        fetch(process.env.REACT_APP_API_URL + 'get_entities?_private=' + this.props._private + '&path=' + path, {
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
        let path = this.state.current_folder + '/' + file;
        if (this.props._private) { path = this.props.sessionId + '/' + path }

        fetch(process.env.REACT_APP_API_URL + 'request_entities?_private=' + this.props._private + '&path=' + path, {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            if (data.success) {
                const filesystem = data["filesystem"];
                const info = filesystem["info"];
                const files = filesystem["files"];

                this.setState({files: files, info: info});
            }
        });
    }

    /*
    getZip() {
         //
         // Export the .zip file
         //
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
    */

    getOriginalFile(file) {
        this.successNot.current.openNotif("A transferência do ficheiro começou, por favor aguarde");

        let path = this.state.current_folder + '/' + file;
        if (this.props._private) { path = this.props.sessionId + '/' + path }

        fetch(process.env.REACT_APP_API_URL + 'get_original?_private=' + this.props._private + '&path=' + path, {
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
        this.getDocument("txt", file, "txt");
    }

    /**
     * Export the .txt file
     * with the delimiter
     */
    getDelimiterTxt(file) {
        this.getDocument("txt_delimited", file, "txt", "_delimitado");
    }

    /**
     * Export the .csv file
     */
    getCSV(file) {
         this.getDocument("csv", file, "csv");
    }

    /**
     * Export the .zip file
     */
    getImages(file) {
        this.successNot.current.openNotif("A transferência do ficheiro começou, por favor aguarde");

        let path = this.state.current_folder + '/' + file;
        if (this.props._private) { path = this.props.sessionId + '/' + path }

        fetch(process.env.REACT_APP_API_URL + 'get_images?_private=' + this.props._private + '&path=' + path, {
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
    getPdfIndexed(file) {
        this.getDocument("pdf_indexed", file, "pdf", "_texto_indice");
    }

    /**
     * Export the .pdf file
     */
    getPdfSimple(file) {
        this.getDocument("pdf", file, "pdf", "_texto");
    }

    getAlto(file) {
        this.getDocument("alto", file, "xml", "_alto");
    }

    getHocr(file) {
        this.getDocument("hocr", file, "hocr", "");
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
    deleteItem(filename) {
        let path = this.state.current_folder;
        if (this.props._private) { path = this.props.sessionId + '/' + path }
        this.deletePopup.current.openMenu(path, filename);
    }

    /**
     * Enter the folder and update the path
     */
    enterFolder(folder, isDocument = false) {
        const current_folder_list = this.state.current_folder.split('/');
        current_folder_list.push(folder);
        this.props.setCurrentPath(current_folder_list, isDocument);
    }

    /**
     * Find the folder in the files
     */
    findFolder(files, folder) {
        if (folder === "") {
            return files;
        } else {
            for (let i = 0; i < files.length; i++) {
                const dict = files[i];
                const key = Object.keys(dict)[0];
                if (key === folder) {
                    return dict[folder];
                }
            }
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
        if (this.state.current_folder !== null && this.state.current_folder !== "") {
            path = this.state.current_folder + '/' + path;
        }
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

    toggleSortByName() {
        this.setState({ sorting: (this.state.sorting + 1) % 3 });
    }

    sortByName() {
        switch (this.state.sorting) {
            case 0:
                // Default server-provided order
                return this.state.components;
            case 1:
                // Sort in alphabetical order
                return this.state.components.toSorted((a, b) => (a.key).localeCompare(b.key));
            case 2:
                // Sort in reverse alphabetical order
                return this.state.components.toSorted((a, b) => (b.key).localeCompare(a.key));
        }
    }

    displayFileSystem() {
        /**
         * Iterate the contents of the folder and build the components
         */
        if (this.state.ocrMenu || this.state.layoutMenu || this.state.editingMenu) return;

        this.rowRefs = [];
        const items = [];

        if (this.state.fileOpened) {
            const docInfo = this.getInfo(this.state.fileOpened);
            let ref = React.createRef();
            this.rowRefs.push(ref);
            items.push(
                <StaticFileRow
                    ref={ref}
                    key={this.state.fileOpened + " original"}
                    name={this.state.fileOpened + " (original)"}
                    filename={this.state.fileOpened}
                    info={docInfo}
                    fileIcon={<FileIcon extension={docInfo["extension"]} />}
                    downloadFile={this.getOriginalFile}
                />
            );
            if (docInfo["pdf_indexed"]?.complete) {
                ref = React.createRef();
                this.rowRefs.push(ref);
                items.push(
                    <StaticFileRow
                        ref={ref}
                        key={this.state.fileOpened + " pdf_indexed"}
                        name={"PDF com texto e índice"}
                        filename={this.state.fileOpened}
                        type="pdf_indexed"
                        info={docInfo["pdf_indexed"]}
                        fileIcon={<PdfIcon />}
                        downloadFile={this.getPdfIndexed}
                    />
                );
            }
            if (docInfo["pdf"]?.complete) {
                ref = React.createRef();
                this.rowRefs.push(ref);
                items.push(
                    <StaticFileRow
                        ref={ref}
                        key={this.state.fileOpened + " pdf"}
                        name={"PDF com texto"}
                        filename={this.state.fileOpened}
                        type="pdf"
                        info={docInfo["pdf"]}
                        fileIcon={<PdfIcon />}
                        downloadFile={this.getPdfSimple}
                    />
                );
            }
            if (docInfo["txt"]?.complete) {
                ref = React.createRef();
                this.rowRefs.push(ref);
                items.push(
                    <StaticFileRow
                        ref={ref}
                        key={this.state.fileOpened + " txt"}
                        name={"Texto"}
                        filename={this.state.fileOpened}
                        type="txt"
                        info={docInfo["txt"]}
                        fileIcon={<TxtIcon />}
                        downloadFile={this.getTxt}
                    />
                );
            }
            if (docInfo["txt_delimited"]?.complete) {
                ref = React.createRef();
                this.rowRefs.push(ref);
                items.push(
                    <StaticFileRow
                        ref={ref}
                        key={this.state.fileOpened + " txt_delimited"}
                        name={"Texto com separadores de páginas"}
                        filename={this.state.fileOpened}
                        type="txt_delimited"
                        info={docInfo["txt_delimited"]}
                        fileIcon={<TxtIcon />}
                        downloadFile={this.getDelimiterTxt}
                    />
                );
            }
            if (docInfo["csv"]?.complete) {
                ref = React.createRef();
                this.rowRefs.push(ref);
                items.push(
                    <StaticFileRow
                        ref={ref}
                        key={this.state.fileOpened + " csv"}
                        name={"Índice de palavras"}
                        filename={this.state.fileOpened}
                        type="csv"
                        info={docInfo["csv"]}
                        fileIcon={<CsvIcon />}
                        downloadFile={this.getCSV}
                    />
                );
            }
            if (docInfo["ner"]?.complete) {
                ref = React.createRef();
                this.rowRefs.push(ref);
                items.push(
                    <StaticFileRow
                        ref={ref}
                        key={this.state.fileOpened + " ner"}
                        name={"Entidades"}
                        filename={this.state.fileOpened}
                        type="ner"
                        info={docInfo["ner"]}
                        fileIcon={<JsonIcon />}
                        downloadFile={this.getEntities /* TODO: request and endpoint may need updating */ }
                    />
                );
            }
            if (docInfo["hocr"]?.complete) {
                ref = React.createRef();
                this.rowRefs.push(ref);
                items.push(
                    <StaticFileRow
                        ref={ref}
                        key={this.state.fileOpened + " hocr"}
                        name={"hOCR"}
                        filename={this.state.fileOpened}
                        type="hocr"
                        info={docInfo["hocr"]}
                        fileIcon={<AltoIcon />}
                        downloadFile={this.getHocr}
                    />
                );
            }
            if (docInfo["xml"]?.complete) {
                ref = React.createRef();
                this.rowRefs.push(ref);
                items.push(
                    <StaticFileRow
                        ref={ref}
                        key={this.state.fileOpened + " xml"}
                        name={"ALTO"}
                        filename={this.state.fileOpened}
                        type="xml"
                        info={docInfo["xml"]}
                        fileIcon={<AltoIcon />}
                        downloadFile={this.getAlto}
                    />
                );
            }
            if (docInfo["zip"]?.complete) {
                ref = React.createRef();
                this.rowRefs.push(ref);
                items.push(
                    <StaticFileRow
                        ref={ref}
                        key={this.state.fileOpened + " zip"}
                        name={"Imagens extraídas"}
                        filename={this.state.fileOpened}
                        type="zip"
                        info={docInfo["zip"]}
                        fileIcon={<ZipIcon />}
                        downloadFile={this.getImages}
                    />
                );
            }

        } else for (let item of this.sortContents(this.getPathContents())) {
            let ref = React.createRef();
            this.rowRefs.push(ref);

            if (typeof item === 'string' || item instanceof String) {
                items.push(
                    <DocumentRow
                        ref={ref}
                        key={item}
                        name={item}
                        _private={this.props._private}
                        info={this.getInfo(item)}
                        enterDocument={this.enterFolder}
                        deleteItem={this.deleteItem}
                        getOriginalFile={this.getOriginalFile}
                        getDelimiterTxt={this.getDelimiterTxt}
                        getTxt={this.getTxt}
                        getEntities={this.getEntities}
                        requestEntities={this.requestEntities}
                        getCSV={this.getCSV}
                        getImages={this.getImages}
                        getPdfIndexed={this.getPdfIndexed}
                        getPdfSimple={this.getPdfSimple}
                        getAlto={this.getAlto}
                        getHocr={this.getHocr}
                        editText={this.editText}
                        performOCR={this.performOCR}
                        configureOCR={this.configureOCR}
                        indexFile={this.props._private ? null : this.indexFile}
                        removeIndexFile={this.props._private ? null : this.removeIndexFile}
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
                        info={this.getInfo(key)}
                        enterFolder={this.enterFolder}
                        deleteItem={this.deleteItem}
                    />
                )
            }
        }
        this.setState({components: items});
    }

    configureOCR(filename, isFolder=false, isSinglePage=false, customConfig=null) {
        this.props.enterOcrMenu(filename, isFolder, isSinglePage, customConfig);
    }

    closeOCRMenu() {
        this.props.exitMenus(this.fetchInfo);
    }

    createLayout(filename) {
        this.props.enterLayoutMenu(filename);
    }

    closeLayoutMenu() {
        this.props.exitMenus(this.fetchInfo);
    }

    editText(filename) {
        this.props.enterEditingMenu(filename);
    }

    closeEditingMenu() {
        this.props.exitMenus(this.fetchInfo);
    }

    generateTable() {
        return (
            <TableContainer component={Paper}>
                <Table aria-label="filesystem table" sx={{border:"1px solid #aaa"}}>
                    <TableHead>
                        <TableRow>
                            <TableCell className={"explorerCell " + (this.state.fileOpened ? "staticNameCell" : "nameCell")}>
                                <Button
                                    startIcon={
                                        this.state.sorting === 0
                                            ? <SwapVertIcon />
                                        : this.state.sorting === 1
                                            ? <ArrowDownAZIcon />
                                        : <ArrowUpZAIcon />
                                    }
                                    sx={{backgroundColor: '#ffffff', color: '#000000', ':hover': {bgcolor: '#dddddd'}, textTransform: 'none'}}
                                    onClick={() => this.toggleSortByName()}>
                                    <b>Nome</b>
                                </Button>
                            </TableCell>
                            <TableCell className={"explorerCell " + (this.state.fileOpened ? "staticActionsCell" : "actionsCell")}>
                                <b>Ações</b>
                            </TableCell>
                            { !this.state.fileOpened
                                ? <TableCell className="explorerCell stateCell">
                                    <b>Estado</b>
                                </TableCell>
                                : null
                            }
                            <TableCell className={"explorerCell " + (this.state.fileOpened ? "staticDateCreatedCell" : "dateCreatedCell")}>
                                <b>Data de criação</b>
                            </TableCell>
                            <TableCell className={"explorerCell " + (this.state.fileOpened ? "staticDetailsCell" : "detailsCell")}>
                                <b>Detalhes</b>
                            </TableCell>
                            <TableCell className={"explorerCell " + (this.state.fileOpened ? "staticSizeCell" : "sizeCell")}>
                                <b>Tamanho</b>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.sortByName()}
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
                this.successNot.current.openNotif(data.message);
            } else {
                this.errorNot.current.openNotif(data.message);
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
                this.successNot.current.openNotif(data.message);
            } else {
                this.errorNot.current.openNotif(data.message);
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
                    this.state.ocrMenu
                    ? <OcrMenu _private={this.props._private}
                               sessionId={this.props._private ? this.props.sessionId : ""}
                               current_folder={this.state.current_folder}
                               filename={this.state.fileOpened}
                               isFolder={this.state.isFolder}
                               isSinglePage={this.state.isSinglePage}
                               customConfig={this.state.customConfig}
                               closeOCRMenu={this.closeOCRMenu}
                               showStorageForm={this.showStorageForm}/>
                    : this.state.layoutMenu
                    ? <LayoutMenu _private={this.props._private}
                                  sessionId={this.props._private ? this.props.sessionId : ""}
                                  current_folder={this.state.current_folder}
                                  filename={this.state.fileOpened}
                                  closeLayoutMenu={this.closeLayoutMenu}/>
                    : this.state.editingMenu
                    ? <EditingMenu _private={this.props._private}
                                   sessionId={this.props._private ? this.props.sessionId : ""}
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

                        <FolderMenu ref={this.folderMenu}
                                    _private={this.props._private}
                                    submitCallback={this.fetchFiles}/>
                        <OcrPopup ref={this.ocrPopup}
                                  _private={this.props._private}
                                  submitCallback={this.fetchInfo}
                                  showStorageForm={this.showStorageForm}/>
                        <DeletePopup ref={this.deletePopup}
                                     _private={this.props._private}
                                     submitCallback={this.fetchFiles}/>
                        {
                            this.props._private
                            ? <PrivateSessionMenu ref={this.privateSessionMenu}
                                                  rowRefsLength={this.rowRefs.length}
                                                  createFile={this.createFile}/>
                            : null
                        }
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
    enterOcrMenu: null,
    enterLayoutMenu: null,
    enterEditingMenu: null,
    exitMenus: null
}

export default FileExplorer;
