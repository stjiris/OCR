import React from 'react';
import Box from '@mui/material/Box';

import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import ZoomOutRoundedIcon from '@mui/icons-material/ZoomOutRounded';
import { IconButton } from '@mui/material';

const height = window.innerHeight;
const heightReduction = 250;

class LayoutPreview extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,

            view: props.view,
            image: props.image,

            top: props.top,
            left: props.left,
            bottom: props.bottom,
            right: props.right
        }
    }

    toggleVisibility() {
        this.setState({visible: !this.state.visible});
    }

    setInitialCoordinates(top, left) {
        this.setState({top: top, left: left, bottom: top + 2, right: left + 2});
    }

    updateCoordinates(bottom, right) {
        this.setState({bottom: bottom, right: right});
    }

    render() {
        return (
            <Box
                sx={{
                    position: 'absolute',
                    display: this.state.visible ? 'block' : 'none',
                    border: '2px solid #0005',
                    backgroundColor: '#0002',
                    top: `${this.state.top}px`,
                    left: `${this.state.left}px`,
                    width: `${this.state.right - this.state.left}px`,
                    height: `${this.state.bottom - this.state.top}px`,
                }}
            />
        )
    }
}

class LayoutBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            index: props.index,

            layoutImage: props.layoutImage,
            view: props.view,
            image: props.image,

            top: props.top,
            left: props.left,
            bottom: props.bottom,
            right: props.right,
        }
    }

    imageToScreenCoordinates(x, y) {
        var image = this.state.image.current;

        var ratioX = image.naturalWidth / image.offsetWidth;
        var ratioY = image.naturalHeight / image.offsetHeight;

        var domX = x / ratioX;
        var domY = y / ratioY;

        var screenX = domX + image.offsetLeft;
        var screenY = domY + image.offsetTop;

        return {x: screenX, y: screenY};
    }

    screenToImageCoordinates(x, y) {
        var image = this.state.image.current;

        var ratioX = image.naturalWidth / image.offsetWidth;
        var ratioY = image.naturalHeight / image.offsetHeight;

        var domX = x - image.offsetLeft;
        var domY = y - image.offsetTop;

        var imgX = domX * ratioX;
        var imgY = domY * ratioY;

        return {x: imgX, y: imgY};
    }

    getBoxCoordinates() {
        return {
            top: this.state.top,
            left: this.state.left,
            bottom: this.state.bottom,
            right: this.state.right
        }
    }

    processDrag(e, corner) {
        var shiftX = this.state.view.current.offsetLeft;
        var shiftY = this.state.view.current.offsetTop;

        var mouseX = e.clientX - shiftX + this.state.view.current.scrollLeft;
        var mouseY = e.clientY - shiftY + this.state.view.current.scrollTop;

        if (
            mouseX <= 0 || mouseY <= 0
        ) return;

        var coords = this.screenToImageCoordinates(mouseX, mouseY);
        mouseX = coords.x;
        mouseY = coords.y;

        if (corner === 0) {
            this.setState({ top: mouseY, left: mouseX })
        } else if (corner === 1) {
            this.setState({ top: mouseY, right: mouseX })
        } else if (corner === 2) {
            this.setState({ bottom: mouseY, left: mouseX })
        } else if (corner === 3) {
            this.setState({ bottom: mouseY, right: mouseX })
        }
    }

    render() {
        var initialCoords = this.imageToScreenCoordinates(this.state.left, this.state.top);
        var finalCoords = this.imageToScreenCoordinates(this.state.right, this.state.bottom);

        return (
            <Box
                sx={{
                    position: 'absolute',
                    border: '2px solid #00f',
                    backgroundColor: '#00f2',
                    top: `${initialCoords.y}px`,
                    left: `${initialCoords.x}px`,
                    width: `${finalCoords.x - initialCoords.x}px`,
                    height: `${finalCoords.y - initialCoords.y}px`,
                }}
            >
                <Box sx={{position: "relative"}}>
                    <Box
                        sx={{
                            position: "absolute",
                            backgroundColor: "#00fa",
                            width: "30px",
                            height: "30px",
                            borderRadius: "50%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            color: "white",
                            left: `${(finalCoords.x - initialCoords.x)/2 - 15}px`,
                            top: `${(finalCoords.y - initialCoords.y)/2 - 15}px`
                        }}
                    >
                        <span><b>{this.state.index}</b></span>
                    </Box>

                    <Box draggable
                        sx={{
                            position: "absolute", top: "-5px", left: "-5px",
                            width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#00f",
                            cursor: "move",
                            zIndex: 100
                        }}
                        onDrag={(e) => this.processDrag(e, 0)}
                        onDragEnd={() => this.state.layoutImage.updateMenu()}

                    />

                    <Box draggable
                        sx={{
                            position: "absolute", top: "-5px", right: "-5px",
                            width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#00f",
                            cursor: "move",
                            zIndex: 100
                        }}
                        onDrag={(e) => this.processDrag(e, 1)}
                        onDragEnd={() => this.state.layoutImage.updateMenu()}
                    />

                    <Box draggable
                        sx={{
                            position: "absolute", bottom: `-${finalCoords.y - initialCoords.y + 5}px`, left: "-5px",
                            width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#00f",
                            cursor: "move",
                            zIndex: 100
                        }}
                        onDrag={(e) => this.processDrag(e, 2)}
                        onDragEnd={() => this.state.layoutImage.updateMenu()}
                    />

                    <Box draggable
                        sx={{
                            position: "absolute", bottom: `-${finalCoords.y - initialCoords.y + 5}px`, right: "-5px",
                            width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#00f",
                            cursor: "move",
                            zIndex: 100
                        }}
                        onDrag={(e) => this.processDrag(e, 3)}
                        onDragEnd={() => this.state.layoutImage.updateMenu()}
                    />
                </Box>

            </Box>
        )
    }
}


