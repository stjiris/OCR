import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ModeRoundedIcon from '@mui/icons-material/ModeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';

import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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
        if (this.state.name.includes("J4"))
            console.log(info)
        this.setState({info: info});
    }

    fileClicked() {
        this.state.filesystem.editFile(this.state.name);
    }

    getTxt(e) {
        e.stopPropagation();
        this.state.filesystem.getTxt(this.state.name);
    }

    edit(e) {
        e.stopPropagation();
        this.state.filesystem.editFile(this.state.name);
    }

    view(e) {
        e.stopPropagation();
        this.state.filesystem.viewFile(this.state.name);
    }

    delete(e) {
        e.stopPropagation();
        this.state.filesystem.deleteItem(this.state.name);
    }

    render() {
        return (
            <TableRow
                sx={{ '&:last-child td, &:last-child th': { border: 0 }, ":hover": {backgroundColor: "#f5f5f5"} }}
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
                    {
                        this.state.info["creation_date"]
                    }
                </TableCell>
                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    {
                        this.state.info["last_modified"]
                    }
                </TableCell>
                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    {
                        this.state.info["number_of_files"]
                    }
                </TableCell>
                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    {
                        this.state.info["size"]
                    }
                </TableCell>
                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    {
                        this.state.info["progress"] === 100
                        ? <CheckRoundedIcon color="success" sx={{fontSize: 30}}/>
                        : <IconButton sx={{fontSize: 30}}>
                            <AccessTimeIcon sx={{mr: '0.3rem'}} style={{color: "orange"}}/>
                            <p style={{fontSize: '13px'}}><b>{this.state.info["progress"]}%</b></p>
                        </IconButton>
                    }
                </TableCell>
                <TableCell align='right' sx={{paddingTop: 0, paddingBottom: 0}}>
                    <Box>
                        <IconButton
                            disabled={!(this.state.info["progress"] === 100)}
                            color="primary"
                            sx={{mr: '0.1rem'}}
                            aria-label="delete"
                            onClick={(e) => this.getTxt(e)}
                        >
                            <DownloadRoundedIcon/>
                            {
                                this.state.info["progress"] === 100
                                ? <p style={{fontSize: '13px', color: 'black'}}>TXT</p>
                                : <p style={{fontSize: '13px', color: 'grey'}}>TXT</p>
                            }
                        </IconButton>
                        <IconButton
                            disabled={!(this.state.info["progress"] === 100)}
                            sx={{mr: '0.1rem'}}
                            color="primary"
                            aria-label="delete"
                            onClick={(e) => this.view(e)}
                        >
                            <VisibilityRoundedIcon />
                        </IconButton>

                        <IconButton
                            disabled={!(this.state.info["progress"] === 100)}
                            sx={{mr: '0.1rem'}}
                            color="primary"
                            aria-label="delete"
                            onClick={(e) => this.edit(e)}
                        >
                            <ModeRoundedIcon />
                        </IconButton>

                        <IconButton
                            disabled={!(this.state.info["progress"] === 100)}
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