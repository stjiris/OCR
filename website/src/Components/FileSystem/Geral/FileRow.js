import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';

import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';

import loadComponent from '../../../utils/loadComponents';
import calculateEstimatedTime from '../../../utils/waitingTime';


export default class FileRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: props.name,
            info: props.info,
            filesystem: props.filesystem
        }

        this.successNot = React.createRef();
    }

    updateInfo(info) {
        this.setState({info: info, versionsComponents: []});
    }

    updateVersions(versions) {
        this.setState({versions: versions});
    }

    fileClicked() {
        this.setState({expanded: !this.state.expanded});
    }

    getOriginalFile(e) {
        e.stopPropagation();
        this.state.filesystem.getOriginalFile(this.state.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getTxt(e) {
        e.stopPropagation();
        this.state.filesystem.getTxt(this.state.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getEntities(e) {
        e.stopPropagation();
        this.state.filesystem.getEntities(this.state.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    requestEntities(e) {
        e.stopPropagation();
        this.state.filesystem.requestEntities(this.state.name);
        this.successNot.current.setMessage("A obter entidades, por favor aguarde");
        this.successNot.current.open();
    }

    getCSV(e) {
        e.stopPropagation();
        this.state.filesystem.getCSV(this.state.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    getPdf(e) {
        e.stopPropagation();
        this.state.filesystem.getPdf(this.state.name);
        this.successNot.current.setMessage("A transferência do ficheiro começou, por favor aguarde");
        this.successNot.current.open();
    }

    delete(e) {
        e.stopPropagation();
        this.state.filesystem.deleteItem(this.state.name);
    }

    editFile(e) {
        e.stopPropagation();
        this.state.filesystem.editFile(this.state.name);
    }

    performOCR(e) {
        e.stopPropagation();
        this.state.filesystem.performOCR(false, this.state.name);
    }

    indexFile(e) {
        e.stopPropagation();
        this.state.filesystem.indexFile(this.state.name, false);
    }

    removeIndex(e) {
        e.stopPropagation();
        this.state.filesystem.removeIndexFile(this.state.name, false);
    }

    createLayout(e) {
        e.stopPropagation();
        this.state.filesystem.createLayout(this.state.name);
    }

    render() {
        const Notification = loadComponent('Notification', 'Notifications');
        const IconDatabaseImport = loadComponent('Icons', 'DatabaseInIcon');
        const IconDatabaseOff = loadComponent('Icons', 'DatabaseOffIcon');
        const TooltipIcon = loadComponent('TooltipIcon', 'TooltipIcon');

        const buttonsDisabled = this.state.info["ocr"] === undefined || this.state.info["ocr"]["progress"] !== this.state.info["pages"];

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
                            <InsertDriveFileOutlinedIcon color="primary" sx={{ fontSize: 30, mr: '0.5rem' }} />
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
                                    ? <TableCell align='center' sx={{backgroundColor: '#f44336', paddingTop: 1, paddingBottom: 1, borderLeft:"1px solid #d9d9d9"}}>
                                        <Box>
                                            <span>Erro ao carregar ficheiro</span>
                                        </Box>
                                    </TableCell>

                                    : this.state.info["progress"] !== 100.00
                                        ? <TableCell align='center' sx={{backgroundColor: '#ffed7a', paddingTop: 1, paddingBottom: 1, borderLeft:"1px solid #d9d9d9"}}>
                                            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                                <span>Carregamento</span>
                                                <Box sx={{ paddingTop: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent:'space-evenly' }}>
                                                    <span>{this.state.info["progress"]}%</span>
                                                    <CircularProgress size='0.8rem' />
                                                </Box>
                                            </Box>
                                        </TableCell>

                                        : <TableCell align='center' sx={{backgroundColor: '#ffed7a', paddingTop: 1, paddingBottom: 1, borderLeft:"1px solid #d9d9d9"}}>
                                            <Box>
                                                <span>A preparar o documento</span>
                                                <Box sx={{ paddingTop: 1, overflow: 'hidden' }}><CircularProgress size='1rem' /></Box>
                                            </Box>
                                        </TableCell>
                            }
                            
                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}></TableCell>
                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}></TableCell>
                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}></TableCell>
                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}></TableCell>
                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}></TableCell>
                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
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

                        : <>
                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                    <span>{this.state.info["creation"]}</span>
                                    <span>{this.state.info["pages"]} página(s)</span>
                                    <span>{this.state.info['size']}</span>
                                    <Button sx={{p: 0}} variant="text" onClick={(e) => this.createLayout(e)}>Criar Layout</Button>
                                </Box>
                            </TableCell>
                            
                            { 
                                this.state.info["ocr"] === undefined || this.state.info["ocr"]["progress"] >= this.state.info["pages"]
                                ? <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9", height: '100%'}}>
                                    {
                                        this.state.info["ocr"] === undefined
                                        ? <Button variant="text" onClick={(e) => this.performOCR(e)}>Fazer</Button>
                                        : 
                                        <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                            <span>{this.state.info["ocr"]["creation"]}</span>
                                            <Button sx={{p: 0}} variant="text" onClick={(e) => this.performOCR(e)}>Refazer OCR</Button>
                                        </Box>
                                    } 
                                </TableCell>

                                : this.state.info["ocr"]["exceptions"]
                                    ? <TableCell align='center' sx={{backgroundColor: '#f44336', paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9", height: '100%'}}>
                                        <Box sx={{overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent:'space-evenly' }}>
                                            <span>Erro ao fazer OCR</span>
                                            <Button sx={{p: 0}} variant="text" onClick={(e) => this.performOCR(e)}>Refazer OCR</Button>
                                        </Box>                             
                                    </TableCell>
                                    : <TableCell align='center' sx={{backgroundColor: '#ffed7a', paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9", height: '100%'}}>
                                        <Box sx={{overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent:'space-evenly' }}>
                                            <span>{this.state.info["ocr"]["progress"]}/{this.state.info["pages"]} ({calculateEstimatedTime(this.state.info["ocr"]["progress"], this.state.info["pages"])}min)</span>
                                            <CircularProgress size='1rem' />
                                        </Box>                             
                                    </TableCell>
                            }

                            {   
                                this.state.info["txt"] === undefined || this.state.info["ocr"]["progress"] !== this.state.info["pages"]
                                    ? <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                        <p>-</p>
                                    </TableCell>
                                    : <>
                                        {
                                            this.state.info["txt"]["complete"] ?
                                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                                <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                                    <span>{this.state.info["txt"]["creation"]}</span>
                                                    <span>{this.state.info["txt"]["size"]}</span>
                                                    <Button sx={{p: 0}} variant="text" onClick={(e) => this.getTxt(e)}>Descarregar</Button>
                                                </Box>
                                            </TableCell> :
                                            <TableCell align='center' sx={{backgroundColor: '#ffed7a', paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                                <Box sx={{ paddingTop: 2, paddingBottom: 2, overflow: 'hidden' }}><CircularProgress size='2rem'/></Box>
                                            </TableCell>                        
                                        }
                                    </>                          
                            }

                            {   
                                this.state.info["ner"] === undefined || this.state.info["ocr"]["progress"] !== this.state.info["pages"]
                                    ? <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                        <p>-</p>
                                    </TableCell>
                                    : <>
                                        {
                                            this.state.info["ner"]["error"]
                                            ? <TableCell align='center' sx={{backgroundColor: '#f44336', paddingTop: 1, paddingBottom: 1, borderLeft:"1px solid #d9d9d9"}}>
                                                <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                                    <span>Erro ao obter as entidades. Tente mais tarde</span>
                                                    <Button sx={{p: 0}} variant="text" onClick={(e) => this.requestEntities(e)}>Voltar a tentar</Button>
                                                </Box>
                                            </TableCell>

                                            : this.state.info["ner"]["complete"]
                                                ? <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                                    <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                                        <span>{this.state.info["ner"]["creation"]}</span>
                                                        <span>{this.state.info["ner"]["size"]}</span>
                                                        <Button sx={{p: 0}} variant="text" onClick={(e) => this.getEntities(e)}>Descarregar</Button>
                                                    </Box>
                                                </TableCell>
                                                : <TableCell align='center' sx={{backgroundColor: '#ffed7a', paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                                    <Box sx={{ paddingTop: 2, paddingBottom: 2, overflow: 'hidden' }}><CircularProgress size='2rem'/></Box>
                                                </TableCell>                        
                                        }
                                    </>                          
                            }

                            {   
                                this.state.info["csv"] === undefined || this.state.info["ocr"]["progress"] !== this.state.info["pages"] ?
                                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                    <p>-</p>
                                </TableCell> :
                                <>{
                                    this.state.info["csv"]["complete"] ?
                                    <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                        <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                            <span>{this.state.info["csv"]["creation"]}</span>
                                            <span>{this.state.info["csv"]["size"]}</span>
                                            <Button sx={{p: 0}} variant="text" onClick={(e) => this.getCSV(e)}>Descarregar</Button>
                                        </Box>
                                    </TableCell> :
                                    <TableCell align='center' sx={{backgroundColor: '#ffed7a', paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                        <Box sx={{ paddingTop: 2, paddingBottom: 2, overflow: 'hidden' }}><CircularProgress size='2rem'/></Box>
                                    </TableCell>                        
                                }</>                          
                            }

                            {
                                this.state.info["pdf"] === undefined || this.state.info["ocr"]["progress"] !== this.state.info["pages"]
                                    ? <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                        <p>-</p>
                                    </TableCell>
                                    : <>
                                        {
                                            this.state.info["pdf"]["complete"] ?
                                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                            <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                                    <span>{this.state.info["pdf"]["creation"]}</span>
                                                    <span>{this.state.info["pages"]} página(s) + {this.state.info["pdf"]["pages"] - this.state.info["pages"]} página(s) de índice</span>
                                                    <span>{this.state.info["pdf"]["size"]}</span>
                                                    <Button sx={{p: 0}} variant="text" onClick={(e) => this.getPdf(e)}>Descarregar</Button>
                                                </Box>
                                            </TableCell> :
                                            <TableCell align='center' sx={{backgroundColor: '#ffed7a', paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                                <Box sx={{ paddingTop: 2, paddingBottom: 2, overflow: 'hidden' }}><CircularProgress size='2rem'/></Box>
                                            </TableCell> 
                                        }
                                    </>
                            }

                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                    <TooltipIcon
                                        key={"edit " + buttonsDisabled}
                                        color="#1976d2"
                                        message="Editar"
                                        disabled={buttonsDisabled}
                                        clickFunction={(e) => this.editFile(e)}
                                        icon={<EditIcon/>}
                                    />
                                    
                                    {
                                        this.state.info["indexed"]
                                            ? <TooltipIcon
                                                key={"remove " + buttonsDisabled}
                                                color="#f00"
                                                message="Desindexar"
                                                disabled={buttonsDisabled}
                                                clickFunction={(e) => this.removeIndex(e)}
                                                icon={<IconDatabaseOff/>}
                                            />
                                            
                                            : <TooltipIcon
                                                key={"add " + buttonsDisabled}
                                                color="#1976d2"
                                                message="Indexar"
                                                disabled={buttonsDisabled}
                                                clickFunction={(e) => this.indexFile(e)}
                                                icon={<IconDatabaseImport/>}
                                            />
                                    }

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
            </>
        )
    }
}
