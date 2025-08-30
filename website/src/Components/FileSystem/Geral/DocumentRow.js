import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from "@mui/material/IconButton";
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import BorderAllIcon from '@mui/icons-material/BorderAll';
import EditNoteIcon from '@mui/icons-material/EditNote';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

import StaticFileRow from "./StaticFileRow";
import FileIcon from "../../CustomIcons/Geral/FileIcon";
import TooltipIcon from "../../TooltipIcon/Geral/TooltipIcon";
import OcrIcon from "../../CustomIcons/Geral/OcrIcon";
import IconDatabaseOff from "../../Icons/Geral/DatabaseOffIcon";
import IconDatabaseImport from "../../Icons/Geral/DatabaseInIcon";
import PdfIcon from "../../CustomIcons/Geral/PdfIcon";
import TxtIcon from "../../CustomIcons/Geral/TxtIcon";
import CsvIcon from "../../CustomIcons/Geral/CsvIcon";
import JsonIcon from "../../CustomIcons/Geral/JsonIcon";
import AltoIcon from "../../CustomIcons/Geral/AltoIcon";
import ZipIcon from "../../CustomIcons/Geral/ZipIcon";

const loadingStages = new Set(["uploading", "preparing"]);

class DocumentRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            info: props.info,
            expanded: false,
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
        const status = info?.["status"];
        const buttonsDisabled = status.stage !== "waiting" && status.stage !== "post-ocr";
        const uploadIsStuck = info["upload_stuck"] === true;
        return (
            <>
                <TableRow
                    className="explorerRow"
                >
                    <TableCell
                        className="explorerCell nameCell"
                        onClick={() => {
                            if (!loadingStages.has(status.stage))
                                this.setState({expanded: !this.state.expanded})
                        }}
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
                                {this.state.expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                            <FileIcon extension={info["extension"]}/>
                            <span>{this.props.name}</span>
                        </Box>
                    </TableCell>

                    <TableCell className="explorerCell actionsCell" align='center'>
                        <Box className="actionsCell-inner">
                            <TooltipIcon
                                key={"OCR " + this.props.name}
                                disabled={buttonsDisabled && (status.stage !== "error" || uploadIsStuck)}
                                className="actionButton"
                                message="Fazer OCR"
                                clickFunction={(e) => this.performOCR(e, usingCustomConfig)}
                                icon={<OcrIcon/>}
                            />

                            <TooltipIcon
                                key={"Config " + this.props.name}
                                disabled={buttonsDisabled && (status.stage !== "error" || uploadIsStuck)}
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
                                disabled={buttonsDisabled && (status.stage !== "error" || uploadIsStuck)}
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
                                disabled={buttonsDisabled && status.stage !== "error"}
                                key={"Delete " + this.props.name}
                                className="negActionButton"
                                message="Apagar"
                                clickFunction={(e) => this.delete(e)}
                                icon={<DeleteForeverIcon/>}
                            />
                        </Box>
                    </TableCell>

                    {
                        info?.["stored"] === undefined || info["stored"] !== true
                        ? <>
                            {
                                uploadIsStuck
                                    ? <TableCell colSpan={4} className="explorerCell errorCell" align='center'>
                                        <Box>
                                            <span>Erro ao carregar ficheiro</span>
                                        </Box>
                                    </TableCell>

                                    : status.stage === "uploading"
                                        ? <TableCell colSpan={4} className="explorerCell infoCell" align='center'>
                                            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                                <span>{status.message}</span>
                                                <Box sx={{ paddingTop: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent:'center' }}>
                                                    <span>{info["stored"]}%</span>
                                                    <CircularProgress sx={{ml: '1rem'}} size='0.8rem' />
                                                </Box>
                                            </Box>
                                        </TableCell>

                                    : status.stage === "preparing"
                                        ? <TableCell colSpan={4} className="explorerCell infoCell" align='center'>
                                            <Box>
                                                <span>A preparar o documento</span>
                                                <Box sx={{ paddingTop: 1, overflow: 'hidden' }}><CircularProgress size='1rem' /></Box>
                                            </Box>
                                        </TableCell>
                                    : null
                            }
                        </>
                        : <>
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
                            <TableCell className="explorerCell sizeCell" align='center'><span>{info["total_size"]}</span></TableCell>
                        </>
                    }
                </TableRow>

                <StaticFileRow
                    key="original"
                    expanded={this.state.expanded}
                    name={this.props.name + " (original)"}
                    filename={this.props.name}
                    info={info}
                    fileIcon={<FileIcon extension={info["extension"]} />}
                    downloadFile={this.getOriginalFile}
                />

                {info["pdf_indexed"]?.complete
                    ? <StaticFileRow
                        key="pdf_indexed"
                        expanded={this.state.expanded}
                        name={"PDF com texto e índice"}
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
                        name={"Índice de palavras"}
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
