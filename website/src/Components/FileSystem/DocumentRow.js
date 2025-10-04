import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import DoneIcon from '@mui/icons-material/Done';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import BorderAllIcon from '@mui/icons-material/BorderAll';
import BorderClearIcon from '@mui/icons-material/BorderClear';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

import FileIcon from 'Components/CustomIcons/FileIcon';
import OcrIcon from 'Components/CustomIcons/OcrIcon';
import IconDatabaseOff from 'Components/Icons/DatabaseOffIcon';
import IconDatabaseImport from 'Components/Icons/DatabaseInIcon';
import PdfIcon from 'Components/CustomIcons/PdfIcon';
import TxtIcon from 'Components/CustomIcons/TxtIcon';
import CsvIcon from 'Components/CustomIcons/CsvIcon';
import JsonIcon from 'Components/CustomIcons/JsonIcon';
import AltoIcon from 'Components/CustomIcons/AltoIcon';
import ZipIcon from 'Components/CustomIcons/ZipIcon';
import StaticFileRow from './StaticFileRow';

const loadingStages = new Set(["uploading", "preparing"]);

const BASE_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_BASENAME}`;

class DocumentRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            info: props.info,
            expanded: false,
            contextMenu: null,
        }
        this.getOriginalFile = this.getOriginalFile.bind(this);
        this.getTxt = this.getTxt.bind(this);
        this.getDelimiterTxt = this.getDelimiterTxt.bind(this);
        this.getCSV = this.getCSV.bind(this);
        this.getPdfIndexed = this.getPdfIndexed.bind(this);
        this.getPdfSimple = this.getPdfSimple.bind(this);
        this.getEntities = this.getEntities.bind(this);
        this.getAlto = this.getAlto.bind(this);
        this.getHocr = this.getHocr.bind(this);
        this.getImages = this.getImages.bind(this);
    }

    updateInfo(info) {
        if (this.state.info?.["status"]?.stage !== "post-ocr" && info?.["status"]?.stage === "post-ocr") {
            this.setState({info: info, expanded: true});
        } else {
            this.setState({info: info});
        }
    }

    /*
    documentClicked() {
        // Only open list of document files (original, results) if it has been fully stored
        if (this.state.info?.["stored"] === true) {
            this.props.enterDocument(this.props.name, true);
        }
    }
    */

    handleOptionsClick(event) {
        this.setState({
                contextMenu:
                    this.state.contextMenu === null
                        ? {
                            anchorEl: event.currentTarget
                        }
                        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                          // Other native context menus might behave different.
                          // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                        null
            },
        );
    }

    handleContextMenu(event) {
        event.preventDefault();

        this.setState({
                contextMenu:
                    this.state.contextMenu === null
                        ? {
                            mouseX: event.clientX + 2,
                            mouseY: event.clientY - 6,
                        }
                        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                          // Other native context menus might behave different.
                          // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                        null
            },
        );

        // Prevent text selection lost after opening the context menu on Safari and Firefox
        const selection = document.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);

            setTimeout(() => {
                selection.addRange(range);
            });
        }
    };

    handleCloseContextMenu() {
        this.setState({contextMenu: null});
    }

    getOriginalFile() {
        this.props.getOriginalFile(this.props.name);
    }


    /**
     * Export the .txt file
     */
    getTxt(file) {
        this.props.getDocument("txt", file, "txt");
    }

    /**
     * Export the .txt file
     * with the delimiter
     */
    getDelimiterTxt(file) {
        this.props.getDocument("txt_delimited", file, "txt", "_delimitado");
    }

    /**
     * Export the .csv file
     */
    getCSV(file) {
        this.props.getDocument("csv", file, "csv");
    }

    /**
     * Export the .pdf file
     */
    getPdfIndexed(file) {
        this.props.getDocument("pdf_indexed", file, "pdf", "_texto_indice");
    }

    /**
     * Export the .pdf file
     */
    getPdfSimple(file) {
        this.props.getDocument("pdf", file, "pdf", "_texto");
    }

    /**
     * Export the entities list
     */
    getEntities(file) {
        this.props.getEntities(file);
    }

    /**
     * Export the ALTO .xml file
     */
    getAlto(file) {
        this.props.getDocument("alto", file, "xml", "_alto");
    }

    /**
     * Export the .hocr file
     */
    getHocr(file) {
        this.props.getDocument("hocr", file, "hocr", "");
    }

    /**
     * Export the images ZIP
     */
    getImages(file) {
        this.props.getImages(file);
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
        const hasLayoutBoxes = info?.["has_layout"];
        const status = info?.["status"];
        const buttonsDisabled = status.stage !== "waiting" && status.stage !== "post-ocr";
        const uploadIsStuck = info["upload_stuck"] === true;
        return (
            <>
                <Menu
                    open={this.state.contextMenu !== null}
                    onClose={() => this.handleCloseContextMenu()}
                    anchorReference={this.state.contextMenu?.anchorEl ? "anchorEl" : "anchorPosition"}
                    anchorEl={this.state.contextMenu?.anchorEl}
                    anchorPosition={
                        this.state.contextMenu?.mouseY
                            ? { top: this.state.contextMenu.mouseY, left: this.state.contextMenu.mouseX }
                            : undefined
                    }
                    sx={{overflow: "visible"}}
                    slotProps={{
                        list: {sx: {display: "flex", flexDirection: "row"}}
                    }}
                >

                <Box sx={{display: "flex", flexDirection: "column"}}>
                    <MenuItem
                        disabled={buttonsDisabled && (status.stage !== "error" || uploadIsStuck)}
                        onClick={(e) => this.performOCR(e, usingCustomConfig)}
                    >
                        <IconButton className="actionButton">
                            <OcrIcon />
                        </IconButton>
                        &nbsp;Fazer OCR
                    </MenuItem>

                    <MenuItem
                        disabled={buttonsDisabled && (status.stage !== "error" || uploadIsStuck)}
                        onClick={(e) => this.configureOCR(e, usingCustomConfig)}
                    >
                        <IconButton
                            className={"actionButton"
                                // highlight custom configs with different color
                                + (usingCustomConfig
                                    ? " altColor"
                                    : "")}
                            >
                            {usingCustomConfig ? <SettingsSuggestIcon /> : <SettingsIcon />}
                        </IconButton>
                        &nbsp;{usingCustomConfig ? "Editar Configuração" : "Configurar OCR"}
                    </MenuItem>

                    <MenuItem
                        disabled={buttonsDisabled && (status.stage !== "error" || uploadIsStuck)}
                        onClick={(e) => this.createLayout(e)}
                    >
                        <IconButton
                            className={"actionButton"
                                // highlight defined layout boxes with different color
                                + (hasLayoutBoxes
                                    ? " altColor"
                                    : "")}
                            >
                            {hasLayoutBoxes ? <BorderAllIcon /> : <BorderClearIcon />}
                        </IconButton>
                        &nbsp;{hasLayoutBoxes ? "Alterar Segmentação" : "Definir Segmentação"}
                    </MenuItem>

                    <MenuItem
                        disabled={status.stage !== "post-ocr"}
                        onClick={(e) => this.editFile(e)}
                    >
                        <IconButton className="actionButton">
                            <EditNoteIcon />
                        </IconButton>
                        &nbsp;Editar Resultados
                    </MenuItem>

                    {
                        true || this.props._private  // FIXME: Remove "true ||" to re-enable indexing
                            ? null
                            : (info?.["indexed"]
                                ? <MenuItem
                                    disabled={status.stage !== "post-ocr"}
                                    onClick={(e) => this.removeIndex(e)}
                                >
                                    <IconButton className="negActionButton">
                                        <IconDatabaseOff />
                                    </IconButton>
                                    &nbsp;Desindexar
                                </MenuItem>

                                : <MenuItem
                                    disabled={status.stage !== "post-ocr"}
                                    onClick={(e) => this.indexFile(e)}
                                >
                                    <IconButton className="actionButton">
                                        <IconDatabaseImport />
                                    </IconButton>
                                    &nbsp;Indexar
                                </MenuItem>)
                    }

                    <MenuItem
                        disabled={buttonsDisabled && status.stage !== "error"}
                        onClick={(e) => this.delete(e)}
                    >
                        <IconButton className="negActionButton">
                            <DeleteForeverIcon />
                        </IconButton>
                        &nbsp;Apagar
                    </MenuItem>
                    </Box>

                    <Box sx={{width: "14rem", paddingRight: "10px"}}>
                        <img
                            src={`${BASE_URL}/${this.props._private ? 'private' : 'images'}/${this.props.thumbnails.large}`}
                            alt=""
                            style={{width: "inherit", border: "1px solid black"}}
                        />
                    </Box>
                </Menu>

                <TableRow
                    className={"explorerRow" + (this.state.contextMenu ? " targeted" : "")}
                    onContextMenu={(e) => this.handleContextMenu(e)}
                    sx={{ cursor: loadingStages.has(status.stage) ? "progress" : "context-menu" }}
                >
                    <TableCell className="explorerCell optionsCell">
                        <IconButton
                            aria-label={"Opções para " + this.props.name}
                            onClick={(e) => this.handleOptionsClick(e)}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    </TableCell>

                    <TableCell
                        className="explorerCell thumbnailCell"
                        align="left"
                        sx={{ cursor: loadingStages.has(status.stage) ? "progress" : "pointer" }}
                    >
                        {loadingStages.has(status.stage)
                            ? <CircularProgress sx={{ml: '1rem', mr: '1rem', flexShrink: "0"}} size='1rem'/>
                            : <img
                                src={`${BASE_URL}/${this.props._private ? 'private' : 'images'}/${this.props.thumbnails.small}`}
                                alt=""
                                onClick={(e) => this.handleOptionsClick(e)}
                                style={{border: "1px solid black", maxWidth: "100%", maxHeight: "100%"}}
                            />
                        }
                    </TableCell>

                    <TableCell
                        className="explorerCell nameCell"
                        align="left"
                        onClick={() => {
                            if (!loadingStages.has(status.stage))
                                this.setState({expanded: !this.state.expanded})
                        }}
                        sx={{ cursor: loadingStages.has(status.stage) ? "progress" : "pointer" }}
                    >
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            <IconButton
                                aria-label="expandir"
                                size="small"
                                loading={loadingStages.has(status.stage)}
                                disableRipple
                            >
                                {this.state.expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                            <span>{this.props.name}</span>
                        </Box>
                    </TableCell>

                    <TableCell className="explorerCell detailsCell" align='left'>
                        <span>
                            {info["pages"] ? (info["pages"] + " página(s)") : null}
                            {info["words"] ? ("\n" + info["words"] + " palavras") : null}
                        </span>
                    </TableCell>

                    <TableCell className="explorerCell sizeCell" align='right'>
                        <span style={{fontSize: "0.92rem"}}>
                            {info["total_size"]}
                        </span>
                    </TableCell>

                    <TableCell className="explorerCell dateCreatedCell" align='right'>
                        <p style={{margin: 0}}>{info["creation"]}</p>
                        {info["ocr"]?.["creation"]
                            ? <p style={{margin: 0}}>OCR: {info["ocr"]["creation"]}</p>
                            : null
                        }
                    </TableCell>

                    { info?.["stored"] === undefined || info["stored"] !== true
                    ? uploadIsStuck
                        ? <TableCell className="explorerCell stateCell errorCell" align='left'>
                            <Box className="stateBox">
                                <span>Erro ao carregar documento</span>
                            </Box>
                        </TableCell>

                        : status.stage === "uploading"
                            ? <TableCell className="explorerCell stateCell infoCell" align='left'>
                                <Box className="stateBox">
                                    <CircularProgress sx={{ml: '1rem', mr: '1rem', flexShrink: "0"}} size='1rem'/>
                                    <span>{status.message}</span>
                                </Box>
                            </TableCell>

                        : status.stage === "preparing"
                            ? <TableCell className="explorerCell stateCell infoCell" align='left'>
                                <Box className="stateBox">
                                    <CircularProgress sx={{ml: '1rem', mr: '1rem', flexShrink: "0"}} size='1rem'/>
                                    <span>{status.message}</span>
                                </Box>
                            </TableCell>
                        : null

                    : status.stage === "error"
                        ? <TableCell className="explorerCell stateCell errorCell" align='left'>
                            <Box className="stateBox">
                                <span>{status.message}</span>
                            </Box>
                        </TableCell>

                    : status.stage === "waiting"
                    ? <TableCell className="explorerCell stateCell waitingCell" align='left'>
                        <Box className="stateBox">
                        </Box>
                    </TableCell>

                    : status.stage === "ocr"
                    ? <TableCell className="explorerCell stateCell infoCell" align='left'>
                        <Box className="stateBox">
                            <CircularProgress sx={{ml: '1rem', mr: '1rem', flexShrink: "0"}} size='1rem' />
                            <span>OCR</span>
                            &nbsp;
                            <span>{info["ocr"]["progress"]}/{info["pages"]}</span>
                            &nbsp;
                            &nbsp;
                            <span>
                            { /* message is expected to be time estimate */
                                status.message
                            }
                            </span>
                        </Box>
                    </TableCell>

                    : status.stage === "exporting"
                    ? <TableCell className="explorerCell stateCell infoCell" align='left'>
                        <Box className="stateBox">
                            <CircularProgress sx={{ml: '1rem', mr: '1rem', flexShrink: "0"}} size='1rem' />
                            <span>{status.message}</span>
                        </Box>
                    </TableCell>

                    : info["edited_results"]  // expected stage when this is true is "post-ocr" so much be checked before
                        ? <TableCell className="explorerCell stateCell infoCell" align='left'>
                            <Box className="stateBox">
                                Resultados editados, ficheiros por recriar
                            </Box>
                        </TableCell>

                    : status.stage === "post-ocr"
                    ? <TableCell className="explorerCell stateCell successCell" align='left'>
                        <Box className="stateBox">
                            <DoneIcon color="primary" />
                        </Box>
                    </TableCell>

                    : null
                    }
                </TableRow>

                <StaticFileRow
                    key="original"
                    expanded={this.state.expanded}
                    name="Doc. original"
                    filename={this.props.name}
                    info={info}
                    fileIcon={<FileIcon extension={info["extension"].toLowerCase()} />}
                    downloadFile={this.getOriginalFile}
                />

                {info["pdf_indexed"]?.complete
                    ? <StaticFileRow
                        key="pdf_indexed"
                        expanded={this.state.expanded}
                        name={"PDF com texto e índice de palavras"}
                        filename={this.props.name}
                        type="pdf_indexed"
                        info={info["pdf_indexed"]}
                        fileIcon={<PdfIcon />}
                        downloadFile={this.getPdfIndexed}
                    /> : null
                }
                {info["pdf"]?.complete
                    ? <StaticFileRow
                        key="pdf"
                        expanded={this.state.expanded}
                        name={"PDF com texto"}
                        filename={this.props.name}
                        type="pdf"
                        info={info["pdf"]}
                        fileIcon={<PdfIcon />}
                        downloadFile={this.getPdfSimple}
                    /> : null
                }
                {info["txt"]?.complete
                    ? <StaticFileRow
                        key="txt"
                        expanded={this.state.expanded}
                        name={"Texto"}
                        filename={this.props.name}
                        type="txt"
                        info={info["txt"]}
                        fileIcon={<TxtIcon />}
                        downloadFile={this.getTxt}
                    /> : null
                }
                {info["txt_delimited"]?.complete
                    ? <StaticFileRow
                        key="txt_delimited"
                        expanded={this.state.expanded}
                        name={"Texto com separadores de páginas"}
                        filename={this.props.name}
                        type="txt_delimited"
                        info={info["txt_delimited"]}
                        fileIcon={<TxtIcon />}
                        downloadFile={this.getDelimiterTxt}
                    /> : null
                }
                {info["csv"]?.complete
                    ? <StaticFileRow
                        key="csv"
                        expanded={this.state.expanded}
                        name={"Índice de palavras em formato CSV"}
                        filename={this.props.name}
                        type="csv"
                        info={info["csv"]}
                        fileIcon={<CsvIcon />}
                        downloadFile={this.getCSV}
                    /> : null
                }
                {info["ner"]?.complete
                    ? <StaticFileRow
                        key="ner"
                        expanded={this.state.expanded}
                        name={"Entidades"}
                        filename={this.props.name}
                        type="ner"
                        info={info["ner"]}
                        fileIcon={<JsonIcon />}
                        downloadFile={this.getEntities}
                    /> : null
                }
                {info["hocr"]?.complete
                    ? <StaticFileRow
                        key="hocr"
                        expanded={this.state.expanded}
                        name={"hOCR"}
                        filename={this.props.name}
                        type="hocr"
                        info={info["hocr"]}
                        fileIcon={<AltoIcon />}
                        downloadFile={this.getHocr}
                    /> : null
                }
                {info["xml"]?.complete
                    ? <StaticFileRow
                        key="xml"
                        expanded={this.state.expanded}
                        name={"ALTO"}
                        filename={this.props.name}
                        type="xml"
                        info={info["xml"]}
                        fileIcon={<AltoIcon />}
                        downloadFile={this.getAlto}
                    /> : null
                }
                {info["zip"]?.complete
                    ? <StaticFileRow
                        key="zip"
                        expanded={this.state.expanded}
                        name={"Imagens extraídas"}
                        filename={this.props.name}
                        type="zip"
                        info={info["zip"]}
                        fileIcon={<ZipIcon />}
                        downloadFile={this.getImages}
                    /> : null
                }
            </>
        );
    }
}

DocumentRow.defaultProps = {
    _private: false,
    info: null,
    name: null,
    thumbnails: null,
    // functions:
    enterDocument: null,
    getOriginalFile: null,
    getDocument: null,
    getEntities: null,
    requestEntities: null,  // TODO: currently not used; expected to implement requesting entities from existing OCR results
    getImages: null,
    deleteItem: null,
    editText: null,
    performOCR: null,
    configureOCR: null,
    indexFile: null,
    removeIndexFile: null,
    createLayout: null
}

export default DocumentRow;
