import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
// import IconButton from '@mui/material/IconButton';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
// import EditIcon from '@mui/icons-material/Edit';

import calculateEstimatedTime from '../../utils/waitingTime';

export default class PrivateFileRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: props.name,
            info: props.info,
            filesystem: props.filesystem
        }
    }

    updateInfo(info) {
        this.setState({info: info, versionsComponents: []});
    }

    updateVersions(versions) {
        this.setState({versions: versions});
    }

    getOriginalFile(e) {
        e.stopPropagation();
        this.state.filesystem.getOriginalFile(this.state.name);
    }

    getTxt(e) {
        e.stopPropagation();
        this.state.filesystem.getTxt(this.state.name);
    }

    getPdf(e) {
        e.stopPropagation();
        this.state.filesystem.getPdf(this.state.name);
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

    render() {
        return (
            <>
                <TableRow>
                    <TableCell sx={{paddingTop: 0, paddingBottom: 0}}>
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
                    </TableCell>

                    {
                        this.state.info["progress"] !== undefined && this.state.info["progress"] !== true
                        ? <>
                            <TableCell align='center' sx={{backgroundColor: '#ffed7a', paddingTop: 1, paddingBottom: 1, borderLeft:"1px solid #d9d9d9"}}>
                                {
                                    this.state.info["progress"] !== 100.00
                                    ? <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                        <span>Carregamento</span>
                                        <Box sx={{ paddingTop: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent:'space-evenly' }}>
                                            <span>{this.state.info["progress"]}%</span>
                                            <CircularProgress size='0.8rem' />
                                        </Box>
                                    </Box>
                                    : <Box>
                                        <span>A juntar páginas</span>
                                        <Box sx={{ paddingTop: 1, overflow: 'hidden' }}><CircularProgress size='1rem' /></Box>
                                    </Box>

                                }
                            </TableCell>
                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}></TableCell>
                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}></TableCell>
                        </>
                        : <>
                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                    <span>{this.state.info["pages"]} página(s)</span>
                                    <span>{this.state.info['size']}</span>
                                </Box>
                            </TableCell>

                            <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                {
                                    this.state.info["creation"]
                                }
                            </TableCell>
                            
                            { 
                                this.state.info["ocr"] === undefined || this.state.info["ocr"]["progress"] === this.state.info["pages"] ? 
                                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9", height: '100%'}}>
                                {
                                    this.state.info["ocr"] === undefined
                                    ? <Button variant="text" onClick={(e) => this.performOCR(e)}>Fazer</Button>
                                    : 
                                    <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                        <span>{this.state.info["ocr"]["creation"]}</span>
                                        <Button sx={{p: 0}} variant="text" onClick={(e) => this.performOCR(e)}>Refazer OCR</Button>
                                        <span>{this.state.info["ocr"]["size"]}</span>
                                    </Box>
                                } 
                                </TableCell>
                                :
                                <TableCell align='center' sx={{backgroundColor: '#ffed7a', paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9", height: '100%'}}>
                                    <Box sx={{overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent:'space-evenly' }}>
                                        <span>{this.state.info["ocr"]["progress"]}/{this.state.info["pages"]} ({calculateEstimatedTime(this.state.info["ocr"]["progress"], this.state.info["pages"])}min)</span>
                                        <CircularProgress size='1rem' />
                                    </Box>                             
                                </TableCell>
                            }

                            {/* <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                                <Box>

                                    <IconButton
                                        disabled={this.state.info["ocr"] === undefined || this.state.info["ocr"]["progress"] !== this.state.info["pages"]}
                                        color="primary"
                                        aria-label="edit"
                                        onClick={(e) => this.editFile(e)}
                                    >
                                        <EditIcon />
                                    </IconButton>

                                </Box>
                            </TableCell> */}
                        </>
                    }
                </TableRow>

                {
                    this.state.info["txt"] !== undefined && this.state.info["txt"]["complete"]
                    ? <TableRow>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                            <Button
                                onClick={(e) => this.getTxt(e)}
                                style={{
                                    p: 0,
                                    textTransform: 'none',
                                    display: "flex",
                                    textAlign: "left",
                                }}
                            >
                                {this.state.name.split(".").splice(0, this.state.name.split(".").length-1) + "_ocr.txt"}
                            </Button>
                        </TableCell>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                            <span>{this.state.info["txt"]["size"]}</span>
                        </TableCell>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                            <span>{this.state.info["txt"]["creation"]}</span>
                        </TableCell>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>
                        {/* <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell> */}
                    </TableRow>
                    : null
                }

                {
                    this.state.info["pdf"] !== undefined && this.state.info["pdf"]["complete"]
                    ? <TableRow>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                            <Button
                                onClick={(e) => this.getPdf(e)}
                                style={{
                                    p: 0,
                                    textTransform: 'none',
                                    display: "flex",
                                    textAlign: "left",
                                }}
                            >
                                {this.state.name.split(".").splice(0, this.state.name.split(".").length-1) + "_ocr.pdf"}
                            </Button>
                        </TableCell>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                            <span>{this.state.info["pdf"]["size"]}</span>
                        </TableCell>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                            <span>{this.state.info["pdf"]["creation"]}</span>
                        </TableCell>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>
                        {/* <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell> */}
                    </TableRow>
                    : null
                }
            </>
        )
    }
}
