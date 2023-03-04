import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import SearchIcon from '@mui/icons-material/Search';

import VersionRow from './VersionRow';

export default class FileRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: props.name,
            info: props.info,
            filesystem: props.filesystem,

            expanded: false,
            versions: props.versions,
            versionsComponents: []
        }

        this.versionRefs = [];
    }

    componentDidMount() {
        this.createVersions();
    }

    createVersions() {
        var versions = this.state.versions;
        var versionsComponents = [];

        for (let i = 0; i < versions.length; i++) {
            var ref = React.createRef();
            this.versionRefs.push(ref);

            var version = versions[i];
            versionsComponents.push(
                <VersionRow
                    ref={ref}
                    key={this.state.name + "_" + version}
                    file={this.state.name}
                    name={version}
                    filesystem={this.state.filesystem}
                    info={this.getInfo(version)}
                />
            );
        }
        this.setState({versionsComponents: versionsComponents});
    }

    updateInfo(info) {
        this.setState({info: info, versionsComponents: []}, this.createVersions);
    }

    updateVersions(versions) {
        this.setState({versions: versions});
    }

    fileClicked() {
        this.setState({expanded: !this.state.expanded});
    }

    getTxt(e) {
        e.stopPropagation();
        this.state.filesystem.getTxt(this.state.name);
    }

    getPdf(e) {
        e.stopPropagation();
        this.state.filesystem.getPdf(this.state.name);
    }

    delete(e) {
        e.stopPropagation();
        this.state.filesystem.deleteItem(this.state.name);
    }

    getInfo(version) {
        var keys = Object.keys(this.state.info);
        for (let i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key.endsWith(version)) {
                return this.state.info[key];
            }
        }
    }

    performOCR(e) {
        e.stopPropagation();
        this.state.filesystem.performOCR(false, this.state.name);
    }

    render() {
        var mainInfo = this.getInfo(this.state.name);
        var style = {}
        if (!this.state.expanded) {
            style = {
                '&:last-child td, &:last-child th': { border: 0 },
                ":hover": {backgroundColor: "#f5f5f5", cursor: 'pointer'}
            }
        } else {
            style = {
                borderBottomLeftRadius: '6px',
                borderBottomRightRadius: '6px',
                borderColor: 'grey',
                ":hover": {backgroundColor: "#f5f5f5", cursor: 'pointer', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px',}
            }
        }
        return (
            <>
                <TableRow
                    sx={style}
                    onClick={() => this.fileClicked()}
                >
                    <TableCell sx={{paddingTop: 0, paddingBottom: 0}}>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                            {
                                this.state.expanded
                                ? <KeyboardArrowDownRoundedIcon color="primary" sx={{ fontSize: 30, mr: '0.5rem' }} />
                                : <KeyboardArrowRightRoundedIcon color="primary" sx={{ fontSize: 30, mr: '0.5rem' }} />
                            }
                            <InsertDriveFileOutlinedIcon color="primary" sx={{ fontSize: 30, mr: '0.5rem' }} />
                            <p>{this.state.name}</p>    
                        </Box>
                    </TableCell>
                    <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                        {
                            mainInfo["creation_date"]
                        }
                    </TableCell>
                    <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                        {
                            mainInfo["last_modified"]
                        }
                    </TableCell>
                    <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                        {
                            mainInfo["files/pages"]
                        }
                    </TableCell>
                    <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                        {
                            mainInfo["size"]
                        }
                    </TableCell>
                    <TableCell align='center' sx={{paddingTop: 0, paddingBottom: 0}}>
                        -
                    </TableCell>
                    <TableCell align='right' sx={{paddingTop: 0, paddingBottom: 0}}>
                        <Box>
                            <IconButton
                                style={{color: "#e5de00"}}
                                aria-label="search"
                                onClick={(e) => this.performOCR(e)}
                            >
                                <SearchIcon />
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
                {
                    this.state.expanded
                    ? this.state.versionsComponents.map((comp) => { return comp; } )
                    : null
                }
            </>
        )
    }
}