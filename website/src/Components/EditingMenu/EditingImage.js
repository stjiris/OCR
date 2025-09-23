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
            dragging: false,
        }

        this.pageContainerRef = React.createRef();
        this.mouseCoords = React.createRef();
        this.mouseCoords.current = {
            startX: 0,
            startY: 0,
            scrollLeft: 0,
            scrollTop: 0,
        };

        this.zoomIn = this.zoomIn.bind(this);
        this.zoomOut = this.zoomOut.bind(this);
        this.zoomReset = this.zoomReset.bind(this);
    }

    componentDidMount() {
        UTIF.replaceIMG();  // automatically replace TIFF <img> sources
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.imageURL !== this.props.imageURL) {
            UTIF.replaceIMG();  // automatically replace TIFF <img> sources
        }
    }

    setWordBox(wordBox, callback) {
        this.setState({selectedWordBox: wordBox}, callback);
    }

    unsetWordBox(wordBox, callback) {
        // Avoid race conditions by only unsetting word box if received parameter is equal to previous box
        // If new coordinates have been given before call to unsetWordBox(), new value is not cleared by mistake
        this.setState(prevState => {
            const previousWordBox = prevState.selectedWordBox;
            if (Array.isArray(previousWordBox) && Array.isArray(wordBox)
                && previousWordBox.length === wordBox.length
                && previousWordBox.every((value, i) => value === wordBox[i])) {
                return {
                    selectedWordBox: null
                }
            }
        }, callback);
    }

    clearWordBox(callback) {
        this.setState({selectedWordBox: null}, callback);
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

    handleDragStart(e) {
        if (!this.pageContainerRef.current) return
        const image = this.pageContainerRef.current;
        const startX = e.pageX - image.offsetLeft;
        const startY = e.pageY - image.offsetTop;
        const scrollLeft = image.scrollLeft;
        const scrollTop = image.scrollTop;
        this.mouseCoords.current = { startX, startY, scrollLeft, scrollTop };
        this.setState({dragging: true});
    }

    handleDrag(e) {
        if (!this.state.dragging || ! this.pageContainerRef.current) return;
        e.preventDefault();
        const imageContainer = this.pageContainerRef.current;
        const x = e.pageX - imageContainer.offsetLeft;
        const y = e.pageY - imageContainer.offsetTop;
        const walkX = (x - this.mouseCoords.current.startX) * 1.5;
        const walkY = (y - this.mouseCoords.current.startY) * 1.5;
        imageContainer.scrollLeft = this.mouseCoords.current.scrollLeft - walkX;
        imageContainer.scrollTop = this.mouseCoords.current.scrollTop - walkY;
    }

    handleDragEnd(e) {
        this.setState({dragging: false});
    }

    render() {
        return (
            <Box sx={{display: "flex", flexDirection: "row"}}>
                <Box ref={this.pageContainerRef}
                     className="pageImageContainer"
                     draggable={false}
                     onMouseDown={(e) => this.handleDragStart(e)}
                     onMouseMove={(e) => this.handleDrag(e)}
                     onMouseUp={(e) => this.handleDragEnd(e)}
                     sx={{
                         cursor: (this.state.dragging ? "grabbing" : "grab") + " !important"
                     }}
                >
                    <ZoomingTool zoomInFunc={this.zoomIn} zoomOutFunc={this.zoomOut} zoomResetFunc={this.zoomReset}/>

                    <img
                        ref={this.props.imageRef}
                        src={this.props.imageURL}
                        alt={`Imagem da página ${this.props.currentPage}`}
                        draggable={false}
                        className="pageImage"
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
