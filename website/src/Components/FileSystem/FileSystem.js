import React from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from "@mui/material/TableSortLabel";
import Paper from '@mui/material/Paper';
import Typography from "@mui/material/Typography";

import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import LockIcon from "@mui/icons-material/Lock";
import NoteAddIcon from "@mui/icons-material/NoteAdd";

import visuallyHidden from "@mui/utils/visuallyHidden";

import customParseFormat from 'dayjs/plugin/customParseFormat';
import { v4 as uuidv4 } from 'uuid';

import Notification from 'Components/Notifications/Notification';
import FullStorageMenu from "Components/Notifications/FullStorageMenu";
import OcrMenu from 'Components/OcrMenu/OcrMenu';
import LayoutMenu from 'Components/LayoutMenu/LayoutMenu';
import EditingMenu from 'Components/EditingMenu/EditingMenu';
import FolderMenu from 'Components/Form/FolderMenu';
import OcrPopup from 'Components/Form/OcrPopup';
import DeletePopup from 'Components/Form/DeletePopup';
import PrivateSpaceMenu from 'Components/Form/PrivateSpaceMenu';
import DocumentRow from "./DocumentRow";
import FolderRow from "./FolderRow";
import ReturnButton from './ReturnButton';

dayjs.extend(customParseFormat);

const UPDATE_PERIOD_SECONDS = 15;
const UPLOAD_UPDATE_SECONDS = 5;
const STUCK_CHECK_PERIOD_SECONDS = 2 * 60;  // check for stuck uploads every 2 minutes
const STUCK_UPLOAD_TIMEOUT_MINUTES = 4; // files still not ready for OCR after these minutes are considered stuck

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

const chunkSize = 1024 * 1024 * 1024; // 1GB

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;

const _zerobytes = ["0", "B"];
const sizeMap = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
}

