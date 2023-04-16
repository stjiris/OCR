import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';

import IconDatabaseOff from '../Icons/DatabaseOffIcon';
import IconDatabaseImport from '../Icons/DatabaseInIcon';

import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';

export default class FileRow extends React.Component {
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

    fileClicked() {
        this.setState({expanded: !this.state.expanded});
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
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                            {
                                this.state.info["progress"] !== 100.00
                                ? <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                    <span>Carregamento</span>
                                    <span>{this.state.info["progress"]}%</span>
                                </Box>
                                : <span>A juntar páginas</span>

                            }
                        </TableCell>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}></TableCell>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}></TableCell>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}></TableCell>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}></TableCell>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}></TableCell>
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

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                            {
                                this.state.info["ocr"] === undefined
                                ? <Button variant="text" onClick={(e) => this.performOCR(e)}>Fazer</Button>
                                : this.state.info["ocr"]["progress"] === this.state.info["pages"]
                                    ? <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                        <span>{this.state.info["ocr"]["creation"]}</span>
                                        <Button sx={{p: 0}} variant="text" onClick={(e) => this.performOCR(e)}>Refazer OCR</Button>
                                        <span>{this.state.info["ocr"]["size"]}</span>
                                    </Box>
                                    : <Box sx={{ paddingTop: 2, paddingBottom: 2, overflow: 'hidden' }}>
                                        <span>{this.state.info["ocr"]["progress"]}/{this.state.info["pages"]}</span>
                                    </Box>
                            }
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                            {
                                this.state.info["txt"] === undefined
                                ? <p>-</p>
                                : this.state.info["txt"]["complete"]
                                    ? <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                        <span>{this.state.info["txt"]["creation"]}</span>
                                        <Button sx={{p: 0}} variant="text" onClick={(e) => this.getTxt(e)}>Descarregar</Button>
                                        <span>{this.state.info["txt"]["size"]}</span>
                                    </Box>
                                    : <Box sx={{ paddingTop: 2, paddingBottom: 2, overflow: 'hidden' }}><CircularProgress /></Box>
                            }
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                            {
                                this.state.info["pdf"] === undefined
                                ? <p>-</p>
                                : this.state.info["pdf"]["complete"]
                                    ? <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                        <span>{this.state.info["pdf"]["creation"]}</span>
                                        <Button sx={{p: 0}} variant="text" onClick={(e) => this.getPdf(e)}>Descarregar</Button>
                                        <span>{this.state.info["pdf"]["size"]}</span>
                                    </Box>
                                    : <Box sx={{ paddingTop: 2, paddingBottom: 2, overflow: 'hidden' }}><CircularProgress /></Box>
                            }
                        </TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>
                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>

                        <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                            <Box>

                                <IconButton
                                    disabled={this.state.info["ocr"] === undefined || !this.state.info["ocr"]["complete"]}
                                    color="primary"
                                    aria-label="edit"
                                    onClick={(e) => this.editFile(e)}
                                >
                                    <EditIcon />
                                </IconButton>

                                {
                                    this.state.info["indexed"]
                                    ? <IconButton
                                        disabled={this.state.info["ocr"] === undefined || !this.state.info["ocr"]["complete"]}
                                        color="error"
                                        aria-label="remove-database"
                                        onClick={(e) => this.removeIndex(e)}
                                    >
                                        <IconDatabaseOff />
                                    </IconButton>
                                    : <IconButton
                                        disabled={this.state.info["ocr"] === undefined || !this.state.info["ocr"]["complete"]}
                                        color="primary"
                                        aria-label="add-database"
                                        onClick={(e) => this.indexFile(e)}
                                    >
                                        <IconDatabaseImport />
                                    </IconButton>
                                }

                                <IconButton
                                    color="error"
                                    aria-label="delete"
                                    onClick={(e) => this.delete(e)}
                                >
                                    <DeleteForeverIcon />
                                </IconButton>

                            </Box>
                        </TableCell>
                    </>
                }
            </TableRow>
        )
    }
}
