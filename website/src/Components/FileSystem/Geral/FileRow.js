import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';

import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

import { IconButton } from '@mui/material';

import calculateEstimatedTime from '../../../utils/waitingTime';
import loadComponent from '../../../utils/loadComponents';
const Notification = loadComponent('Notification', 'Notifications');
const IconDatabaseImport = loadComponent('Icons', 'DatabaseInIcon');
const IconDatabaseOff = loadComponent('Icons', 'DatabaseOffIcon');
const TooltipIcon = loadComponent('TooltipIcon', 'TooltipIcon');
const FileIcon = loadComponent('CustomIcons', 'FileIcon');
const OcrIcon = loadComponent('CustomIcons', 'OcrIcon');
const LayoutIcon = loadComponent('CustomIcons', 'LayoutIcon');
const PdfIcon = loadComponent('CustomIcons', 'PdfIcon');
const JsonIcon = loadComponent('CustomIcons', 'JsonIcon');
const ZipIcon = loadComponent('CustomIcons', 'ZipIcon');
const CsvIcon = loadComponent('CustomIcons', 'CsvIcon');
const TxtIcon = loadComponent('CustomIcons', 'TxtIcon');
const AltoIcon = loadComponent('CustomIcons', 'AltoIcon');


class FileRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            info: props.info,
            expanded: false,
        }

        this.successNot = React.createRef();
    }

    updateInfo(info) {
        // Auto-expand file row if OCR status was not performed/concluded and became concluded
        if ((this.state.info === undefined || this.state.info["ocr"] === undefined || this.state.info["ocr"]["progress"] < this.state.info["pages"])
            && (info !== undefined && info["ocr"] !== undefined && info["ocr"]["progress"] >= info["pages"])) {
            this.setState({info: info, expanded: true});
        } else {
            this.setState({info: info});
        }
    }

    fileClicked() {
        this.setState({expanded: !this.state.expanded});
    }

    getOriginalFile(e) {
        e.stopPropagation();
        this.props.getOriginalFile(this.props.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getDelimiterTxt(e) {
        e.stopPropagation();
        this.props.getDelimiterTxt(this.props.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getTxt(e) {
        e.stopPropagation();
        this.props.getTxt(this.props.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getEntities(e) {
        e.stopPropagation();
        this.props.getEntities(this.props.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    requestEntities(e) {
        e.stopPropagation();
        this.props.requestEntities(this.props.name);
        this.successNot.current.setMessage("A obter entidades, por favor aguarde");
        this.successNot.current.open();
    }

    getCSV(e) {
        e.stopPropagation();
        this.props.getCSV(this.props.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getImages(e) {
        e.stopPropagation();
        this.props.getImages(this.props.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getPdfIndexed(e) {
        e.stopPropagation();
        this.props.getPdfIndexed(this.props.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getPdfSimple(e) {
        e.stopPropagation();
        this.props.getPdfSimple(this.props.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getHocr(e) {
        e.stopPropagation();
        this.props.getHocr(this.props.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getAlto(e) {
        e.stopPropagation();
        this.props.getAlto(this.props.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    delete(e) {
        e.stopPropagation();
        this.props.deleteItem(this.props.name);
    }

    editFile(e) {
        e.stopPropagation();
        this.props.editText(this.props.name);
    }

    performOCR(e) {
        e.stopPropagation();
        this.props.performOCR(this.props.name, false);
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

        return (
            <>
                <Notification message={""} severity={"success"} ref={this.successNot}/>

                <TableRow
                    onClick={() => this.fileClicked()}
                >
                    <TableCell sx={{paddingTop: 0, paddingBottom: 0}}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>

                            {
                                this.state.info?.["ocr"] !== undefined && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                                ? <IconButton
                                    onClick={() => this.setState({expanded: !this.state.expanded})}
                                    sx={{p: 0, color: '#1976d2', mr: '0.5rem'}}
                                >
                                    {this.state.expanded ? <KeyboardArrowUpRoundedIcon/> : <KeyboardArrowDownRoundedIcon/>}
                                </IconButton>
                                : <IconButton
                                    disabled
                                    sx={{p: 0, color: '#fff', mr: '0.5rem'}}
                                >
                                    <KeyboardArrowDownRoundedIcon/>
                                </IconButton>
                            }

                            <FileIcon extension={this.state.info["extension"]} sx={{ fontSize: '25px', m: "0.5rem 0.5rem 0.5rem 0.2rem"  /* 0.2rem left */ }} />
                            {
                                this.state.info?.["stored"] === undefined || this.state.info["stored"] === true
                                ? <Button
                                    onClick={(e) => this.getOriginalFile(e)}
                                    sx={{
                                        p: 0,
                                        textTransform: 'none',
                                        display: "flex",
                                        textAlign: "left",
                                    }}
                                >
                                    {this.props.name}
                                </Button>
                                : <span>{this.props.name}</span>
                            }
                        </Box>
                    </TableCell>

                    {
                        this.state.info?.["stored"] !== undefined && this.state.info["stored"] !== true
                        ? <>
                            {
                                this.state.info["upload_stuck"] === true
                                    ? <>
                                        <TableCell colSpan={3} align='center' sx={{backgroundColor: '#f44336', paddingTop: 1, paddingBottom: 1, borderLeft:"1px solid #aaa"}}>
                                            <Box>
                                                <span>Erro ao carregar ficheiro</span>
                                            </Box>
                                        </TableCell>
                                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa"}}>
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
                                    </>

                                    : this.state.info["stored"] !== 100.00
                                        ? <TableCell colSpan={4} align='center' sx={{backgroundColor: '#ffed7a', paddingTop: 1, paddingBottom: 1, borderLeft:"1px solid #aaa"}}>
                                            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                                <span>Carregamento</span>
                                                <Box sx={{ paddingTop: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent:'center' }}>
                                                    <span>{this.state.info["stored"]}%</span>
                                                    <CircularProgress sx={{ml: '1rem'}} size='0.8rem' />
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        : <TableCell colSpan={4} align='center' sx={{backgroundColor: '#ffed7a', paddingTop: 1, paddingBottom: 1, borderLeft:"1px solid #aaa"}}>
                                            <Box>
                                                <span>A preparar o documento</span>
                                                <Box sx={{ paddingTop: 1, overflow: 'hidden' }}><CircularProgress size='1rem' /></Box>
                                            </Box>
                                        </TableCell>
                            }
                        </>
                        : <>
                            {
                                this.state.info?.["ocr"] === undefined || this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                                ? <>
                                    <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa"}}>{this.state.info["creation"]}</TableCell>
                                    <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa"}}>{this.state.info["pages"]} página(s)</TableCell>
                                    <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa"}}>{this.state.info["size"]}</TableCell>
                                </>
                                : this.state.info?.["ocr"]["exceptions"]
                                    ? <TableCell colSpan={3} align='center' sx={{backgroundColor: '#f44336', paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa", height: '100%'}}>
                                        <Box sx={{overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent:'space-evenly' }}>
                                            <span>Erro ao fazer OCR</span>
                                        </Box>
                                    </TableCell>
                                    : <TableCell colSpan={3} align='center' sx={{backgroundColor: '#ffed7a', paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa", height: '100%'}}>
                                        <Box sx={{overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent:'center' }}>
                                            <span>{this.state.info["ocr"]["progress"]}/{this.state.info["pages"]} ({calculateEstimatedTime(this.state.info["ocr"]["progress"], this.state.info["pages"])}min)</span>
                                            <CircularProgress sx={{ml: '1rem'}} size='1rem' />
                                        </Box>
                                    </TableCell>
                            }
                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa"}}>
                                <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                    <TooltipIcon
                                        key={"OCR " + this.props.name}
                                        disabled={buttonsDisabled && this.state.info["ocr"]["exceptions"] === undefined}
                                        color="#1976d2"
                                        message="Fazer OCR"
                                        clickFunction={(e) => this.performOCR(e)}
                                        icon={<OcrIcon/>}
                                    />

                                    <TooltipIcon
                                        key={"Layout " + this.props.name}
                                        disabled={buttonsDisabled && this.state.info["ocr"]["exceptions"] === undefined}
                                        color="#1976d2"
                                        message="Criar Layout"
                                        clickFunction={(e) => this.createLayout(e)}
                                        icon={<LayoutIcon/>}
                                    />

                                    <TooltipIcon
                                        key={"Edit " + this.props.name}
                                        color="#1976d2"
                                        message="Editar"
                                        disabled={buttonsDisabled || this.state.info["ocr"] === undefined}
                                        clickFunction={(e) => this.editFile(e)}
                                        icon={<EditIcon/>}
                                    />

                                    {
                                        this.props._private ?
                                            null
                                        : (this.state.info?.["indexed"]
                                            ? <TooltipIcon
                                                key={"Remove " + this.props.name}
                                                color="#f00"
                                                message="Desindexar"
                                                disabled={buttonsDisabled || this.state.info?.["ocr"] === undefined}
                                                clickFunction={(e) => this.removeIndex(e)}
                                                icon={<IconDatabaseOff/>}
                                            />

                                            : <TooltipIcon
                                                key={"Index " + this.props.name}
                                                color="#1976d2"
                                                message="Indexar"
                                                disabled={buttonsDisabled || this.state.info?.["ocr"] === undefined}
                                                clickFunction={(e) => this.indexFile(e)}
                                                icon={<IconDatabaseImport/>}
                                            />)
                                    }

                                    <TooltipIcon
                                        key={"Delete " + this.props.name}
                                        color="#f00"
                                        message="Apagar"
                                        clickFunction={(e) => this.delete(e)}
                                        icon={<DeleteForeverIcon/>}
                                    />

                                </Box>
                            </TableCell>
                        </>
                    }
                </TableRow>

                {
                    this.state.info?.["pdf_indexed"] !== undefined && this.state.info["pdf_indexed"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <PdfIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0.2rem' }} />
                                    <Button onClick={(e) => this.getPdfIndexed(e)} className="resultButton">PDF + Texto + Índice</Button>
                                </Box>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["pdf_indexed"]["creation"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["pages"]} página(s) + {this.state.info["pdf_indexed"]["pages"] - this.state.info["pages"]} página(s) de índice</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["pdf_indexed"]["size"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>
                    </TableRow>
                    : null
                }

                {
                    this.state.info?.["pdf"] !== undefined && this.state.info["pdf"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <PdfIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0.2rem' }} />
                                    <Button onClick={(e) => this.getPdfSimple(e)} className="resultButton">PDF + Texto</Button>
                                </Box>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["pdf"]["creation"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["pdf"]["pages"]} página(s)</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["pdf"]["size"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>
                    </TableRow>
                    : null
                }

                {
                    this.state.info?.["txt"] !== undefined && this.state.info["txt"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <TxtIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0rem' }} />
                                    <Button onClick={(e) => this.getTxt(e)} className="resultButton">Texto</Button>
                                </Box>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["txt"]["creation"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["txt"]["size"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>
                    </TableRow>
                    : null
                }

                {
                    this.state.info?.["txt_delimited"] !== undefined && this.state.info["txt_delimited"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <TxtIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0rem' }} />
                                    <Button onClick={(e) => this.getDelimiterTxt(e)} className="resultButton">Texto com Separador por Página</Button>
                                </Box>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["txt_delimited"]["creation"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["txt_delimited"]["size"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>
                    </TableRow>
                    : null
                }

                {
                    this.state.info?.["csv"] !== undefined && this.state.info["csv"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <CsvIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0rem' }} color="primary" />
                                    <Button onClick={(e) => this.getCSV(e)} className="resultButton">Índice de Palavras</Button>
                                </Box>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["csv"]["creation"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["csv"]["size"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>
                    </TableRow>
                    : null
                }

                {
                    this.state.info?.["zip"] !== undefined && this.state.info["zip"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <ZipIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0rem' }} />
                                    <Button onClick={(e) => this.getImages(e)} sx={{p: 0, textTransform: 'none'}}>Imagens Extraídas</Button>
                                </Box>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["zip"]["creation"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["zip"]["size"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>
                    </TableRow>
                    : null
                }

                {
                    this.state.info?.["ner"] !== undefined && this.state.info["ner"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <JsonIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0rem' }} />
                                    <Button onClick={(e) => this.getEntities(e)} className="resultButton">Entidades</Button>
                                </Box>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["ner"]["creation"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["ner"]["size"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>
                    </TableRow>
                    : null
                }

                {
                    this.state.info?.["hocr"] !== undefined && this.state.info["hocr"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                        ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                                <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                    <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                        <AltoIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0rem' }} />
                                        <Button onClick={(e) => this.getHocr(e)} className="resultButton">hOCR</Button>
                                    </Box>
                                </Collapse>
                            </TableCell>

                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                                <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                    <span>{this.state.info["hocr"]["creation"]}</span>
                                </Collapse>
                            </TableCell>

                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                                <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                    <span>-</span>
                                </Collapse>
                            </TableCell>

                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                                <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                    <span>{this.state.info["hocr"]["size"]}</span>
                                </Collapse>
                            </TableCell>

                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                                <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                    <span>-</span>
                                </Collapse>
                            </TableCell>
                        </TableRow>
                        : null
                }

                {
                    this.state.info?.["xml"] !== undefined && this.state.info["xml"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <AltoIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0rem' }} />
                                    <Button onClick={(e) => this.getAlto(e)} className="resultButton">ALTO</Button>
                                </Box>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["xml"]["creation"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["xml"]["size"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>
                    </TableRow>
                    : null
                }
            </>
        );
    }
}

FileRow.defaultProps = {
    _private: false,
    info: null,
    name: null,
    // functions:
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

export default FileRow;
