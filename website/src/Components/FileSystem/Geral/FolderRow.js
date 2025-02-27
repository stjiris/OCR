import React from 'react';
import Box from '@mui/material/Box';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import loadComponent from '../../../utils/loadComponents';
const TooltipIcon = loadComponent('TooltipIcon', 'TooltipIcon');

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
                <TableCell sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa"}}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <FolderOpenRoundedIcon color="success" sx={{ p: 0, fontSize: 30, mr: '0.5rem' }} />
                        <span>{this.state.name}</span>
                    </Box>
                </TableCell>

                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa"}}>
                    <span>
                        {this.state.info["creation"]}
                    </span>
                </TableCell>

                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa"}}>-</TableCell>
                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa"}}>-</TableCell>

                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0, borderLeft:"1px solid #aaa"}}>
                    <TooltipIcon
                        color="#f00"
                        message="Apagar"
                        clickFunction={(e) => this.delete(e)}
                        icon={<DeleteForeverIcon/>}
                    />
                </TableCell>
            </TableRow>
        )
    }
}
