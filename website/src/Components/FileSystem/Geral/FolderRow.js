<<<<<<< HEAD:website/src/Components/FileSystem/Geral/FolderRow.js
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
            filesystem: props.filesystem,
            current_folder: props.current_folder,
        }
    }

    updateInfo(info) {
        this.setState({info: info});
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
                sx={{":hover": {backgroundColor: "#f5f5f5", cursor: 'pointer'} }}
                onClick={() => this.folderClicked()}
            >
                <TableCell sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <FolderOpenRoundedIcon color="success" sx={{ fontSize: 30, mr: '0.5rem' }} />
                        <p>{this.state.name}</p>
                    </Box>
                </TableCell>

                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                    {this.state.info["creation"]}
                </TableCell>

                {this.state.current_folder.length > 1 && <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>}
                {this.state.current_folder.length > 1 && <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>}
                {this.state.current_folder.length > 1 && <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>}
                {this.state.current_folder.length > 1 && <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>}

                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
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
=======
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
            filesystem: props.filesystem,
            current_folder: props.current_folder,
        }
    }

    updateInfo(info) {
        this.setState({info: info});
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
                sx={{":hover": {backgroundColor: "#f5f5f5", cursor: 'pointer'} }}
                onClick={() => this.folderClicked()}
            >
                <TableCell sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <FolderOpenRoundedIcon color="success" sx={{ fontSize: 30, mr: '0.5rem' }} />
                        <p>{this.state.name}</p>
                    </Box>
                </TableCell>

                {/* {this.state.current_folder.length > 1 &&  <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>} */}

                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
                    {this.state.info["creation"]}
                </TableCell>

                {this.state.current_folder.length > 1 && <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>}
                {this.state.current_folder.length > 1 && <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>}
                {this.state.current_folder.length > 1 && <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>}
                {this.state.current_folder.length > 1 && <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>}
                {/* <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell>
                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>-</TableCell> */}

                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #d9d9d9"}}>
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
>>>>>>> de62c3c (Add index as a downloadable csv):website/src/Components/FileSystem/FolderRow.js
