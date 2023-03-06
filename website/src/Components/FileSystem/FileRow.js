import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';

import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

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
                        <p>{this.state.name}</p>    
                    </Box>
                </TableCell>

                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    <Box sx={{display: 'flex', flexDirection: 'column'}}>
                        <span>{this.state.info["pages"]} page(s)</span>
                        <span>{this.state.info['size']}</span>
                    </Box>
                </TableCell>

                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    {
                        this.state.info["creation"]
                    }
                </TableCell>

                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    {
                        this.state.info["ocr"] === undefined
                        ? <Button variant="text" onClick={(e) => this.performOCR(e)}>Fazer</Button>
                        : this.state.info["ocr"]["complete"]
                            ? <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                <Button sx={{p: 0}} variant="text" onClick={(e) => this.editFile(e)}>{this.state.info["ocr"]["creation"]}</Button>
                                <Button sx={{p: 0}} variant="text" onClick={(e) => this.performOCR(e)}>{this.state.info["ocr"]["algorithm"]}</Button>
                                <span>{this.state.info["ocr"]["size"]}</span>
                            </Box>
                            : <p>Em progresso</p>
                    }
                </TableCell>

                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    {
                        this.state.info["txt"] === undefined
                        ? <p>-</p>
                        : this.state.info["txt"]["complete"]
                            ? <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                <span>{this.state.info["txt"]["creation"]}</span>
                                <span>{this.state.info["txt"]["size"]}</span>
                                <Button sx={{p: 0}} variant="text" onClick={(e) => this.getTxt(e)}>Descarregar</Button>
                            </Box>
                            : <p>Em progresso</p>
                    }
                </TableCell>

                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    {
                        this.state.info["pdf"] === undefined
                        ? <p>-</p>
                        : this.state.info["pdf"]["complete"]
                            ? <Box sx={{display: 'flex', flexDirection: 'column'}}>
                                <span>{this.state.info["pdf"]["creation"]}</span>
                                <span>{this.state.info["pdf"]["size"]}</span>
                                <Button sx={{p: 0}} variant="text" onClick={(e) => this.getPdf(e)}>Descarregar</Button>
                            </Box>
                            : <p>Em progresso</p>
                    }
                </TableCell>

                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>-</TableCell>
                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>-</TableCell>

                <TableCell align='right' sx={{paddingTop: 0, paddingBottom: 0}}>
                    <Box>
                        <IconButton
                            color="error"
                            aria-label="delete"
                            onClick={(e) => this.delete(e)}
                        >
                            <DeleteForeverIcon />
                        </IconButton>
                    </Box>
                </TableCell>
            </TableRow>
        )
    }
}