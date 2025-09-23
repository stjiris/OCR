import React from 'react';
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import ZoomResetIcon from "@mui/icons-material/Autorenew";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

class ZoomingTool extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Box
                className="zooming-tool"
                onMouseDown={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
            >

                <Tooltip
                    placement="right"
                    title="Aumentar Zoom"
                ><span>
                <IconButton
                    className="zooming-IconButton"
                    onClick={() => this.props.zoomInFunc()}
                >
                    <ZoomInIcon className="zoom-icon" />
                </IconButton>
                </span></Tooltip>

                <Tooltip
                    placement="right"
                    title="Repor Zoom Inicial"
                ><span>
                <IconButton
                    className="zooming-IconButton"
                    onClick={() => this.props.zoomResetFunc()}
                >
                    <ZoomResetIcon className="zoom-icon" />
                </IconButton>
                </span></Tooltip>


                <Tooltip
                    placement="right"
                    title="Reduzir Zoom"
                ><span>
                <IconButton
                    className="zooming-IconButton"
                    onClick={() => this.props.zoomOutFunc()}
                >
                    <ZoomOutIcon className="zoom-icon" />
                </IconButton>
                </span></Tooltip>
            </Box>
        );
    }
}

ZoomingTool.defaultProps = {
    // functions:
    zoomInFunc: null,
    zoomOutFunc: null,
    zoomResetFunc: null
}

export default ZoomingTool;
