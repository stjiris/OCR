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

            type: props.type || "text",
            id: props.id,
            checked: props.checked || false,
            copyId: props.copyId,
        }
    }

    componentDidMount() {
        this.setState({
            mainColor: this.state.type === "text" ? "#0000ff" : this.state.type === "image" ? '#08A045' : '#F05E16',
            numberColor: this.state.type === "text" ? "#0000ff" : this.state.type === "image" ? '#08A045' : '#F05E16',
            backColor: this.state.type === "text" ? "#0000ff22" : this.state.type === "image" ? '#08A04526' : '#F05E1626',
        })
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

    getBoxDetails() {
        return {
            top: this.state.top,
            left: this.state.left,
            bottom: this.state.bottom,
            right: this.state.right,
            type: this.state.type,
            id: this.state.id,
            checked: this.state.checked,
            copyId: this.state.copyId,
        }
    }

    processDrag(e, corner) {
        var shiftX = this.state.view.current.offsetLeft;
        var shiftY = this.state.view.current.offsetTop;

        var mouseX = e.clientX - shiftX + this.state.view.current.scrollLeft;
        var mouseY = e.clientY - shiftY + this.state.view.current.scrollTop + window.scrollY;

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

        var mainColor = this.state.checked ? `${this.state.mainColor}` : `${this.state.mainColor}80`

        return (
            <Box
                sx={{
                    position: 'absolute',
                    border: `2px solid ${mainColor}`,
                    backgroundColor: `${this.state.backColor}`,
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
                            backgroundColor: `${mainColor}`,
                            padding: '0px 10px',
                            borderRadius: '10px',
                            display: "flex",
                            justifyContent: "center",
                            color: "white",
                            left: `${(finalCoords.x - initialCoords.x)/2 - 25}px`,
                            top: `${(finalCoords.y - initialCoords.y)/2 - 8}px`
                        }}
                    >
                        <span><b>{this.state.id}</b></span>
                    </Box>

                    <Box draggable
                        sx={{
                            position: "absolute", top: "-5px", left: "-5px",
                            width: "10px", height: "10px", borderRadius: "50%", backgroundColor: `${mainColor}`,
                            cursor: "move",
                            zIndex: 100
                        }}
                        onDrag={(e) => this.processDrag(e, 0)}
                        onDragEnd={() => this.state.layoutImage.updateMenu()}

                    />

                    <Box draggable
                        sx={{
                            position: "absolute", top: "-5px", right: "-5px",
                            width: "10px", height: "10px", borderRadius: "50%", backgroundColor: `${mainColor}`,
                            cursor: "move",
                            zIndex: 100
                        }}
                        onDrag={(e) => this.processDrag(e, 1)}
                        onDragEnd={() => this.state.layoutImage.updateMenu()}
                    />

                    <Box draggable
                        sx={{
                            position: "absolute", bottom: `-${finalCoords.y - initialCoords.y + 5}px`, left: "-5px",
                            width: "10px", height: "10px", borderRadius: "50%", backgroundColor: `${mainColor}`,
                            cursor: "move",
                            zIndex: 100
                        }}
                        onDrag={(e) => this.processDrag(e, 2)}
                        onDragEnd={() => this.state.layoutImage.updateMenu()}
                    />

                    <Box draggable
                        sx={{
                            position: "absolute", bottom: `-${finalCoords.y - initialCoords.y + 5}px`, right: "-5px",
                            width: "10px", height: "10px", borderRadius: "50%", backgroundColor: `${mainColor}`,
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
            pageIndex: props.pageIndex,
            boxHeight: "450px",
            height: "450px",

            currentZoom: 1,
            maxZoom: 4,
            
            boxesCoords: props.boxesCoords,
            boxes: [],
            imageBoxes: [],
            ignoreBoxes: [],

            boxRefs: [],
            imageRefs: [],
            ignoreRefs: [],
        }

        this.image = React.createRef();
        this.view = React.createRef();
        this.preview = React.createRef();
    }

    componentDidMount() {
        this.setState({
            boxHeight: `${window.innerHeight - 160}px`,
            height: `${window.innerHeight - 160}px`,
        }, this.loadBoxes);
    }

    createLayoutBox(ref, index, box, type, checked = false, copyId = undefined) {
        return <LayoutBox
            ref={ref}
            key={index + " " + box.top + " " + box.left + " " + box.bottom + " " + box.right + " " + box.checked + " " + checked + " " + box.id + " " + box.copyId}
            index={index}
            layoutImage={this}
            view={this.view}
            image={this.image}
            top={box.top}
            left={box.left}
            bottom={box.bottom}
            right={box.right}
            type={type}
            id={box.id || type[0].toUpperCase() + this.state.pageIndex + "." + index}
            checked={box.checked || checked || false}
            copyId={box.copyId || copyId}
        />
    }

    loadBoxes() {
        var boxes = [];
        var refs = [];

        this.state.boxesCoords.forEach((group) => {
            var type = group.type || "text";
            var checked = group.checked || false;
            var copyId = group.copyId || undefined;

            var groupRefs = [];

            group.squares.forEach((box) => {
                var ref = React.createRef();
                boxes.push(this.createLayoutBox(ref, group.squares.length + 1, box, type, checked, copyId));
                groupRefs.push(ref);
            });

            refs.push(groupRefs);
        })

        this.setState({boxes: boxes, boxRefs: refs});
    }

    updateBoxes(boxes) {
        this.setState({boxesCoords: boxes}, this.loadBoxes);
    }

    getAllBoxes() {
        var coords = [];
        this.state.boxRefs.forEach((groupRefs) => {
            var squares = [];
            groupRefs.forEach((ref) => {
                squares.push(ref.current.getBoxDetails());
            });
            coords.push({squares: squares, type: squares[0].type, checked: squares[0].checked, copyId: squares[0].copyId});
        })
        return coords;
    }

    getWindowWidth() {
        const width = window.innerWidth;
        const widthReduction = 550;

        return width - widthReduction;
    }

    recreateBoxes() {
        var boxes = [];
        // var imageBoxes = [];
        // var ignoreBoxes = [];

        var refs = [...this.state.boxRefs];
        // var imageRefs = [...this.state.imageRefs];
        // var ignoreRefs = [...this.state.ignoreRefs];
        refs.forEach((groupRefs) => {
            groupRefs.forEach((ref) => {
                boxes.push(this.createLayoutBox(ref, boxes.length + 1, ref.current.getBoxDetails(), "text"));
            });
        });

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

        var x = e.clientX - this.view.current.offsetLeft + this.view.current.scrollLeft + window.scrollX;
        var y = e.clientY - this.view.current.offsetTop + this.view.current.scrollTop + window.scrollY;

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

        var x = e.clientX - this.view.current.offsetLeft + this.view.current.scrollLeft + window.scrollX;
        var y = e.clientY - this.view.current.offsetTop + this.view.current.scrollTop + window.scrollY;

        this.preview.current.updateCoordinates(y, x);
    }

    updateMenu() {
        this.state.menu.updateBoxes(this.getAllBoxes());
    }

    dragEnd(e) {
        if (!this.state.dragging) return;

        var initialCoords = this.screenToImageCoordinates(this.state.initialCoords.x, this.state.initialCoords.y);
        var finalCoords = this.screenToImageCoordinates(e.clientX - this.view.current.offsetLeft + this.view.current.scrollLeft + window.scrollX, e.clientY - this.view.current.offsetTop + this.view.current.scrollTop + window.scrollY);

        var boxes = [...this.state.boxes];
        var refs = [...this.state.boxRefs];
        var ref = React.createRef();
        var coords = {top: initialCoords.y, left: initialCoords.x, bottom: finalCoords.y, right: finalCoords.x};
        boxes.push(this.createLayoutBox(ref, refs.length + 1, coords, "text"));
        refs.push([ref]);

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
                        onLoad={() => this.loadBoxes()}
                    />

                    {
                        this.state.boxes.map((box) => {
                            return box;
                        })
                    }

                    {
                        this.state.imageBoxes.map((box) => {
                            return box;
                        })
                    }

                    {
                        this.state.ignoreBoxes.map((box) => {
                            return box;
                        })
                    }

                    <LayoutPreview ref={this.preview} view={this.view} image={this.image} top={100} left={50} bottom={200} right={150}/>
                </Box>
            </Box>
        )
    }
}