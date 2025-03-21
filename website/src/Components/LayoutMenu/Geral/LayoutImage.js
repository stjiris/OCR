import React from 'react';
import Box from '@mui/material/Box';

import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import ZoomOutRoundedIcon from '@mui/icons-material/ZoomOutRounded';
import { IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


const height = window.innerHeight;
const heightReduction = 250;

class LayoutPreview extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
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
        this.state = {  // TODO: use props instead of state where possible
            top: props.top,
            left: props.left,
            bottom: props.bottom,
            right: props.right,

            mainColor: null,
            backColor: null
        }
        this.viewRef = props.viewRef;
        this.imageRef = props.imageRef;
    }

    componentDidMount() {
        this.setState({
            mainColor: this.props.type === "text" ? "#0000ff" : this.props.type === "image" ? '#08A045' : '#F05E16',
            backColor: this.props.type === "text" ? "#0000ff22" : this.props.type === "image" ? '#08A04526' : '#F05E1626',
        })
    }

    imageToScreenCoordinates(x, y) {
        const image = this.imageRef.current;

        const ratioX = image.naturalWidth / image.offsetWidth;
        const ratioY = image.naturalHeight / image.offsetHeight;

        const domX = x / ratioX;
        const domY = y / ratioY;

        const screenX = domX + image.offsetLeft;
        const screenY = domY + image.offsetTop;

        return {x: screenX, y: screenY};
    }

    screenToImageCoordinates(x, y) {
        const image = this.imageRef.current;

        const ratioX = image.naturalWidth / image.offsetWidth;
        const ratioY = image.naturalHeight / image.offsetHeight;

        const domX = x - image.offsetLeft;
        const domY = y - image.offsetTop;

        const imgX = domX * ratioX;
        const imgY = domY * ratioY;

        return {x: imgX, y: imgY};
    }

    getBoxDetails() {
        return {
            top: this.state.top,
            left: this.state.left,
            bottom: this.state.bottom,
            right: this.state.right,
            type: this.props.type,
            id: this.props.id,
            checked: this.props.checked,
            copyId: this.props.copyId,
        }
    }

    processDrag(e, corner) {
        var shiftX = this.viewRef.current.offsetLeft;
        var shiftY = this.viewRef.current.offsetTop;

        var mouseX = e.clientX - shiftX + this.viewRef.current.scrollLeft;
        var mouseY = e.clientY - shiftY + this.viewRef.current.scrollTop + window.scrollY;

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

        var mainColor = this.props.checked ? `${this.state.mainColor}` : `${this.state.mainColor}80`

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
                        <span><b>{this.props.id}</b></span>
                        {
                            this.state.copyId
                            ? <ContentCopyIcon sx={{fontSize: 15, ml: "10px"}}/>
                            : null
                        }
                    </Box>

                    <Box draggable
                        sx={{
                            position: "absolute", top: "-5px", left: "-5px",
                            width: "10px", height: "10px", borderRadius: "50%", backgroundColor: `${mainColor}`,
                            cursor: "move",
                            zIndex: 100
                        }}
                        onDrag={(e) => this.processDrag(e, 0)}
                        onDragEnd={() => this.props.updateMenu()}

                    />

                    <Box draggable
                        sx={{
                            position: "absolute", top: "-5px", right: "-5px",
                            width: "10px", height: "10px", borderRadius: "50%", backgroundColor: `${mainColor}`,
                            cursor: "move",
                            zIndex: 100
                        }}
                        onDrag={(e) => this.processDrag(e, 1)}
                        onDragEnd={() => this.props.updateMenu()}
                    />

                    <Box draggable
                        sx={{
                            position: "absolute", bottom: `-${finalCoords.y - initialCoords.y + 5}px`, left: "-5px",
                            width: "10px", height: "10px", borderRadius: "50%", backgroundColor: `${mainColor}`,
                            cursor: "move",
                            zIndex: 100
                        }}
                        onDrag={(e) => this.processDrag(e, 2)}
                        onDragEnd={() => this.props.updateMenu()}
                    />

                    <Box draggable
                        sx={{
                            position: "absolute", bottom: `-${finalCoords.y - initialCoords.y + 5}px`, right: "-5px",
                            width: "10px", height: "10px", borderRadius: "50%", backgroundColor: `${mainColor}`,
                            cursor: "move",
                            zIndex: 100
                        }}
                        onDrag={(e) => this.processDrag(e, 3)}
                        onDragEnd={() => this.props.updateMenu()}
                    />
                </Box>

            </Box>
        )
    }
}

