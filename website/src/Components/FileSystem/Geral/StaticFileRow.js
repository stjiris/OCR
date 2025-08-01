import React from 'react';
import Box from '@mui/material/Box';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import FileDownloadIcon from '@mui/icons-material/FileDownload';

import loadComponent from '../../../utils/loadComponents';
const TooltipIcon = loadComponent('TooltipIcon', 'TooltipIcon');

class StaticFileRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            info: props.info,
        }
    }

    updateInfo(info) {
        if (this.props.type) {
            this.setState({info: info[this.props.type]});
        } else {
            this.setState({info: info});
        }
    }

    render() {
        return (
            <TableRow className="explorerRow">
                <TableCell className="explorerCell staticNameCell">
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        {this.props.fileIcon}
                        <span>{this.props.name}</span>
                    </Box>
                </TableCell>

                <TableCell className="explorerCell staticActionsCell">
                    <Box className="actionsCell-inner">
                        <TooltipIcon
                            className="actionButton"
                            message="Transferir"
                            clickFunction={() => this.props.downloadFile(this.props.filename)}
                            icon={<FileDownloadIcon/>}
                        />
                    </Box>
                </TableCell>

                <TableCell className="explorerCell staticDateCreatedCell">
                    <span>
                        {this.state.info["creation"]}
                    </span>
                </TableCell>

                <TableCell className="explorerCell staticDetailsCell">
                    <span>
                        {this.state.info["pages"]
                            ? this.state.info["pages"] + " página(s)"
                            : "—"
                        }
                    </span>
                </TableCell>

                <TableCell className="explorerCell staticSizeCell">
                    <span>
                        {this.state.info["size"]}
                    </span>
                </TableCell>
            </TableRow>
        );
    }
}

StaticFileRow.defaultProps = {
    info: null,
    name: null,
    filename: null,
    type: null,
    fileIcon: null,
    // functions:
    downloadFile: null,
}

export default StaticFileRow;
