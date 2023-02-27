import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ModeRoundedIcon from '@mui/icons-material/ModeRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';

import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SdStorageIcon from '@mui/icons-material/SdStorage';
import NoSimIcon from '@mui/icons-material/NoSim';

export default class VersionRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            file: props.file,
            name: props.name,
            info: props.info,
            filesystem: props.filesystem
        }
    }

    updateInfo(info) {
        this.setState({info: info});
    }

    edit(e) {
        e.stopPropagation();
        this.state.filesystem.editFile(this.state.file + "/" + this.state.name);
    }

    view(e) {
        e.stopPropagation();
        this.state.filesystem.viewFile(this.state.file + "/" + this.state.name, this.state.info["algorithm"], this.state.info["config"]);
    }

    index(e) {
        e.stopPropagation();
        this.state.filesystem.indexFile(this.state.file + "/" + this.state.name, false);
    }

    removeIndex(e) {
        e.stopPropagation();
        this.state.filesystem.removeIndexFile(this.state.file + "/" + this.state.name, false);
    }

    delete(e) {
        e.stopPropagation();
        this.state.filesystem.deleteItem(this.state.file + "/" + this.state.name);
    }

    download(e) {
        e.stopPropagation();
        this.state.filesystem.downloadFile(this.state.file + "/" + this.state.name);
    }

    render() {
        return (
            <TableRow
                sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    backgroundColor: "#f5f5f5",
                    ":hover": {backgroundColor: "#d9d9d9"},
                }}
            >
                <TableCell sx={{paddingLeft: '3rem', paddingTop: 0, paddingBottom: 0}}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
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
                    -
                </TableCell>
                <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                    -
                </TableCell>
                <TableCell align='right' sx={{paddingTop: 0, paddingBottom: 0}}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-evenly',
                        alignItems: 'center',
                    }}>
                        {
                            this.state.info["progress"] === 100
                            ? <CheckRoundedIcon color="success" sx={{fontSize: 30}}/>
                            : <IconButton sx={{fontSize: 30}}>
                                <AccessTimeIcon sx={{mr: '0.3rem'}} style={{color: "orange"}}/>
                                <span style={{fontSize: '13px'}}><b>{this.state.info["progress"]}%</b></span>
                            </IconButton>
                        }
                        {
                            this.state.info["indexed"]
                            ? <SdStorageIcon color="success" sx={{fontSize: 30}}/>
                            : <NoSimIcon color="error" sx={{fontSize: 30}}/>
                        }
                    </Box>
                </TableCell>
                <TableCell align='right' sx={{paddingTop: 0, paddingBottom: 0}}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'auto auto auto',
                        }}    
                    >
                        <IconButton
                            disabled={!(this.state.info["progress"] === 100)}
                            color="primary"
                            aria-label="download"
                            onClick={(e) => this.download(e)}
                            sx={{p: 0}}
                        >
                            <DownloadRoundedIcon/>
                        </IconButton>

                        <IconButton
                            disabled={!(this.state.info["progress"] === 100)}
                            color="primary"
                            aria-label="edit"
                            onClick={(e) => this.edit(e)}
                            sx={{p: 0}}
                        >
                            <ModeRoundedIcon />
                        </IconButton>

                        <IconButton
                            disabled={!(this.state.info["progress"] === 100) || !this.state.info["indexed"]}
                            color="primary"
                            aria-label="see"
                            onClick={(e) => this.view(e)}
                            sx={{p: 0}}
                        >
                            <VisibilityRoundedIcon />
                        </IconButton>

                        {
                            !this.state.info["indexed"]
                            ? <IconButton
                                disabled={!(this.state.info["progress"] === 100)}
                                color="primary"
                                aria-label="index"
                                onClick={(e) => this.index(e)}
                                sx={{p: 0}}
                            >
                                <SdStorageIcon />
                            </IconButton>

                            : <IconButton
                                disabled={!(this.state.info["progress"] === 100)}
                                color="error"
                                aria-label="no-index"
                                onClick={(e) => this.removeIndex(e)}
                                sx={{p: 0}}
                            >
                                <NoSimIcon />
                            </IconButton>
                        }

                        <IconButton
                            disabled={!(this.state.info["progress"] === 100)}
                            color="error"
                            aria-label="delete"
                            onClick={(e) => this.delete(e)}
                            sx={{p: 0}}
                        >
                            <DeleteForeverIcon />
                        </IconButton>
                    </Box>
                </TableCell>
            </TableRow>
        )
    }
}