class LayoutImage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menu: props.menu,
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

        this.imageRef = React.createRef();
        this.viewRef = React.createRef();
        this.previewRef = React.createRef();

        this.updateMenu = this.updateMenu.bind(this);
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
            viewRef={this.viewRef}
            imageRef={this.imageRef}
            top={box.top}
            left={box.left}
            bottom={box.bottom}
            right={box.right}
            type={type}
            id={box.id || type[0].toUpperCase() + this.props.pageIndex + "." + index}
            checked={box.checked || checked || false}
            copyId={box.copyId || copyId}
            updateMenu={this.updateMenu}
        />
    }

    loadBoxes() {
        const boxes = [];
        const refs = [];

        this.state.boxesCoords.forEach((group) => {
            const type = group.type || "text";
            const checked = group.checked || false;
            const copyId = group.copyId || undefined;

            const groupRefs = [];

            group.squares.forEach((box) => {
                const ref = React.createRef();
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
            var copyId = undefined;
            groupRefs.forEach((ref) => {
                var details = ref.current.getBoxDetails();
                if (details.copyId) {
                    copyId = details.copyId;
                    delete details.copyId;
                }
                squares.push(details);
            });
            coords.push({squares: squares, type: squares[0].type, checked: squares[0].checked, copyId: copyId});
        })
        return coords;
    }

    getWindowWidth() {
        const width = window.innerWidth;
        const widthReduction = 600;

        return width - widthReduction;
    }

    recreateBoxes() {
        const boxes = [];
        // var imageBoxes = [];
        // var ignoreBoxes = [];

        const refs = [...this.state.boxRefs];
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
        const image = this.imageRef.current;

        const ratioX = image.naturalWidth / image.offsetWidth;
        const ratioY = image.naturalHeight / image.offsetHeight;

        const domX = x - this.imageRef.current.offsetLeft;
        const domY = y - this.imageRef.current.offsetTop;

        const imgX = domX * ratioX;
        const imgY = domY * ratioY;

        return {x: imgX, y: imgY};
    }

    dragStart(e) {
        e.stopPropagation();

        if (this.state.menu.state.segmentLoading) return;

        var x = e.clientX - this.viewRef.current.offsetLeft + this.viewRef.current.scrollLeft + window.scrollX;
        var y = e.clientY - this.viewRef.current.offsetTop + this.viewRef.current.scrollTop + window.scrollY;

        this.previewRef.current.toggleVisibility();
        this.previewRef.current.setInitialCoordinates(y, x);

        this.setState(
            {
                dragging: true,
                initialCoords: {x: x, y: y}
            }
        )
    }

    duringDrag(e) {
        if (!this.state.dragging) return;

        var x = e.clientX - this.viewRef.current.offsetLeft + this.viewRef.current.scrollLeft + window.scrollX;
        var y = e.clientY - this.viewRef.current.offsetTop + this.viewRef.current.scrollTop + window.scrollY;

        this.previewRef.current.updateCoordinates(y, x);
    }

    updateMenu() {
        this.state.menu.updateBoxes(this.getAllBoxes());
    }

    dragEnd(e) {
        if (!this.state.dragging) return;

        var initialCoords = this.screenToImageCoordinates(this.state.initialCoords.x, this.state.initialCoords.y);
        var finalCoords = this.screenToImageCoordinates(e.clientX - this.viewRef.current.offsetLeft + this.viewRef.current.scrollLeft + window.scrollX, e.clientY - this.viewRef.current.offsetTop + this.viewRef.current.scrollTop + window.scrollY);

        if (finalCoords.x - initialCoords.x < 150 && finalCoords.y - initialCoords.y < 150) {
            finalCoords.x = Math.max(finalCoords.x, initialCoords.x + 150);
            finalCoords.y = Math.max(finalCoords.y, initialCoords.y + 150);
        }

        var boxes = [...this.state.boxes];
        var refs = [...this.state.boxRefs];
        var ref = React.createRef();
        var coords = {top: initialCoords.y, left: initialCoords.x, bottom: finalCoords.y, right: finalCoords.x};
        boxes.push(this.createLayoutBox(ref, refs.length + 1, coords, this.state.menu.state.textModeState ? "text" : "remove"));
        refs.push([ref]);

        this.previewRef.current.toggleVisibility();
        this.setState({dragging: false, boxes: boxes, boxRefs: refs}, this.updateMenu);
    }

    render() {
        return (
            <Box sx={{display: 'flex', flexDirection: 'row'}}>
                <Box ref={this.viewRef}
                    draggable
                    className="pageImage">
                    <img
                        ref={this.imageRef}
                        src={this.props.imageURL}
                        alt={`Página de ${this.props.imageURL}`}
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

                    <LayoutPreview ref={this.previewRef} top={100} left={50} bottom={200} right={150}/>
                </Box>
            </Box>
        )
    }
}

LayoutPreview.defaultProps = {
    top: null,
    left: null,
    bottom: null,
    right: null
}

LayoutBox.defaultProps = {
    view: null,
    imageRef: null,

    top: null,
    left: null,
    bottom: null,
    right: null,

    id: null,
    copyId: null,
    type: "text",
    checked: false,

    // functions:
    updateMenu: null
}

LayoutImage.defaultProps = {
    menu: null,
    boxesCoords: null,
    pageIndex: null,
    imageURL: null
}

export default LayoutImage;
