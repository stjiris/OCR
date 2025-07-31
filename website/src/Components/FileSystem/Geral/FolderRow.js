import React from 'react';
import Box from '@mui/material/Box';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';

import loadComponent from '../../../utils/loadComponents';
const TooltipIcon = loadComponent('TooltipIcon', 'TooltipIcon');
const OcrIcon = loadComponent('CustomIcons', 'OcrIcon');

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
        const buttonsDisabled = false;
        const usingCustomConfig = this.state.info?.["config"] && this.state.info["config"] !== "default";
        return (
            <TableRow className="explorerRow"
                sx={{":hover": {backgroundColor: "#f5f5f5", cursor: 'pointer'} }}
                onClick={() => this.folderClicked()}
            >
                <TableCell className="explorerCell nameCell">
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <FolderOpenRoundedIcon color="success" sx={{ p: 0, fontSize: 30, mr: '0.5rem' }} />
                        <span>{this.props.name}</span>
                    </Box>
                </TableCell>

                <TableCell className="explorerCell actionsCell" align='center'>
                    <Box className="actionsCell-inner">
                        <TooltipIcon
                            key={"OCR " + this.props.name}
                            disabled={buttonsDisabled && this.state.info["ocr"]["exceptions"] === undefined}
                            className="actionButton"
                            message="Fazer OCR"
                            clickFunction={(e) => this.performOCR(e, usingCustomConfig)}
                            icon={<OcrIcon/>}
                        />

                        <TooltipIcon
                            key={"Config " + this.props.name}
                            disabled={buttonsDisabled && this.state.info["ocr"]["exceptions"] === undefined}
                            className={"actionButton"
                                // highlight custom configs with different color
                                + (usingCustomConfig
                                    ? " altColor"
                                    : "")}
                            message="Configurar OCR"
                            clickFunction={(e) => this.configureOCR(e, usingCustomConfig)}
                            icon={usingCustomConfig ? <SettingsSuggestIcon/> : <SettingsIcon/>}
                        />

                        <TooltipIcon
                            className="negActionButton"
                            message="Apagar"
                            clickFunction={(e) => this.delete(e)}
                            icon={<DeleteForeverIcon/>}
                        />
                    </Box>
                </TableCell>

                <TableCell className="explorerCell stateCell" align='center'>
                    <b>—</b>
                </TableCell>

                <TableCell className="explorerCell dateCreatedCell" align='center'>
                    <span>
                        {this.state.info["creation"]}
                    </span>
                </TableCell>

                <TableCell className="explorerCell detailsCell" align='center'>
                    <span>
                        {this.state.info["contents"]} ficheiro(s) ou sub-pasta(s)
                    </span>
                </TableCell>

                <TableCell className="explorerCell sizeCell" align='center'>—</TableCell>
            </TableRow>
        )
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
