import React from 'react';
import Box from '@mui/material/Box';
import Button from "@mui/material/Button";

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

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
            <TableRow
                className="staticFileRow"
                sx={{
                    display: this.props.expanded ? "table-row" : "none",
                }}
            >
                <TableCell className="explorerCell staticNameCell" align='left'>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <Button
                            onClick={() => this.props.downloadFile(this.props.filename)}
                            variant="text"
                            sx={{
                                textTransform: "none",
                                padding: 0,
                                lineHeight: 0.75,
                            }}
                        >
                            {this.props.fileIcon}
                            <span>{this.props.name}</span>
                        </Button>
                    </Box>
                </TableCell>

                <TableCell className="explorerCell actionsCell" align='center' />
                <TableCell className="explorerCell stateCell" align='center' />

                <TableCell className="explorerCell staticDateCreatedCell" align='center'>
                    <span>
                        {this.state.info["creation"]}
                    </span>
                </TableCell>

                <TableCell className="explorerCell staticDetailsCell" align='center'>
                    <span>
                        {this.state.info["pages"]
                            ? this.state.info["pages"] + " página(s)"
                            : "—"
                        }
                    </span>
                </TableCell>

                <TableCell className="explorerCell staticSizeCell" align='right'>
                    <span>
                        {this.state.info["size"]}
                    </span>
                </TableCell>
            </TableRow>
        );
    }
}

StaticFileRow.defaultProps = {
    expanded: false,
    info: null,
    name: null,
    filename: null,
    type: null,
    fileIcon: null,
    // functions:
    downloadFile: null,
}

export default StaticFileRow;
