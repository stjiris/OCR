import React from 'react';
import Box from '@mui/material/Box';
import Button from "@mui/material/Button";

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

class StaticFileRow extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <TableRow
                className="staticFileRow"
                sx={{
                    display: this.props.expanded ? "table-row" : "none",
                }}
            >
                <TableCell scope="column" className="explorerCell optionsCell" />

                <TableCell scope="column" className="explorerCell thumbnailCell" />

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

                <TableCell className="explorerCell detailsCell" align='left'>
                    <span>
                        {this.props.info["pages"]
                            ? this.props.info["pages"] + " página(s)"
                            : "—"
                        }
                    </span>
                </TableCell>

                <TableCell className="explorerCell sizeCell" align='right'>
                    <span style={{fontSize: "0.92rem"}}>
                        {this.props.info["size"]}
                    </span>
                </TableCell>

                <TableCell className="explorerCell dateCreatedCell" align='right'>
                    <span>
                        {this.props.info["creation"]}
                    </span>
                </TableCell>

                <TableCell className="explorerCell stateCell" align='center' />
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
