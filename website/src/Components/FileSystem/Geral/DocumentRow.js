import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';

import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
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
        const buttonsDisabled = !(this.state.info["ocr"] === undefined || this.state.info["ocr"]["progress"] >= this.state.info["pages"])
        const usingCustomConfig = this.state.info?.["config"] && this.state.info["config"] !== "useDefault";
        return (
            <>
                <TableRow className="explorerRow"
                    sx={{":hover": {backgroundColor: "#f5f5f5", cursor: 'pointer'} }}
                    onClick={() => { if (!buttonsDisabled) this.documentClicked() }}
                >
                    <TableCell className="explorerCell nameCell">
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <FileIcon extension={this.state.info["extension"]}/>
                            <span>{this.props.name}</span>
                        </Box>
                    </TableCell>

                    {
                        this.state.info?.["stored"] === undefined || this.state.info["stored"] !== true
                        ? <>
                            {
                                this.state.info["upload_stuck"] === true
                                    ? <>
                                        <TableCell className="explorerCell actionsCell" align='center'>
                                            <Box>
                                                <TooltipIcon
                                                    key="delete"
                                                    color="#f00"
                                                    message="Apagar"
                                                    clickFunction={(e) => this.delete(e)}
                                                    icon={<DeleteForeverIcon/>}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell colSpan={3} className="explorerCell errorCell" align='center'>
                                            <Box>
                                                <span>Erro ao carregar ficheiro</span>
                                            </Box>
                                        </TableCell>
                                    </>

                                    : this.state.info["stored"] !== 100.00
                                        ? <TableCell colSpan={4} className="explorerCell infoCell" align='center'>
                                            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                                <span>Carregamento</span>
                                                <Box sx={{ paddingTop: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent:'center' }}>
                                                    <span>{this.state.info["stored"]}%</span>
                                                    <CircularProgress sx={{ml: '1rem'}} size='0.8rem' />
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        : <TableCell colSpan={4} className="explorerCell infoCell" align='center'>
                                            <Box>
                                                <span>A preparar o documento</span>
                                                <Box sx={{ paddingTop: 1, overflow: 'hidden' }}><CircularProgress size='1rem' /></Box>
                                            </Box>
                                        </TableCell>
                            }
                        </>
                        : <>
                            <TableCell className="explorerCell actionsCell" align='center'>
                                <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                    <TooltipIcon
                                        key={"OCR " + this.props.name}
                                        disabled={buttonsDisabled && this.state.info["ocr"]["exceptions"] === undefined}
                                        className="actionButton"
                                        message="Fazer OCR"
                                        clickFunction={(e) => this.performOCR(e, usingCustomConfig)}
                                        icon={<OcrIcon/>}
                                    />

                                    <TooltipIcon
                                        key={"Config " + this.props.name}
                                        disabled={buttonsDisabled && this.state.info["ocr"]["exceptions"] === undefined}
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
                                        disabled={buttonsDisabled && this.state.info["ocr"]["exceptions"] === undefined}
                                        className="actionButton"
                                        message="Criar Layout"
                                        clickFunction={(e) => this.createLayout(e)}
                                        icon={<LayoutIcon/>}
                                    />

                                    <TooltipIcon
                                        key={"Edit " + this.props.name}
                                        className="actionButton"
                                        message="Editar"
                                        disabled={buttonsDisabled || this.state.info["ocr"] === undefined}
                                        clickFunction={(e) => this.editFile(e)}
                                        icon={<EditIcon/>}
                                    />

                                    {
                                        this.props._private
                                        ? null
                                        : (this.state.info?.["indexed"]
                                            ? <TooltipIcon
                                                key={"Remove " + this.props.name}
                                                className="negActionButton"
                                                message="Desindexar"
                                                disabled={buttonsDisabled || this.state.info?.["ocr"] === undefined}
                                                clickFunction={(e) => this.removeIndex(e)}
                                                icon={<IconDatabaseOff/>}
                                            />

                                            : <TooltipIcon
                                                key={"Index " + this.props.name}
                                                className="actionButton"
                                                message="Indexar"
                                                disabled={buttonsDisabled || this.state.info?.["ocr"] === undefined}
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
                                this.state.info?.["ocr"] === undefined || this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                                ? <>
                                    <TableCell className="explorerCell dateCreatedCell" align='center'><span>{this.state.info["creation"]}</span></TableCell>
                                    <TableCell className="explorerCell detailsCell" align='center'><span>{this.state.info["pages"]} página(s)</span></TableCell>
                                    <TableCell className="explorerCell sizeCell" align='center'><span>{this.state.info["size"]}</span></TableCell>
                                </>
                                : this.state.info?.["ocr"]["exceptions"]
                                    ? <TableCell colSpan={3} className="explorerCell errorCell" align='center'>
                                        <Box sx={{overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent:'space-evenly' }}>
                                            <span>Erro ao fazer OCR</span>
                                        </Box>
                                    </TableCell>
                                    : <TableCell colSpan={3} className="explorerCell infoCell" align='center'>
                                        <Box sx={{overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent:'center' }}>
                                            <span>{this.state.info["ocr"]["progress"]}/{this.state.info["pages"]} ({calculateEstimatedTime(this.state.info["ocr"]["progress"], this.state.info["pages"])}min)</span>
                                            <CircularProgress sx={{ml: '1rem'}} size='1rem' />
                                        </Box>
                                    </TableCell>
                            }
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
    indexFile: null,
    removeIndexFile: null,
    createLayout: null
}

export default DocumentRow;
