import React from 'react';
import Box from '@mui/material/Box';

import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const transparentPixel = new Image();
transparentPixel.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";


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
        this.state = {
            top: props.top,
            left: props.left,
            bottom: props.bottom,
            right: props.right,

            mainColor: this.props.type === "text" ? "#0000ff" : this.props.type === "image" ? '#08A045' : '#F05E16',
            backColor: this.props.type === "text" ? "#0000ff22" : this.props.type === "image" ? '#08A04526' : '#F05E1626',
        }
        this.viewRef = props.viewRef;
        this.imageRef = props.imageRef;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.type !== this.props.type) {
            this.updateColor();
        }
    }

    updateColor() {
        this.setState({
            mainColor: this.props.type === "text" ? "#0000ff" : this.props.type === "image" ? '#08A045' : '#F05E16',
            backColor: this.props.type === "text" ? "#0000ff22" : this.props.type === "image" ? '#08A04526' : '#F05E1626',
        });
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

    dragEnd(e) {
        e.preventDefault();
        e.stopPropagation();
        if (!this.state.dragging) return;
        this.setState({dragging: false}, this.props.updateMenu());
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
                        <span><b>{
                            (this.props.type === "text"
                                ? "T"
                                : (this.props.type === "image"
                                ? "I"
                                : "R")) + this.props.id
                        }</b></span>
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

            imageZoom: 100,
            minImageZoom: 20,
            maxImageZoom: 600,

            boxes: [],  // LayoutBox components
            groups: [],  // info for groups with the refs of their LayoutBox components
        }

        this.imageRef = React.createRef();
        this.viewRef = React.createRef();
        this.previewRef = React.createRef();

        this.updateMenu = this.updateMenu.bind(this);
        this.recreateBoxes = this.recreateBoxes.bind(this);
    }

    componentDidMount() {
        window.addEventListener('resize', this.recreateBoxes);
        this.loadBoxes();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.recreateBoxes);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.boxesCoords !== this.props.boxesCoords) {
            this.loadBoxes();
        }
    }

    createLayoutBox(ref, box, type, checked = false) {
        return <LayoutBox
            ref={ref}
            key={box.id + box.top + box.left + box.bottom + box.right}  // hack to force re-render on prop changes that don't trigger state changes
            index={box.id}
            viewRef={this.viewRef}
            imageRef={this.imageRef}
            top={box.top}
            left={box.left}
            bottom={box.bottom}
            right={box.right}
            type={type}
            id={box.id}
            checked={box.checked || checked || false}
            updateMenu={this.updateMenu}
        />
    }

    /*
    Create box components using prop data.
     */
    loadBoxes() {
        const boxes = [];
        const groups = [];

        this.props.boxesCoords.forEach((group) => {
            const groupInfo = {
                ...group,
                squareRefs: []
            }

            groupInfo.squares.forEach((box) => {
                const ref = React.createRef();
                boxes.push(this.createLayoutBox(ref, box, groupInfo.type, groupInfo.checked));
                groupInfo.squareRefs.push(ref);
            });

            groups.push(groupInfo);
        })

        this.setState({boxes: boxes, groups: groups});
    }

    updateBoxes(boxes) {
        this.setState({boxesCoords: boxes}, this.loadBoxes);
    }

    /*
    Get the list of groups of boxes in the current page, with updated coordinates for the squares
     */
    getPageBoxes() {
        const groupsData = [];
        this.state.groups.forEach((group) => {
            const squares = [];
            group.squareRefs.forEach((ref) => {
                const details = ref.current.getBoxDetails();
                squares.push(details);
            });
            const updatedGroup = {
                ...group,
                squares: squares,
            }
            delete updatedGroup.squareRefs;
            groupsData.push(updatedGroup);
        });
        return groupsData;
    }

    getWindowWidth() {
        const width = window.innerWidth;
        const widthReduction = 600;

        return width - widthReduction;
    }

    /*
    Recreate box components without changes, e.g. when the window is resized and boxes must be re-rendered in new positions.
     */
    recreateBoxes() {
        this.state.groups.forEach((group) => {
            group.squareRefs.forEach((ref) => {
                ref.current.forceUpdate();
            });
        });
    }

    zoomIn() {
        this.zoom(1);
    }

    zoomOut() {
        this.zoom(-1);
    }

    zoomReset() {
        this.setState({imageZoom: 100}, this.recreateBoxes);
    }

    zoom(delta) {
        let newZoom = Math.max(this.state.imageZoom + (20 * delta), this.state.minImageZoom);
        newZoom = Math.min(newZoom, this.state.maxImageZoom);
        this.setState({imageZoom: newZoom}, this.recreateBoxes);
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

        if (this.props.segmentLoading) return;

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

        const x = e.clientX - this.viewRef.current.offsetLeft + this.viewRef.current.scrollLeft + window.scrollX;
        const y = e.clientY - this.viewRef.current.offsetTop + this.viewRef.current.scrollTop + window.scrollY;

        this.previewRef.current.updateCoordinates(y, x);
    }

    updateMenu() {
        this.props.updateBoxes(this.getPageBoxes());
    }

    dragEnd(e) {
        if (!this.state.dragging) return;

        const initialCoords = this.screenToImageCoordinates(this.state.initialCoords.x, this.state.initialCoords.y);
        const finalCoords = this.screenToImageCoordinates(e.clientX - this.viewRef.current.offsetLeft + this.viewRef.current.scrollLeft + window.scrollX, e.clientY - this.viewRef.current.offsetTop + this.viewRef.current.scrollTop + window.scrollY);

        if (finalCoords.x - initialCoords.x < 150 && finalCoords.y - initialCoords.y < 150) {
            finalCoords.x = Math.max(finalCoords.x, initialCoords.x + 150);
            finalCoords.y = Math.max(finalCoords.y, initialCoords.y + 150);
        }

        const newGroupData = {
            _uniq_id: Date.now().toString(36) + Math.random().toString(36),  // each line in the sortable list must have a constant unique ID
            groupId: this.props.pageIndex + "." + (this.state.groups.length + 1),
            checked: false,
            type: this.props.textModeState ? "text" : "remove",
            squares: [{
                        id: this.props.pageIndex + "." + (this.state.groups.length + 1),
                        top: initialCoords.y,
                        left: initialCoords.x,
                        bottom: finalCoords.y,
                        right: finalCoords.x,
                    }],
            copyId: undefined
        }

        this.previewRef.current.toggleVisibility();
        this.setState({ dragging: false }, () => {
            this.props.newGroup(newGroupData);
        });
    }

    render() {
        console.log("Rerendering image");
        return (
            <Box ref={this.viewRef}
                className="pageImageContainer">
                <img
                    ref={this.imageRef}
                    src={this.props.imageURL}
                    alt={`Página de ${this.props.imageURL}`}
                    className={"pageImage"}
                    style={{
                        maxWidth: `${this.state.imageZoom}%`,
                        maxHeight: `${this.state.imageZoom}%`,
                    }}

                    onDragStart={(e) => {
                        e.dataTransfer.setDragImage(transparentPixel, 0, 0);
                        this.dragStart(e);
                    }}
                    onDragOver={(e) => this.duringDrag(e)}
                    onDragEnd={(e) => this.dragEnd(e)}
                    onLoad={() => this.loadBoxes()}
                />

                {
                    this.state.boxes.map((box) => {
                        return box;
                    })
                }

                <LayoutPreview ref={this.previewRef} top={100} left={50} bottom={200} right={150}/>
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
    type: "text",
    checked: false,

    // functions:
    updateMenu: null
}

LayoutImage.defaultProps = {
    segmentLoading: null,
    textModeState: null,

    boxesCoords: null,
    pageIndex: null,
    imageURL: null,

    // functions:
    updateBoxes: null,
    newGroup: null
}

export default LayoutImage;
