import React from 'react';
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

class ZoomingTool extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Box>
                <IconButton
                    sx={{marginRight: "10px", p: 0}}
                    onClick={() => this.props.zoomInFunc()}
                >
                    <ZoomInIcon />
                </IconButton>
                <IconButton
                    sx={{marginRight: "10px", p: 0}}
                    onClick={() => this.props.zoomOutFunc()}
                >
                    <ZoomOutIcon />
                </IconButton>
            </Box>
        );
    }
}

export default ZoomingTool;