export default class LayoutImage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menu: props.menu,
            image: props.image,
            boxHeight: "450px",
            height: "450px",

            currentZoom: 1,
            maxZoom: 4,
            
            boxesCoords: props.boxesCoords,
            boxes: [],
            boxRefs: []
        }

        this.image = React.createRef();
        this.view = React.createRef();
        this.preview = React.createRef();
    }

    componentDidMount() {
        this.setState({
            boxHeight: `${height - heightReduction}px`,
            height: `${height - heightReduction}px`,
        }, this.loadBoxes);
    }

    loadBoxes() {
        var boxes = [];
        var refs = [];

        this.state.boxesCoords.forEach((box, index) => {
            var ref = React.createRef();
            boxes.push(
                <LayoutBox
                    ref={ref}
                    key={index + " " + box.top + " " + box.left + " " + box.bottom + " " + box.right}
                    index={boxes.length + 1}
                    layoutImage={this}
                    view={this.view}
                    image={this.image}
                    top={box.top}
                    left={box.left}
                    bottom={box.bottom}
                    right={box.right}
                />
            );
            refs.push(ref);
        })

        this.setState({boxes: boxes, boxRefs: refs});
    }

    updateBoxes(boxes) {
        this.setState({boxesCoords: boxes}, this.loadBoxes);
    }

    getAllBoxes() {
        var coords = [];
        this.state.boxRefs.forEach((ref) => {
            coords.push(ref.current.getBoxCoordinates());
        })
        return coords;
    }

    getWindowWidth() {
        const width = window.innerWidth;
        const widthReduction = 400;

        return width - widthReduction;
    }

    recreateBoxes() {
        var boxes = [];
        var refs = [...this.state.boxRefs];
        refs.forEach((ref, index) => {
            var coords = ref.current.getBoxCoordinates();
            boxes.push(
                <LayoutBox
                    ref={ref}
                    key={index + " " + coords.top + " " + coords.left + " " + coords.bottom + " " + coords.right}
                    index={boxes.length + 1}
                    layoutImage={this}
                    view={this.view}
                    image={this.image}
                    top={coords.top}
                    left={coords.left}
                    bottom={coords.bottom}
                    right={coords.right}
                />
            );
        })
        this.setState({boxes: boxes});
    }

    zoomIn() {
        this.setState({
            currentZoom: this.state.currentZoom + 1,
            height: `${(height - heightReduction) * (this.state.currentZoom + 1)}px`,
        }, this.recreateBoxes)
    }

    zoomOut() {
        this.setState({
            currentZoom: this.state.currentZoom - 1,
            height: `${(height - heightReduction) * (this.state.currentZoom - 1)}px`
        }, this.recreateBoxes)
    }

    screenToImageCoordinates(x, y) {
        var image = this.image.current;

        var ratioX = image.naturalWidth / image.offsetWidth;
        var ratioY = image.naturalHeight / image.offsetHeight;

        var domX = x - this.image.current.offsetLeft;
        var domY = y - this.image.current.offsetTop;

        var imgX = domX * ratioX;
        var imgY = domY * ratioY;

        return {x: imgX, y: imgY};
    }

    dragStart(e) {
        e.stopPropagation();

        var x = e.clientX - this.view.current.offsetLeft + this.view.current.scrollLeft;
        var y = e.clientY - this.view.current.offsetTop + this.view.current.scrollTop;

        this.preview.current.toggleVisibility();
        this.preview.current.setInitialCoordinates(y, x);

        this.setState(
            {
                dragging: true,
                initialCoords: {x: x, y: y}
            }
        )
    }

    duringDrag(e) {
        if (!this.state.dragging) return;

        var x = e.clientX - this.view.current.offsetLeft + this.view.current.scrollLeft;
        var y = e.clientY - this.view.current.offsetTop + this.view.current.scrollTop;

        this.preview.current.updateCoordinates(y, x);
    }

    updateMenu() {
        this.state.menu.updateBoxes(this.getAllBoxes());
    }

    dragEnd(e) {
        if (!this.state.dragging) return;

        var initialCoords = this.screenToImageCoordinates(this.state.initialCoords.x, this.state.initialCoords.y);
        var finalCoords = this.screenToImageCoordinates(e.clientX - this.view.current.offsetLeft + this.view.current.scrollLeft, e.clientY - this.view.current.offsetTop + this.view.current.scrollTop);

        var boxes = [...this.state.boxes];
        var refs = [...this.state.boxRefs];
        var ref = React.createRef();
        boxes.push(
            <LayoutBox
                ref={ref}
                key={(this.state.boxes.length + 1) + " " + initialCoords.x + " " + initialCoords.y + " " + finalCoords.x + " " + finalCoords.y}
                index={this.state.boxes.length + 1}
                layoutImage={this}
                view={this.view}
                image={this.image}
                top={initialCoords.y}
                left={initialCoords.x}
                bottom={finalCoords.y}
                right={finalCoords.x}
            />
        );
        refs.push(ref);

        this.preview.current.toggleVisibility();
        this.setState({dragging: false, boxes: boxes, boxRefs: refs}, this.updateMenu);
    }

    render() {
        return (
            <Box sx={{display: 'flex', flexDirection: 'row'}}>
                <Box sx={{display: 'flex', flexDirection: 'column'}}>
                    <IconButton disabled={this.state.currentZoom === this.state.maxZoom} onClick={() => this.zoomIn()}>
                        <ZoomInRoundedIcon/>
                    </IconButton>
                    <IconButton disabled={this.state.currentZoom === 1} onClick={() => this.zoomOut()}>
                        <ZoomOutRoundedIcon />
                    </IconButton>
                </Box>

                <Box ref={this.view}
                    draggable
                    sx={{
                        position: 'relative',
                        height: this.state.boxHeight,
                        width: `${this.getWindowWidth()}px`,
                        overflow: 'scroll', 
                        border: '1px solid grey'
                    }}
                >
                    <img
                        ref={this.image}
                        src={this.state.image}
                        alt={`Página de ${this.state.image}`}
                        style={{
                            display: 'block',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                            border: '1px solid black',
                            maxHeight: `${this.state.height}`,
                        }}

                        onDragStart={(e) => this.dragStart(e)}
                        onDrag={(e) => this.duringDrag(e)}
                        onDragEnd={(e) => this.dragEnd(e)}
                    />

                    {
                        this.state.boxes.map((box) => {
                            return box;
                        })
                    }

                    <LayoutPreview ref={this.preview} view={this.view} image={this.image} top={100} left={50} bottom={200} right={150}/>
                </Box>
            </Box>
        )
    }
}