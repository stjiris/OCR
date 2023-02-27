import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

export default class FolderRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: props.name,
            info: props.info,
            filesystem: props.filesystem
        }
    }

    updateInfo(info) {
        var key = Object.keys(info)[0];
        this.setState({info: info[key]});
    }

    updateVersions(_) {
        // Do nothing
    }

    folderClicked() {
        this.state.filesystem.enterFolder(this.state.name);
    }

    delete(e) {
        e.stopPropagation();
        this.state.filesystem.deleteItem(this.state.name);
    }

    render() {
        return (
            <TableRow
                sx={{ '&:last-child td, &:last-child th': { border: 0 }, ":hover": {backgroundColor: "#f5f5f5", cursor: 'pointer'} }}
                onClick={() => this.folderClicked()}
            >
                <TableCell sx={{paddingTop: 0, paddingBottom: 0}}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <FolderOpenRoundedIcon color="success" sx={{ fontSize: 30, mr: '0.5rem' }} />
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
                        this.state.info["files/pages"]
                    }
                </TableCell>
                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    -
                </TableCell>
                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    -
                </TableCell>
                <TableCell align='right' sx={{paddingTop: 0, paddingBottom: 0}}>
                    <IconButton
                        color="error"
                        aria-label="delete"
                        onClick={(e) => this.delete(e)}
                    >
                        <DeleteForeverIcon />
                    </IconButton>
                </TableCell>
            </TableRow>
        )
    }
}