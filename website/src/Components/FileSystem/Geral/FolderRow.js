import React from 'react';
import Box from '@mui/material/Box';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import loadComponent from '../../../utils/loadComponents';
const TooltipIcon = loadComponent('TooltipIcon', 'TooltipIcon');

class FolderRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            info: props.info,
        }
    }

    updateInfo(info) {
        this.setState({info: info});
    }

    folderClicked() {
        this.props.enterFolder(this.props.name);
    }

    delete(e) {
        e.stopPropagation();
        this.props.deleteItem(this.props.name);
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
                        <span>{this.props.name}</span>
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

FolderRow.defaultProps = {
    info: null,
    name: null,
    // functions:
    enterFolder: null,
    deleteItem: null
}

export default FolderRow;
