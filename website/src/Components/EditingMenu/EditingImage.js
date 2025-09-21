import React from 'react';
import UTIF from 'utif';

import Box from "@mui/material/Box";

import ZoomingTool from 'Components/ZoomingTool/ZoomingTool';


export default class EditingImage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedWordBox: null,
            imageZoom: 100,
            minImageZoom: 20,
            maxImageZoom: 600,
        }

        this.zoomIn = this.zoomIn.bind(this);
        this.zoomOut = this.zoomOut.bind(this);
        this.zoomReset = this.zoomReset.bind(this);
    }

    componentDidMount() {
        UTIF.replaceIMG();  // automatically replace TIFF <img> sources
    }

    setWordBox(wordBox, callback) {
        console.log("Received: ", wordBox);
        this.setState({selectedWordBox: wordBox}, callback);
    }

    zoomIn() {
        this.zoom(1);
    }

    zoomOut() {
        this.zoom(-1);
    }

    zoomReset() {
        this.setState({imageZoom: 100});
    }

    zoom(delta) {
        let newZoom = Math.max(this.state.imageZoom + (20 * delta), this.state.minImageZoom);
        newZoom = Math.min(newZoom, this.state.maxImageZoom);
        this.setState({imageZoom: newZoom});
    }

    render() {
        console.log("Rendering: ", this.state.selectedWordBox)
        return (
            <Box sx={{display: "flex", flexDirection: "row"}}>
                <Box className="pageImageContainer noPointer">
                    <ZoomingTool zoomInFunc={this.zoomIn} zoomOutFunc={this.zoomOut} zoomResetFunc={this.zoomReset}/>

                    <img
                        ref={this.props.imageRef}
                        src={this.props.imageURL}
                        alt={`Imagem da página ${this.props.currentPage}`}
                        className={"pageImage"}
                        style={{
                            maxWidth: `${this.state.imageZoom}%`,
                            maxHeight: `${this.state.imageZoom}%`,
                        }}
                    />

                    <Box id="imageOverlay"
                         sx={{
                             display: this.state.selectedWordBox ? "" : "none",
                             position: 'absolute',
                             border: `2px solid #0000ff`,
                             backgroundColor: `#0000ff30`,
                             top: `${this.state.selectedWordBox?.[0]}px`,
                             left: `${this.state.selectedWordBox?.[1]}px`,
                             width: `${this.state.selectedWordBox?.[2]}px`,
                             height: `${this.state.selectedWordBox?.[3]}px`,
                         }}
                    />
                </Box>
            </Box>
        );
    }
}

EditingImage.defaultProps = {
    imageRef: null,
    imageURL: null,
    currentPage: null,
    selectedWordBox: null,
}
