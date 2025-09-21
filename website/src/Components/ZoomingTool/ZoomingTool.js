import React from 'react';
import Box from "@mui/material/Box";
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
            <Box className="zooming-tool">
                <IconButton
                    className="zooming-IconButton"
                    onClick={() => this.props.zoomInFunc()}
                >
                    <ZoomInIcon className="zoom-icon" />
                </IconButton>
                <IconButton
                    className="zooming-IconButton"
                    onClick={() => this.props.zoomResetFunc()}
                >
                    <ZoomResetIcon className="zoom-icon" />
                </IconButton>
                <IconButton
                    className="zooming-IconButton"
                    onClick={() => this.props.zoomOutFunc()}
                >
                    <ZoomOutIcon className="zoom-icon" />
                </IconButton>
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
