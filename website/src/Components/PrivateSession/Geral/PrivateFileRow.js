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
const TooltipIcon = loadComponent('TooltipIcon', 'TooltipIcon');
const OcrIcon = loadComponent('CustomIcons', 'OcrIcon');
const LayoutIcon = loadComponent('CustomIcons', 'LayoutIcon');
const PdfIcon = loadComponent('CustomIcons', 'PdfIcon');
const JsonIcon = loadComponent('CustomIcons', 'JsonIcon');
const ZipIcon = loadComponent('CustomIcons', 'ZipIcon');
const CsvIcon = loadComponent('CustomIcons', 'CsvIcon');
const TxtIcon = loadComponent('CustomIcons', 'TxtIcon');


export default class FileRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: props.name,
            info: props.info,
            expanded: false,
        }

        this.successNot = React.createRef();
    }

    updateInfo(info) {
        if (
            (this.state.info === undefined || this.state.info["ocr"] === undefined || this.state.info["ocr"]["progress"] < this.state.info["pages"]) &&
            (info !== undefined && info["ocr"] !== undefined && info["ocr"]["progress"] >= info["pages"])
        ) {
            this.setState({expanded: true});
        }
        this.setState({info: info});
    }

    fileClicked() {
        this.setState({expanded: !this.state.expanded});
    }

    getOriginalFile(e) {
        e.stopPropagation();
        this.props.getOriginalFile(this.state.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getDelimiterTxt(e) {
        e.stopPropagation();
        this.props.getDelimiterTxt(this.state.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getTxt(e) {
        e.stopPropagation();
        this.props.getTxt(this.state.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getEntities(e) {
        e.stopPropagation();
        this.props.getEntities(this.state.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    requestEntities(e) {
        e.stopPropagation();
        this.props.requestEntities(this.state.name);
        this.successNot.current.setMessage("A obter entidades, por favor aguarde");
        this.successNot.current.open();
    }

    getCSV(e) {
        e.stopPropagation();
        this.props.getCSV(this.state.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getImages(e) {
        e.stopPropagation();
        this.props.getImages(this.state.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getPdf(e) {
        e.stopPropagation();
        this.props.getPdf(this.state.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getPdfSimples(e) {
        e.stopPropagation();
        this.props.getPdfSimples(this.state.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    delete(e) {
        e.stopPropagation();
        this.props.deleteItem(this.state.name);
    }

    editFile(e) {
        e.stopPropagation();
        this.props.editText(this.state.name);
    }

    performOCR(e) {
        e.stopPropagation();
        this.props.performOCR(false, this.state.name);
    }

    indexFile(e) {
        e.stopPropagation();
        this.props.indexFile(this.state.name, false);
    }

    removeIndex(e) {
        e.stopPropagation();
        this.props.removeIndexFile(this.state.name, false);
    }

    createLayout(e) {
        e.stopPropagation();
        this.props.createLayout(this.state.name);
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
                                this.state.info["ocr"] !== undefined && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
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

                            <PdfIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0.2rem' }} />
                            {
                                this.state.info["progress"] === undefined || this.state.info["progress"] === true
                                ? <Button
                                    onClick={(e) => this.getOriginalFile(e)}
                                    style={{
                                        p: 0,
                                        textTransform: 'none',
                                        display: "flex",
                                        textAlign: "left",
                                    }}
                                >
                                    {this.state.name}
                                </Button>
                                : <span>{this.state.name}</span>
                            }
                        </Box>
                    </TableCell>

                    {
                        this.state.info["progress"] !== undefined && this.state.info["progress"] !== true
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

                                    : this.state.info["progress"] !== 100.00
                                        ? <TableCell colSpan={4} align='center' sx={{backgroundColor: '#ffed7a', paddingTop: 1, paddingBottom: 1, borderLeft:"1px solid #aaa"}}>
                                            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                                <span>Carregamento</span>
                                                <Box sx={{ paddingTop: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent:'center' }}>
                                                    <span>{this.state.info["progress"]}%</span>
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
                                this.state.info["ocr"] === undefined || this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                                ? <>
                                    <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa"}}>{this.state.info["creation"]}</TableCell>
                                    <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa"}}>{this.state.info["pages"]} página(s)</TableCell>
                                    <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa"}}>{this.state.info["size"]}</TableCell>
                                </>
                                : this.state.info["ocr"]["exceptions"]
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
                                        key={"OCR " + (buttonsDisabled && this.state.info["ocr"]["exceptions"] === undefined)}
                                        disabled={buttonsDisabled && this.state.info["ocr"]["exceptions"] === undefined}
                                        color="#1976d2"
                                        message="Fazer OCR"
                                        clickFunction={(e) => this.performOCR(e)}
                                        icon={<OcrIcon/>}
                                    />

                                    <TooltipIcon
                                        key={"Layout " + buttonsDisabled}
                                        disabled={buttonsDisabled}
                                        color="#1976d2"
                                        message="Criar Layout"
                                        clickFunction={(e) => this.createLayout(e)}
                                        icon={<LayoutIcon/>}
                                    />

                                    <TooltipIcon
                                        key={"edit " + (buttonsDisabled || this.state.info["ocr"] === undefined)}
                                        color="#1976d2"
                                        message="Editar"
                                        disabled={buttonsDisabled || this.state.info["ocr"] === undefined}
                                        clickFunction={(e) => this.editFile(e)}
                                        icon={<EditIcon/>}
                                    />

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
                    }
                </TableRow>

                {
                    this.state.info !== undefined && this.state.info["pdf"] !== undefined && this.state.info["pdf"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <PdfIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0.2rem' }} />
                                    <Button onClick={(e) => this.getPdf(e)} style={{p: 0, textTransform: 'none'}}>PDF + Texto + Índice</Button>
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
                                <span>{this.state.info["pages"]} página(s) + {this.state.info["pdf"]["pages"] - this.state.info["pages"]} página(s) de índice</span>
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
                    this.state.info !== undefined && this.state.info["pdf_simples"] !== undefined && this.state.info["pdf_simples"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <PdfIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0.2rem' }} />
                                    <Button onClick={(e) => this.getPdfSimples(e)} style={{p: 0, textTransform: 'none'}}>PDF + Texto</Button>
                                </Box>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["pdf_simples"]["creation"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["pdf_simples"]["pages"]} página(s)</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["pdf_simples"]["size"]}</span>
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
                    this.state.info !== undefined && this.state.info["txt"] !== undefined && this.state.info["txt"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <TxtIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0rem' }} />
                                    <Button onClick={(e) => this.getTxt(e)} style={{p: 0, textTransform: 'none'}}>Texto</Button>
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
                    this.state.info !== undefined && this.state.info["delimiter_txt"] !== undefined && this.state.info["delimiter_txt"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <TxtIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0rem' }} />
                                    <Button onClick={(e) => this.getDelimiterTxt(e)} style={{p: 0, textTransform: 'none'}}>Texto com Separador por Página</Button>
                                </Box>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["delimiter_txt"]["creation"]}</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>-</span>
                            </Collapse>
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft: "1px solid #aaa"}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <span>{this.state.info["delimiter_txt"]["size"]}</span>
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
                    this.state.info !== undefined && this.state.info["csv"] !== undefined && this.state.info["csv"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <CsvIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0rem' }} color="primary" />
                                    <Button onClick={(e) => this.getCSV(e)} style={{p: 0, textTransform: 'none'}}>Índice de Palavras</Button>
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
                    this.state.info !== undefined && this.state.info["zip"] !== undefined && this.state.info["zip"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <ZipIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0rem' }} />
                                    <Button onClick={(e) => this.getImages(e)} style={{p: 0, textTransform: 'none'}}>Imagens Extraídas</Button>
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
                    this.state.info !== undefined && this.state.info["ner"] !== undefined && this.state.info["ner"]["complete"] && this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                    ? <TableRow style={{backgroundColor: "#c4dcf4", ...(!this.state.expanded && {display: 'none'})}}>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0}}>
                            <Collapse in={this.state.expanded} timeout="auto" unmountOnExit>
                                <Box sx={{display: "flex", flexDirection: "row", alignItems: 'center'}}>
                                    <JsonIcon sx={{ fontSize: '25px', m: '0.5rem', ml: '0rem' }} />
                                    <Button onClick={(e) => this.getEntities(e)} style={{p: 0, textTransform: 'none'}}>Entidades</Button>
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
            </>
        )
    }
}
