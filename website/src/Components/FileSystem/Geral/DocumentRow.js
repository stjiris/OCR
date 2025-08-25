import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import BorderAllIcon from '@mui/icons-material/BorderAll';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

import calculateEstimatedTime from '../../../utils/waitingTime';
import loadComponent from '../../../utils/loadComponents';
const IconDatabaseImport = loadComponent('Icons', 'DatabaseInIcon');
const IconDatabaseOff = loadComponent('Icons', 'DatabaseOffIcon');
const TooltipIcon = loadComponent('TooltipIcon', 'TooltipIcon');
const FileIcon = loadComponent('CustomIcons', 'FileIcon');
const OcrIcon = loadComponent('CustomIcons', 'OcrIcon');
const LayoutIcon = loadComponent('CustomIcons', 'LayoutIcon');


class DocumentRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            info: props.info,
            expanded: false,
        }
    }

    updateInfo(info) {
        this.setState({info: info});
    }

    documentClicked() {
        // Only open list of document files (original, results) if it has been fully stored
        if (this.state.info?.["stored"] === true) {
            this.props.enterDocument(this.props.name, true);
        }
    }

    getOriginalFile(e) {
        e.stopPropagation();
        this.props.getOriginalFile(this.props.name);
    }

    delete(e) {
        e.stopPropagation();
        this.props.deleteItem(this.props.name);
    }

    editFile(e) {
        e.stopPropagation();
        this.props.editText(this.props.name);
    }

    performOCR(e, usingCustomConfig) {
        e.stopPropagation();
        const customConfig = usingCustomConfig ? this.state.info?.["config"] : null;
        this.props.performOCR(this.props.name, false, this.state.info?.["ocr"] !== undefined, customConfig);
    }

    configureOCR(e, usingCustomConfig) {
        e.stopPropagation();
        const customConfig = usingCustomConfig ? this.state.info?.["config"] : null;
        this.props.configureOCR(this.props.name, false, this.state.info["pages"] === 1, customConfig);
    }

    indexFile(e) {
        e.stopPropagation();
        this.props.indexFile(this.props.name, false);
    }

    removeIndex(e) {
        e.stopPropagation();
        this.props.removeIndexFile(this.props.name, false);
    }

    createLayout(e) {
        e.stopPropagation();
        this.props.createLayout(this.props.name);
    }

    render() {
        const info = this.state.info;
        const usingCustomConfig = info?.["config"] && info["config"] !== "default";
        const status = info?.["status"];
        const buttonsDisabled = !(status.stage === "waiting" || status.stage === "post-ocr");
        return (
            <>
                <TableRow className="explorerRow"
                    sx={{
                        ":hover": (!buttonsDisabled)
                                    ? {backgroundColor: "#f5f5f5", cursor: 'pointer'}
                                    : {}
                    }}
                    onClick={() => { if (!buttonsDisabled) this.documentClicked() }}
                >
                    <TableCell className="explorerCell nameCell">
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <FileIcon extension={info["extension"]}/>
                            <span>{this.props.name}</span>
                        </Box>
                    </TableCell>

                    {
                        info?.["stored"] === undefined || info["stored"] !== true
                        ? <>
                            {
                                info["upload_stuck"] === true
                                    ? <>
                                        <TableCell className="explorerCell actionsCell" align='center'>
                                            <Box>
                                                <TooltipIcon
                                                    key="delete"
                                                    className="negActionButton"
                                                    message="Apagar"
                                                    clickFunction={(e) => this.delete(e)}
                                                    icon={<DeleteForeverIcon/>}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell colSpan={4} className="explorerCell errorCell" align='center'>
                                            <Box>
                                                <span>Erro ao carregar ficheiro</span>
                                            </Box>
                                        </TableCell>
                                    </>

                                    : status.stage === "uploading"
                                        ? <TableCell colSpan={5} className="explorerCell infoCell" align='center'>
                                            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                                <span>{status.message}</span>
                                                <Box sx={{ paddingTop: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent:'center' }}>
                                                    <span>{info["stored"]}%</span>
                                                    <CircularProgress sx={{ml: '1rem'}} size='0.8rem' />
                                                </Box>
                                            </Box>
                                        </TableCell>

                                    : status.stage === "preparing"
                                        ? <TableCell colSpan={5} className="explorerCell infoCell" align='center'>
                                            <Box>
                                                <span>A preparar o documento</span>
                                                <Box sx={{ paddingTop: 1, overflow: 'hidden' }}><CircularProgress size='1rem' /></Box>
                                            </Box>
                                        </TableCell>
                                    : null
                            }
                        </>
                        : <>
                            <TableCell className="explorerCell actionsCell" align='center'>
                                <Box className="actionsCell-inner">
                                    <TooltipIcon
                                        key={"OCR " + this.props.name}
                                        disabled={buttonsDisabled && status.stage !== "error"}
                                        className="actionButton"
                                        message="Fazer OCR"
                                        clickFunction={(e) => this.performOCR(e, usingCustomConfig)}
                                        icon={<OcrIcon/>}
                                    />

                                    <TooltipIcon
                                        key={"Config " + this.props.name}
                                        disabled={buttonsDisabled && status.stage !== "error"}
                                        className={"actionButton"
                                            // highlight custom configs with different color
                                            + (usingCustomConfig
                                                ? " altColor"
                                                : "")}
                                        message="Configurar OCR"
                                        clickFunction={(e) => this.configureOCR(e, usingCustomConfig)}
                                        icon={usingCustomConfig ? <SettingsSuggestIcon/> : <SettingsIcon/>}
                                    />

                                    <TooltipIcon
                                        key={"Layout " + this.props.name}
                                        disabled={buttonsDisabled && status.stage !== "error"}
                                        className="actionButton"
                                        message="Criar Layout"
                                        clickFunction={(e) => this.createLayout(e)}
                                        icon={<BorderAllIcon/>}
                                    />

                                    <TooltipIcon
                                        key={"Edit " + this.props.name}
                                        className="actionButton"
                                        message="Editar Resultados"
                                        disabled={status.stage !== "post-ocr"}
                                        clickFunction={(e) => this.editFile(e)}
                                        icon={<EditNoteIcon/>}
                                    />

                                    {
                                        this.props._private
                                        ? null
                                        : (info?.["indexed"]
                                            ? <TooltipIcon
                                                key={"Remove " + this.props.name}
                                                className="negActionButton"
                                                message="Desindexar"
                                                disabled={status.stage !== "post-ocr"}
                                                clickFunction={(e) => this.removeIndex(e)}
                                                icon={<IconDatabaseOff/>}
                                            />

                                            : <TooltipIcon
                                                key={"Index " + this.props.name}
                                                className="actionButton"
                                                message="Indexar"
                                                disabled={status.stage !== "post-ocr"}
                                                clickFunction={(e) => this.indexFile(e)}
                                                icon={<IconDatabaseImport/>}
                                            />)
                                    }

                                    <TooltipIcon
                                        key={"Delete " + this.props.name}
                                        className="negActionButton"
                                        message="Apagar"
                                        clickFunction={(e) => this.delete(e)}
                                        icon={<DeleteForeverIcon/>}
                                    />
                                </Box>
                            </TableCell>

                            {
                                status.stage === "waiting"
                                    ? <TableCell className="explorerCell stateCell waitingCell" align='center'>
                                        <Box className="stateBox">
                                            <span>Aguarda...</span>
                                        </Box>
                                    </TableCell>

                                : status.stage === "ocr"
                                    ? <TableCell className="explorerCell stateCell infoCell" align='center'>
                                        <Box className="stateBox">
                                            <span>
                                                {info["ocr"]["progress"]}/{info["pages"]}
                                                <CircularProgress sx={{ml: '1rem'}} size='1rem' />
                                                <br />{status.message}
                                            </span>
                                        </Box>
                                    </TableCell>

                                : status.stage === "exporting"
                                    ? <TableCell className="explorerCell stateCell infoCell" align='center'>
                                        <Box className="stateBox">
                                            <span style={{textAlign: "left"}}>
                                                {status.message}
                                                <CircularProgress sx={{ml: '1rem'}} size='1rem' />
                                            </span>
                                        </Box>
                                    </TableCell>

                                : status.stage === "post-ocr"
                                    ? <TableCell className="explorerCell stateCell successCell" align='center'>
                                        <Box className="stateBox">
                                            <span>OCR concluído</span>
                                        </Box>
                                    </TableCell>

                                : status.stage === "error"
                                    ? <TableCell className="explorerCell stateCell errorCell" align='center'>
                                        <Box className="stateBox">
                                            <span>{status.message}</span>
                                        </Box>
                                    </TableCell>

                                : null
                            }

                            <TableCell className="explorerCell dateCreatedCell" align='center'><span>{info["creation"]}</span></TableCell>
                            <TableCell className="explorerCell detailsCell" align='center'><span>{info["pages"]} página(s)</span></TableCell>
                            <TableCell className="explorerCell sizeCell" align='center'><span>{info["size"]}</span></TableCell>
                        </>
                    }
                </TableRow>
            </>
        );
    }
}

DocumentRow.defaultProps = {
    _private: false,
    info: null,
    name: null,
    // functions:
    enterDocument: null,
    getOriginalFile: null,
    getDelimiterTxt: null,
    getTxt: null,
    getEntities: null,
    requestEntities: null,
    getCSV: null,
    getImages: null,
    getPdfIndexed: null,
    getPdfSimple: null,
    deleteItem: null,
    editText: null,
    performOCR: null,
    configureOCR: null,
    indexFile: null,
    removeIndexFile: null,
    createLayout: null
}

export default DocumentRow;
