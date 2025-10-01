import React from 'react';
import Box from '@mui/material/Box';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import MoreVertIcon from "@mui/icons-material/MoreVert";

import OcrIcon from 'Components/CustomIcons/OcrIcon';

class FolderRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            info: props.info,
            contextMenu: null,
        }
    }

    updateInfo(info) {
        this.setState({info: info});
    }

    handleOptionsClick(event) {
        this.setState({
                contextMenu:
                    this.state.contextMenu === null
                        ? {
                            anchorEl: event.currentTarget
                        }
                        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                          // Other native context menus might behave different.
                          // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                        null
            },
        );
    }

    handleContextMenu(event) {
        event.preventDefault();

        this.setState({
                contextMenu:
                    this.state.contextMenu === null
                        ? {
                            mouseX: event.clientX + 2,
                            mouseY: event.clientY - 6,
                        }
                        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                          // Other native context menus might behave different.
                          // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                        null
            },
        );

        // Prevent text selection lost after opening the context menu on Safari and Firefox
        const selection = document.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);

            setTimeout(() => {
                selection.addRange(range);
            });
        }
    };

    handleCloseContextMenu() {
        this.setState({contextMenu: null});
    }

    folderClicked() {
        this.props.enterFolder(this.props.name);
    }

    performOCR(e, usingCustomConfig) {
        e.stopPropagation();
        const customConfig = usingCustomConfig ? this.state.info?.["config"] : null;
        this.props.performOCR(this.props.name, true, true, customConfig);
    }

    configureOCR(e, usingCustomConfig) {
        e.stopPropagation();
        const customConfig = usingCustomConfig ? this.state.info?.["config"] : null;
        this.props.configureOCR(this.props.name, true, false, customConfig);
    }

    delete(e) {
        e.stopPropagation();
        this.props.deleteItem(this.props.name);
    }

    render() {
        const contents = this.state.info?.["contents"];
        const nDocs = Number(contents?.["documents"]);
        const nSubfolders = Number(contents?.["subfolders"]);
        const usingCustomConfig = this.state.info?.["config"] && this.state.info["config"] !== "default";
        return (
        <>
            <Menu
                open={this.state.contextMenu !== null}
                onClose={() => this.handleCloseContextMenu()}
                anchorReference={this.state.contextMenu?.anchorEl ? "anchorEl" : "anchorPosition"}
                anchorEl={this.state.contextMenu?.anchorEl}
                anchorPosition={
                    this.state.contextMenu?.mouseY
                        ? { top: this.state.contextMenu.mouseY, left: this.state.contextMenu.mouseX }
                        : undefined
                }
            >
                <Tooltip
                    placement="right"
                    title="A pasta não contém documentos"
                    disableFocusListener={!isNaN(nDocs) && nDocs !== 0}
                    disableHoverListener={!isNaN(nDocs) && nDocs !== 0}
                    disableTouchListener={!isNaN(nDocs) && nDocs !== 0}
                ><span>
                    <MenuItem
                        disabled={isNaN(nDocs) || nDocs === 0}
                        onClick={(e) => this.performOCR(e, usingCustomConfig)}
                    >
                        <IconButton className="actionButton">
                            <OcrIcon />
                        </IconButton>
                        &nbsp;Fazer OCR
                    </MenuItem>
                </span></Tooltip>

                <MenuItem
                    onClick={(e) => this.configureOCR(e, usingCustomConfig)}
                >
                    <IconButton
                        className={"actionButton"
                            // highlight custom configs with different color
                            + (usingCustomConfig
                                ? " altColor"
                                : "")}
                    >
                        {usingCustomConfig ? <SettingsSuggestIcon /> : <SettingsIcon />}
                    </IconButton>
                    &nbsp;{usingCustomConfig ? "Editar Configuração" : "Configurar OCR"}
                </MenuItem>

                <MenuItem
                    onClick={(e) => this.delete(e)}
                >
                    <IconButton className="negActionButton">
                        <DeleteForeverIcon />
                    </IconButton>
                    &nbsp;Apagar
                </MenuItem>
            </Menu>

            <TableRow
                className={"explorerRow" + (this.state.contextMenu ? " targeted" : "")}
                onContextMenu={(e) => this.handleContextMenu(e)}
            >
                <TableCell className="explorerCell optionsCell">
                    <IconButton
                        aria-label={"Opções para " + this.props.name}
                        onClick={(e) => this.handleOptionsClick(e)}
                    >
                        <MoreVertIcon />
                    </IconButton>
                </TableCell>

                <TableCell className="explorerCell thumbnailCell" />

                <TableCell
                    className="explorerCell nameCell"
                    onClick={() => this.folderClicked()}
                    sx={{ cursor: "pointer", paddingLeft: "16px !important"}}
                    align="left"
                >
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <FolderOpenRoundedIcon color="success" sx={{ p: 0, fontSize: 30, mr: '0.5rem' }} />
                        <span>{this.props.name}</span>
                    </Box>
                </TableCell>

                <TableCell className="explorerCell detailsCell" align='left'>
                    <span>
                        {nDocs} documento(s)
                        {'\n'}
                        {nSubfolders} sub-pasta(s)
                    </span>
                </TableCell>

                <TableCell className="explorerCell sizeCell" align='center'>
                    <span>
                        {this.state.info["size"]}
                    </span>
                </TableCell>

                <TableCell className="explorerCell dateCreatedCell" align='right'>
                    <span>
                        {this.state.info["creation"]}
                    </span>
                </TableCell>

                <TableCell className="explorerCell stateCell" align='center'>
                    —
                </TableCell>
            </TableRow>
        </>)
    }
}

FolderRow.defaultProps = {
    info: null,
    name: null,
    // functions:
    enterFolder: null,
    performOCR: null,
    configureOCR: null,
    deleteItem: null
}

export default FolderRow;