class FileExplorer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            files: null,
            info: null,
            maxAge: null,
            components: [],
            order: "asc",
            orderBy: "name",

            fetched: false,
        }

        this.folderMenu = React.createRef();
        this.ocrPopup = React.createRef();
        this.deletePopup = React.createRef();
        if (props._private) {
            this.privateSpaceMenu = React.createRef();
        }
        this.storageMenu = React.createRef();

        this.successNot = React.createRef();
        this.errorNot = React.createRef();

        this.infoInterval = null;
        this.stuckInterval = null;
        this.uploadingCheckInterval = null;
        this.rowRefs = [];

        this.fetchInfo = this.fetchInfo.bind(this);

        // functions for private space opening menu
        this.createFile = this.createFile.bind(this);

        // functions for file/folder rows
        this.enterFolder = this.enterFolder.bind(this);
        this.deleteItem = this.deleteItem.bind(this);
        this.getOriginalFile = this.getOriginalFile.bind(this);
        this.getDocument = this.getDocument.bind(this);
        this.getEntities = this.getEntities.bind(this);
        this.requestEntities = this.requestEntities.bind(this);
        this.getImages = this.getImages.bind(this);
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
    }

    componentDidMount() {
         // Fetch the files and info from the server
        this.fetchFileSystem();

        // Update the info every UPDATE_PERIOD_SECONDS seconds
        this.createFetchInfoInterval();

        // Check for stuck uploads every STUCK_CHECK_PERIOD_SECONDS seconds
        this.stuckInterval = setInterval(() => {
            axios.get(API_URL + '/info', {
                params: {
                    _private: this.props._private,
                    path: (this.props._private
                            ? this.props.spaceId
                            : this.props.current_folder)
                }
            })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error("Não foi possível obter os dados do servidor.");
                }
                const info = response.data["info"];
                // Find if a upload is stuck
                this.checkStuckUploads(info);
                this.fetchInfo();
            });
        }, 1000 * STUCK_CHECK_PERIOD_SECONDS);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps._private !== this.props._private) {  // moved to private space
            this.fetchFileSystem();
        } else if (prevProps.current_folder !== this.props.current_folder  // moved to different folder
            || this.state.files !== prevState.files) {                 // created/deleted document or folder
            this.displayFileSystem();
        } else if (this.state.info !== prevState.info) {  // fetched updated info
            this.updateInfo();
        }
    }

    checkStuckUploads(info) {
        // Find if a upload is stuck
        for (const [path, value] of Object.entries(info)) {
            if (value.type === "file") {
                if ("stored" in value && value["stored"] !== true) {
                    const creationTime = new Date(value.creation.replace(/(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/, '$3-$2-$1T$4:$5:$6'));
                    const currentTime = new Date();
                    const timeDiffMinutes = (currentTime - creationTime) / (1000 * 60);

                    if (timeDiffMinutes >= STUCK_UPLOAD_TIMEOUT_MINUTES) {
                        fetch(API_URL + '/set-upload-stuck', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                _private: this.props._private,
                                path: (this.props._private
                                    ?  this.props.spaceId + '/' + path.replace(/^\//, '')
                                    : path.replace(/^\//, '')),
                            }),
                        })
                            .then(response => response.json());
                    }
                }
            }
        }
    }

    fetchFileSystem() {
        axios.get(API_URL + '/files', {
            params: {
                    _private: this.props._private,
                    path: this.props._private ? this.props.spaceId : ""
            }
        })
            .then(response => {
                if (response.status !== 200) {
                    if (response.status === 404) {
                        throw new Error("Esta pasta ou espaço privado não existe.");
                    } else {
                        throw new Error("Não foi possível obter os dados do servidor.");
                    }
                }
                const info = response.data["info"];
                this.checkStuckUploads(info);  // check for stuck uploads on initial filesystem fetch
                const files = response.data["files"];
                const maxAge = response.data["maxAge"];
                this.setState({files: files, info: info, maxAge: maxAge, fetched: true});
            })
            .catch(err => {
                this.storageMenu.current.openWithMessage(err.message);
            });
    }

    /**
     * Fetch updated information about existing files and metadata.
     *
     * Call after actions that create or delete documents/folders.
     */
    fetchFiles() {
        axios.get(API_URL + '/files', {
            params: {
                _private: this.props._private,
                path: (this.props._private
                        ? this.props.spaceId + '/' + this.props.current_folder
                        : this.props.current_folder)
            }
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error("Não foi possível obter os dados do servidor.");
                }
                const files = response.data['files'];
                const info = response.data["info"];
                this.setState({files: files, info: info, updateCount: 0});
            })
            .catch(err => {
                this.storageMenu.current.openWithMessage(err.message);
            });
    }

    createFetchInfoInterval() {
        this.infoInterval = setInterval(this.fetchInfo, 1000 * UPDATE_PERIOD_SECONDS);  // TODO: replace with WebSockets
    }

    /**
     * Fetch updated metadata from the server.
     *
     * Call occasionally for updated info,
     * and after actions on existing files, that don't create or delete documents/folders.
     */
    fetchInfo() {
        axios.get(API_URL + '/info', {
            params: {
                _private: this.props._private,
                path: (this.props._private
                        ? this.props.spaceId + '/' + this.props.current_folder
                        : this.props.current_folder)
            }
        })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error("Não foi possível obter os dados do servidor.");
                }
                const info = response.data["info"];
                this.setState({info: info, updateCount: 0});
            })
            .catch(err => {
                this.storageMenu.current.openWithMessage(err.message);
            });
    }

    /**
     * Update the info of each row being displayed.
     */
    updateInfo() {
        if (this.props.ocrMenu || this.props.layoutMenu || this.props.editingMenu) return;
        // update info of rows for current folder's contents
        this.rowRefs.forEach(ref => {
            const filename = ref.current.props.name;
            const rowInfo = this.getInfo(filename);
            ref.current.updateInfo(rowInfo);
        });
    }

    componentWillUnmount() {
        if (this.infoInterval)
            clearInterval(this.infoInterval);
        if (this.stuckInterval)
            clearInterval(this.stuckInterval);
        if (this.uploadingCheckInterval)
            clearInterval(this.uploadingCheckInterval);
    }

    /**
     * Open the folder menu
     */
    createFolder() {
        let path = this.props.current_folder;
        if (this.props._private) { path = this.props.spaceId + '/' + path }
        this.folderMenu.current.openMenu(path);
    }

    showStorageForm(errorMessage) {
        this.storageMenu.current.openWithMessage(errorMessage);

    }

    performOCR(filename, ocrTargetIsFolder=false, alreadyOcr=false, customConfig=null) {
        let path = this.props.current_folder;
        if (this.props._private) { path = this.props.spaceId + '/' + path }
        this.ocrPopup.current.openMenu(path, filename, ocrTargetIsFolder, alreadyOcr, customConfig);
    }

    sendChunk(i, chunk, fileName, _totalCount, _fileID) {
        let path = this.props.current_folder;
        if (this.props._private) { path = this.props.spaceId + '/' + path }

        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('_private', this.props._private);
        formData.append('path', path);
        formData.append('name', fileName);
        formData.append("fileID", _fileID);
        formData.append('counter', i+1);
        formData.append('totalCount', _totalCount);

        fetch(API_URL + '/upload-file', {
            method: 'POST',
            body: formData
        }).then(response => {return response.json()})
        .then(data => {
            if (data['success']) {
                // Update upload status every UPLOAD_UPDATE_SECONDS seconds
                if (!this.uploadingCheckInterval) {
                    this.uploadingCheckInterval = setInterval((fileName) => {
                        axios.get(API_URL + '/info', {
                            params: {
                                _private: this.props._private,
                                path: (this.props._private
                                    ? this.props.spaceId
                                    : this.props.current_folder)
                            }
                        })
                            .then(response => {
                                if (response.status !== 200) {
                                    throw new Error("Não foi possível obter os dados do servidor.");
                                }
                                const info = response.data["info"];
                                const uploadInfo = this.getInfo(fileName)
                                // If upload is finished, end interval
                                if (uploadInfo["stored"]) {
                                    clearInterval(this.uploadingCheckInterval);
                                }
                                this.setState({info: info});

                            });
                    }, 1000 * UPLOAD_UPDATE_SECONDS, fileName);
                }
            } else {
                this.storageMenu.current.openWithMessage(data.error);
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
        let path = this.props.current_folder;
        if (this.props._private) { path = this.props.spaceId + '/' + path }

        const el = window._protected_reference = document.createElement("INPUT");
        el.type = "file";
        el.accept = validExtensions.join(',');
        el.multiple = true;

        el.addEventListener('change', () => {
            if (el.files.length === 0) return;

            // Sort files by size (ascending)
            const files = Array.from(el.files).sort((a, b) => a.size - b.size);

            for (let i = 0; i < files.length; i++) {
                let fileBlob = files[i];
                let fileSize = files[i].size;
                let fileName = files[i].name;
                let fileType = files[i].type;
                const _totalCount = fileSize % chunkSize === 0
                                            ? fileSize / chunkSize
                                            : Math.floor(fileSize / chunkSize) + 1;

                const _fileID = uuidv4() + "." + fileName.split('.').pop();

                fetch(API_URL + '/prepare-upload', {
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
                        fileName = data["filename"];  // update filename if server changed it due to name collisions

                        //// Update list of files on screen after upload of first chunk
                        this.fetchFiles();

                        // Send chunks
                        let startChunk = 0;
                        let endChunk = chunkSize;
                        for (let i = 0; i < _totalCount; i++) {
                            let chunk = fileBlob.slice(startChunk, endChunk, fileType);
                            startChunk = endChunk;
                            endChunk = endChunk + chunkSize;
                            this.sendChunk(i, chunk, fileName, _totalCount, _fileID);
                        }
                    } else {
                        this.storageMenu.current.openWithMessage(data.error);
                    }
                });
            }
        });
        el.click();
    }

    /**
     * Export the .txt or .pdf file
     */
    getDocument(type, file, extension, suffix="") {
        this.successNot.current.openNotif("A transferência do ficheiro começou, por favor aguarde");

        let path = this.props.current_folder + '/' + file;
        if (this.props._private) { path = this.props.spaceId + '/' + path }

        fetch(API_URL + '/get_' + type + '?_private=' + this.props._private + '&path=' + path, {
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

        let path = this.props.current_folder + '/' + file;
        if (this.props._private) { path = this.props.spaceId + '/' + path }

        fetch(API_URL + '/get_entities?_private=' + this.props._private + '&path=' + path, {
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

    // TODO: currently not being called;
    // can be called from a button to request entities from existing OCR results
    requestEntities(file) {
        let path = this.props.current_folder + '/' + file;
        if (this.props._private) { path = this.props.spaceId + '/' + path }

        fetch( API_URL + '/request_entities?_private=' + this.props._private + '&path=' + path, {
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
        const path = this.props.current_folder.replace(/^\//, '');

        fetch(API_URL + "get_zip?path=" + path, {
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

        let path = this.props.current_folder + '/' + file;
        if (this.props._private) { path = this.props.spaceId + '/' + path }

        fetch(API_URL + '/get_original?_private=' + this.props._private + '&path=' + path, {
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
     * Export the .zip file
     */
    getImages(file) {
        this.successNot.current.openNotif("A transferência do ficheiro começou, por favor aguarde");

        let path = this.props.current_folder + '/' + file;
        if (this.props._private) { path = this.props.spaceId + '/' + path }

        fetch(API_URL + '/get_images?_private=' + this.props._private + '&path=' + path, {
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
     * Open the delete menu
     */
    deleteItem(filename) {
        let path = this.props.current_folder;
        if (this.props._private) { path = this.props.spaceId + '/' + path }
        this.deletePopup.current.openMenu(path, filename);
    }

    /**
     * Enter the folder and update the path
     */
    enterFolder(folder, isDocument = false) {
        const current_folder_list = this.props.current_folder.split('/');
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
        let current_folder_list = this.props.current_folder.split('/');

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
        if (this.props.current_folder !== null && this.props.current_folder !== "") {
            path = this.props.current_folder + '/' + path;
        }
        return this.state.info[path];
    }

    handleRequestSort(columnName) {
        const isAsc = this.state.orderBy === columnName && this.state.order === "asc";
        this.setState({
           order: isAsc ? "desc" : "asc",
           orderBy: columnName,
        });
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

    getSortedRows() {
        const order = this.state.order === "asc" ? 1 : -1;
        switch (this.state.orderBy) {
            case "name":
                return this.state.components.toSorted((a, b) => {
                    if (a.props.info?.["type"] === "folder" && b.props.info?.["type"] === "file") {
                        return -1;  // list folders first
                    } else if (a.props.info?.["type"] === "file" && b.props.info?.["type"] === "folder") {
                        return 1;  // list folders first
                    } else {
                        return order * (a.key).localeCompare(b.key);
                    }
                });

            case "details":
                return this.state.components.toSorted((a, b) => {
                    if (a.props.info?.["type"] === "folder" && b.props.info?.["type"] === "file") {
                        return -1;  // list folders first
                    } else if (a.props.info?.["type"] === "file" && b.props.info?.["type"] === "folder") {
                        return 1;  // list folders first
                    } else {
                        // For now, assumed that details are just number of pages or contents
                        const detailsA = a.props.info?.["type"] === "folder" ? a.props.info?.["contents"] : a.props.info?.["pages"];
                        const detailsB = b.props.info?.["type"] === "folder" ? b.props.info?.["contents"] : b.props.info?.["pages"];
                        return order * (detailsA - detailsB);
                    }
                });

            case "dateCreated":
                return this.state.components.toSorted((a, b) => {
                    if (a.props.info?.["type"] === "folder" && b.props.info?.["type"] === "file") {
                        return -1;  // list folders first
                    } else if (a.props.info?.["type"] === "file" && b.props.info?.["type"] === "folder") {
                        return 1;  // list folders first
                    } else {
                        // Format to parse must be ensured to be the same as server-side date format
                        const dateA = dayjs(a.props.info?.["creation"], "DD/MM/YYYY HH:mm:ss");
                        const dateB = dayjs(b.props.info?.["creation"], "DD/MM/YYYY HH:mm:ss");
                        return dateA.isAfter(dateB) ? order : (-order);
                    }
                });

            case "size":
                return this.state.components.toSorted((a, b) => {
                    if (a.props.info?.["type"] === "folder" && b.props.info?.["type"] === "file") {
                        return -1;  // list folders first
                    } else if (a.props.info?.["type"] === "file" && b.props.info?.["type"] === "folder") {
                        return 1;  // list folders first
                    } else if (a.props.info?.["type"] === "folder" && b.props.info?.["type"] === "folder") {
                        let sizeA = a.props.info?.["size"]?.split(" ") ?? _zerobytes;
                        let sizeB = b.props.info?.["size"]?.split(" ") ?? _zerobytes;
                        sizeA = Number(sizeA[0]) * (sizeMap[sizeA[1]] || 1);
                        sizeB = Number(sizeB[0]) * (sizeMap[sizeB[1]] || 1);
                        return order * (sizeA - sizeB);
                    } else {
                        let sizeA = a.props.info?.["total_size"]?.split(" ") ?? _zerobytes;
                        let sizeB = b.props.info?.["total_size"]?.split(" ") ?? _zerobytes;
                        sizeA = Number(sizeA[0]) * (sizeMap[sizeA[1]] || 1);
                        sizeB = Number(sizeB[0]) * (sizeMap[sizeB[1]] || 1);
                        return order * (sizeA - sizeB);
                    }
                });

            case "dateOCR":
                return this.state.components.toSorted((a, b) => {
                    if (a.props.info?.["type"] === "folder" && b.props.info?.["type"] === "file") {
                        return -1;  // list folders first
                    } else if (a.props.info?.["type"] === "file" && b.props.info?.["type"] === "folder") {
                        return 1;  // list folders first
                    } else {
                        // Format to parse must be ensured to be the same as server-side date format
                        const dateA = dayjs(a.props.info?.["ocr"]?.["creation"], "DD/MM/YYYY HH:mm:ss");
                        const dateB = dayjs(b.props.info?.["ocr"]?.["creation"], "DD/MM/YYYY HH:mm:ss");
                        return dateA.isAfter(dateB) ? order : (-order);
                    }
                });

            default:
                return this.state.components;
        }
    }

    displayFileSystem() {
        /**
         * Iterate the contents of the folder and build the components
         */
        if (this.props.ocrMenu || this.props.layoutMenu || this.props.editingMenu) return;

        this.rowRefs = [];
        const items = [];

        for (let item of this.sortContents(this.getPathContents())) {
            let ref = React.createRef();
            this.rowRefs.push(ref);

            if (typeof item === 'string' || item instanceof String) {
                items.push(
                    <DocumentRow
                        ref={ref}
                        key={this.props.current_folder + "/" + item}
                        name={item}
                        thumbnails={{
                            small: `${this.props.current_folder}/${item}/_thumbnails/${item}_128.thumbnail`,
                            large: `${this.props.current_folder}/${item}/_thumbnails/${item}_600.thumbnail`,
                        }}
                        _private={this.props._private}
                        info={this.getInfo(item)}
                        enterDocument={this.enterFolder}
                        deleteItem={this.deleteItem}
                        getOriginalFile={this.getOriginalFile}
                        getDocument={this.getDocument}
                        getEntities={this.getEntities}
                        requestEntities={this.requestEntities}
                        getImages={this.getImages}
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
                        key={this.props.current_folder + "/" + key}
                        name={key}
                        info={this.getInfo(key)}
                        enterFolder={this.enterFolder}
                        performOCR={this.performOCR}
                        configureOCR={this.configureOCR}
                        deleteItem={this.deleteItem}
                    />
                )
            }
        }
        this.setState({components: items});
    }

    configureOCR(filename, ocrTargetIsFolder=false, ocrTargetIsSinglePage=false, customConfig=null) {
        this.props.enterOcrMenu(filename, ocrTargetIsFolder, ocrTargetIsSinglePage, customConfig);
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
            <TableContainer sx={{width: "100%", maxHeight: '70vh', border: '1px solid #aaa'}} component={Paper}>
                <Table
                    stickyHeader
                    aria-label="filesystem table"
                    sx={{tableLayout: "fixed", border:"1px solid #aaa", borderCollapse: "collapse"}}
                >
                    <TableHead>
                        <TableRow className="explorerHeaderRow">
                            <TableCell scope="column" className="explorerCell optionsCell" />

                            <TableCell scope="column" className="explorerCell thumbnailCell" sx={{border: "0 !important"}} />

                            <TableCell
                                key="name"
                                scope="column"
                                align="left"
                                sortDirection={this.state.orderBy === "name" ? this.state.order : false}
                                className="headerCell explorerCell nameCell"
                            >
                                <TableSortLabel
                                    active={this.state.orderBy === "name"}
                                    direction={this.state.orderBy === "name" ? this.state.order : 'asc'}
                                    onClick={() => this.handleRequestSort("name")}
                                    sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        width: "fit-content",
                                    }}
                                >
                                    <span><b>Nome</b></span>
                                    {this.state.orderBy === "name" ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {this.state.order === 'desc' ? 'ordem descendente' : 'ordem ascendente'}
                                        </Box>
                                    ) : null}
                                </TableSortLabel>
                            </TableCell>

                            <TableCell scope="column" className="headerCell explorerCell detailsCell" align="left">
                                <TableSortLabel
                                    active={this.state.orderBy === "details"}
                                    direction={this.state.orderBy === "details" ? this.state.order : 'asc'}
                                    onClick={() => this.handleRequestSort("details")}
                                    sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        width: "fit-content",
                                    }}
                                >
                                    <span><b>Detalhes</b></span>
                                    {this.state.orderBy === "details" ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {this.state.order === 'desc' ? 'ordem descendente' : 'ordem ascendente'}
                                        </Box>
                                    ) : null}
                                </TableSortLabel>
                            </TableCell>

                            <TableCell scope="column" className="headerCell explorerCell sizeCell" align="right">
                                <TableSortLabel
                                    active={this.state.orderBy === "size"}
                                    direction={this.state.orderBy === "size" ? this.state.order : 'asc'}
                                    onClick={() => this.handleRequestSort("size")}
                                    sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <span><b>Tamanho</b></span>
                                    {this.state.orderBy === "size" ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {this.state.order === 'desc' ? 'ordem descendente' : 'ordem ascendente'}
                                        </Box>
                                    ) : null}
                                </TableSortLabel>
                            </TableCell>

                            <TableCell scope="column" className="headerCell explorerCell dateCreatedCell" align="right">
                                <TableSortLabel
                                    active={this.state.orderBy === "dateCreated"}
                                    direction={this.state.orderBy === "dateCreated" ? this.state.order : 'asc'}
                                    onClick={() => this.handleRequestSort("dateCreated")}
                                    sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <b>Data de criação</b>
                                    {this.state.orderBy === "dateCreated" ? (
                                        <Box component="span" sx={visuallyHidden}>
                                            {this.state.order === 'desc' ? 'ordem descendente' : 'ordem ascendente'}
                                        </Box>
                                    ) : null}
                                </TableSortLabel>
                            </TableCell>

                            <TableCell scope="column" className="headerCell explorerCell stateCell" align="left">
                                <span><b>Estado do Processo</b></span>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.state.components.length === 0
                            ? <TableCell scope="column" colSpan={7} className="explorerCell optionsCell">
                                <Typography variant="body1" sx={{marginTop: "1rem", marginBottom: "1rem", marginLeft: "1rem"}}>
                                    A pasta está vazia. Adicione um documento ou sub-pasta.
                                </Typography>
                            </TableCell>
                            : this.getSortedRows()
                        }
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }

    indexFile(file, multiple) {
        const path = (this.props.current_folder + '/' + file).replace(/^\//, '');

        fetch(API_URL + '/index-doc', {
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

            this.fetchInfo();
        })
    }

    removeIndexFile(file, multiple) {
        const path = (this.props.current_folder + '/' + file).replace(/^\//, '');

        fetch(API_URL + '/remove-index-doc', {
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

            this.fetchInfo();
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
        var current_folder = this.props.current_folder;

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
                    this.props.current_folder.map((folder, index) => {
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
                <FullStorageMenu ref={this.storageMenu}/>
                {
                    this.props.ocrMenu
                    ? <OcrMenu _private={this.props._private}
                               spaceId={this.props._private ? this.props.spaceId : ""}
                               current_folder={this.props.current_folder}
                               filename={this.props.current_file_name}
                               isFolder={this.props.ocrTargetIsFolder}
                               isSinglePage={this.props.ocrTargetIsSinglePage}
                               customConfig={this.props.customConfig}
                               setCurrentCustomConfig={this.props.setCurrentCustomConfig}
                               closeOCRMenu={this.closeOCRMenu}
                               showStorageForm={this.showStorageForm}/>
                    : this.props.layoutMenu
                    ? <LayoutMenu _private={this.props._private}
                                  spaceId={this.props._private ? this.props.spaceId : ""}
                                  current_folder={this.props.current_folder}
                                  filename={this.props.current_file_name}
                                  closeLayoutMenu={this.closeLayoutMenu}/>
                    : this.props.editingMenu
                    ? <EditingMenu _private={this.props._private}
                                   spaceId={this.props._private ? this.props.spaceId : ""}
                                   current_folder={this.props.current_folder}
                                   filename={this.props.current_file_name}
                                   closeEditingMenu={this.closeEditingMenu}/>
                    :
                    <>
                    <Box className="toolbar">
                        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "left"}}>
                            <ReturnButton
                                disabled={this.props.current_folder === "" && (!this.props._private || this.props.current_file_name == null)}
                                returnFunction={this.props.returnToParentFolder}
                            />

                            <Button
                                variant="contained"
                                startIcon={<CreateNewFolderIcon/>}
                                onClick={() => this.createFolder()}
                                className="menuButton menuFunctionButton noMarginRight"
                                sx={{marginLeft: '0.5rem'}}
                            >
                                Nova Pasta
                            </Button>

                            <Button
                                disabled={
                                    /* in private space, root level can have docs */
                                    this.props.current_folder === "" && !this.props._private
                                }
                                variant="contained"
                                startIcon={<NoteAddIcon/>}
                                onClick={() => this.createFile()}
                                className="menuButton menuFunctionButton noMarginRight"
                            >
                                Novo Documento
                            </Button>
                        </Box>

                        {this.props.spaceId
                            ? <Button
                                variant="contained"
                                startIcon={<LockIcon/>}
                                onClick={() => this.props.leavePrivateSpace()}
                                className="menuButton"
                                color="error"
                                sx={{
                                    marginLeft: "1rem",
                                    marginTop: "auto",
                                    marginBottom: "auto",
                                    marginRight: "0.5rem",
                                }}
                            >
                                Sair do Espaço
                            </Button>
                            : <Button
                                variant="contained"
                                startIcon={<LockIcon/>}
                                onClick={() => this.props.createPrivateSpace()}
                                className="menuButton"
                                sx={{
                                    marginLeft: "1rem",
                                    marginTop: "auto",
                                    marginBottom: "auto"
                                }}
                            >
                                Espaço Privado
                            </Button>
                        }
                    </Box>

                    <Box
                        className="menuContent"
                    >
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
                            this.props._private && this.state.fetched
                            ? <PrivateSpaceMenu ref={this.privateSpaceMenu}
                                                  maxAge={this.state.maxAge}
                                                  rowRefsLength={this.rowRefs.length}
                                                  createFile={this.createFile}/>
                            : null
                        }

                        {
                            this.generateTable()
                        }
                    </Box>
                    </>
                }
            </>
        );
    }
}

FileExplorer.defaultProps = {
    _private: false,
    spaceId: "",
    current_folder: "",
    current_file_name: null,

    ocrTargetIsFolder: false,
    ocrTargetIsSinglePage: false,
    customConfig: null,

    ocrMenu: false,
    layoutMenu: false,
    editingMenu: false,
    // functions:
    createPrivateSpace: null,
    leavePrivateSpace: null,
    setCurrentPath: null,
    returnToParentFolder: null,
    enterOcrMenu: null,
    setCurrentCustomConfig: null,
    enterLayoutMenu: null,
    enterEditingMenu: null,
    exitMenus: null
}

export default FileExplorer;
