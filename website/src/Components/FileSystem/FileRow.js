import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ModeRoundedIcon from '@mui/icons-material/ModeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

export default class FileRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: props.name,
            filesystem: props.filesystem
        }
    }

    fileClicked() {
        this.state.filesystem.editFile(this.state.name);
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
                    -
                </TableCell>
                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    -
                </TableCell>
                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    
                </TableCell>
                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    -
                </TableCell>
                <TableCell align='right' sx={{paddingTop: 0, paddingBottom: 0}}>
                    <Box>
                        <IconButton
                            sx={{mr: '0.1rem'}}
                            color="primary"
                            aria-label="delete"
                            onClick={(e) => this.view(e)}
                        >
                            <VisibilityRoundedIcon />
                        </IconButton>

                        <IconButton
                            sx={{mr: '0.1rem'}}
                            color="primary"
                            aria-label="delete"
                            onClick={(e) => this.edit(e)}
                        >
                            <ModeRoundedIcon />
                        </IconButton>

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