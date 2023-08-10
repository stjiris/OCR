import React from 'react';

import Box from '@mui/material/Box';
import Icon from '@mui/material/Icon';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import UndoIcon from '@mui/icons-material/Undo';
import SaveIcon from '@mui/icons-material/Save';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import DoNotDisturbAltIcon from '@mui/icons-material/DoNotDisturbAlt';

import loadComponent from '../../../utils/loadComponents';
import { FormControl } from '@mui/material';

class BoxLine extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menu: props.menu,
            box: props.box,
            size: props.size,
            spacing: false,
            lastSpacing: false,
            dragging: false,
            top: 0,

            open: false,

            type: props.type || "text",
        }
    }

    setSpacing(spacing) {
        this.setState({spacing: spacing});
    }

    setLastSpacing(spacing) {
        this.setState({lastSpacing: spacing});
    }

    orderingClick(e) {
        e.stopPropagation();
        this.state.menu.showWarningNotification("Arraste a caixa para a posição pretendida.");
    }

    startDrag(e) {
        e.dataTransfer.setDragImage(e.target, -1000, -1000);
    }

    reorderBox(e) {
        var yCoord = Math.max(e.clientY - this.state.menu.menu.current.offsetTop - 20, 0);
        this.setState(
            {
                top: yCoord,
                dragging: true
            }, () => this.state.menu.boxDragged(this.state.type, this.state.box - 1, yCoord)
        );
    }

    endReorderBox(e) {
        var yCoord = Math.max(e.clientY - this.state.menu.menu.current.offsetTop - 20, 0);
        this.setState({dragging: false}, () => this.state.menu.boxDropped(this.state.type, this.state.box - 1, yCoord));
    }

    changeType(e) {
        this.state.menu.changeBoxType(this.state.box, this.state.type, e.target.value);
        this.setState({type: e.target.value});
    }

    closeMenu() {
        this.setState({open: false});
    }

    toggleMenu(e) {
        e.stopPropagation();
        if (!this.state.open)
            this.state.menu.closeAllMenus();

        this.setState({open: !this.state.open});
    }

    addBoxToAllPages(e) {
        e.stopPropagation();
        var box = this.state.size;
        box["type"] = this.state.type;
        this.state.menu.addBoxToAllPages(box);
    }

    render() {
        const TooltipIcon = loadComponent('TooltipIcon', 'TooltipIcon');
        const DraggableTooltipIcon = loadComponent('TooltipIcon', 'DraggableTooltipIcon')

        return (
            <Box
                key={this.state.box + " " + this.state.size.top + " " + this.state.size.left + " " + this.state.size.bottom + " " + this.state.size.right + " " + this.state.spacing}
                sx={{
                    position: this.state.dragging ? 'absolute' : 'relative',
                    zIndex: this.state.dragging ? 100 : 0,
                    width: '95%',
                    opacity: this.state.dragging ? 0.5 : 1,
                    top: `${this.state.top}px`,
                    right: this.state.dragging ? '0' : 'auto',
                    marginTop: this.state.spacing ? '2.8rem' : '0.3rem',
                    marginBottom: this.state.lastSpacing ? '2.8rem' : '0rem',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '2.1rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '5px',
                    padding: '0.3rem',
                    border: this.state.type === "text" ? '2px solid #00f' : this.state.type === "image" ? '2px solid #08A045' : '2px solid #F05E16',
                }}
            >
                {
                    this.state.open
                    ? <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '60%',
                        transform: 'translate(-50%, -50%)',
                        border: '1px solid #000',
                        height: '90%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#f5f5f5',
                        zIndex: '100',
                        borderRadius: '5px',
                        padding: '0rem 0.5rem',
                        cursor: 'pointer',
                    }}
                    onClick={(e) => alert("Hey")}
                    >
                        <span>Copiar para as outras páginas</span>
                    </Box>
                    : null
                }
                <Box
                    sx={{
                        backgroundColor: this.state.type === "text" ? "#00f" : this.state.type === "image" ? "#08A045" : "#F05E16",
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "white",
                    }}
                >
                    <span><b>{this.state.box}</b></span>
                </Box>
                <Box>
                    <span>{Math.round(this.state.size.right - this.state.size.left)} x {Math.round(this.state.size.bottom - this.state.size.top)} pxs</span>
                </Box>
                <FormControl variant="standard" size="small">
                    <Select
                        value={this.state.type}
                        onChange={(e) => {
                            this.changeType(e)
                        }}
                    >
                        <MenuItem value={"text"}>
                            <Icon>
                                <TextFieldsIcon sx={{color: "#00f"}}/>
                            </Icon>
                        </MenuItem>
                        <MenuItem value={"image"}>
                            <Icon>
                                <ImageIcon sx={{color: "#08A045"}}/>
                            </Icon>
                        </MenuItem>
                        <MenuItem value={"ignore"}>
                            <Icon>
                                <DoNotDisturbAltIcon sx={{color: "#f00"}}/>
                            </Icon>
                        </MenuItem>
                    </Select>
                </FormControl>
                <Box sx={{display: 'flex', flexDirection: 'row'}}>
                    <TooltipIcon
                        color="#f00"
                        message="Apagar"
                        padding="2px"
                        icon={<DeleteForeverRoundedIcon/>}
                        clickFunction={(e) => {
                            e.stopPropagation();
                            this.state.menu.deleteBox(this.state.type, this.state.box);
                        }}
                    />

                    <TooltipIcon
                        color={this.state.type === "text" ? '#00f' : this.state.type === "image" ? '#08A045' : '#F05E16'}
                        message="Copiar para as outras páginas"
                        padding="2px"
                        icon={<ContentCopyIcon/>}
                        clickFunction={(e) => this.addBoxToAllPages(e)}
                    />

                    <DraggableTooltipIcon
                        color={this.state.type === "text" ? '#00f' : this.state.type === "image" ? '#08A045' : '#F05E16'}
                        message="Ordenar"
                        padding="2px"
                        icon={<SwapVertIcon/>}
                        clickFunction={(e) => this.orderingClick(e)}
                        dragStartFunction={(e) => {this.startDrag(e)}}
                        dragFunction={(e) => {this.reorderBox(e)}}
                        dragEndFunction={(e) => {this.endReorderBox(e)}}
                    />
                    
                </Box>
            </Box>
        )
    }
}

export default class LayoutMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filesystem: props.filesystem,
            filename: props.filename,
            contents: [],
            page: 1,

            boxes: [],
            images: [],
            ignore: [],
            uncommittedChanges: false,
        }

        this.boxRefs = [];
        this.imageRefs = [];
        this.ignoreRefs = [];

        this.image = React.createRef();
        this.menu = React.createRef();
        this.confirmLeave = React.createRef();

        this.warningNot = React.createRef();
        this.textBox = React.createRef();
        this.imageBox = React.createRef();
        this.ignoreBox = React.createRef();
    }

    preventExit(event) {
        event.preventDefault();
        event.returnValue = '';
    }

    componentDidMount() {
        const path = this.state.filesystem.state.current_folder.join("/");

        fetch(process.env.REACT_APP_API_URL + 'get-layouts?path=' + path + "/" + this.state.filename, {
            method: 'GET'
        }).then(response => {return response.json()})
        .then(data => {
            var contents = data["layouts"].sort((a, b) =>
                (a["page_url"] > b["page_url"]) ? 1 : -1
            )

            for (var i = 0; i < contents.length; i++) {
                if (contents[i]["type"] === null) {
                    contents[i]["type"] = "text";
                }
            }

            this.setState({contents: contents}, () => {this.generateBoxes(); this.image.current.loadBoxes()});
        });
    }

    closeAllMenus() {
        for (var i = 0; i < this.boxRefs.length; i++) {
            this.boxRefs[i].current.closeMenu();
        }
        for (i = 0; i < this.imageRefs.length; i++) {
            this.imageRefs[i].current.closeMenu();
        }
        for (i = 0; i < this.ignoreRefs.length; i++) {
            this.ignoreRefs[i].current.closeMenu();
        }
    }

    addBoxToAllPages(box) {
        var contents = this.state.contents;
        for (var i = 0; i < contents.length; i++) {
            if (this.state.page - 1 === i) continue;
            contents[i]["boxes"].push(box);
        }
        this.setState({contents: contents});
    }

    changePage(increment) {
        var boxes = this.image.current.getAllBoxes();
        var contents = this.state.contents;
        contents[this.state.page - 1]["boxes"] = boxes;

        var page = this.state.page + increment;
        this.setState({page: page, contents: contents}, this.generateBoxes);
    }

    updateBoxes(boxes) {
        var contents = this.state.contents;
        contents[this.state.page - 1]["boxes"] = boxes;
        this.setState({contents: contents, uncommittedChanges: true}, this.generateBoxes);
        window.addEventListener('beforeunload', this.preventExit);
    }

    typeIndexToGlobalIndex(boxes, type, index) {
        for (var i = 0; i < boxes.length; i++) {
            if (boxes[i]["type"] === type) {
                index -= 1;
                if (index === 0) {
                    return i;
                }
            }
        }
    }

    deleteBox(type, index) {
        var boxes = this.image.current.getAllBoxes();
        var contents = this.state.contents;
        boxes.splice(this.typeIndexToGlobalIndex(boxes, type, index), 1);
        contents[this.state.page - 1]["boxes"] = boxes;

        this.setState({contents: contents, uncommittedChanges: true}, () => {
            this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
            this.generateBoxes();
            window.addEventListener('beforeunload', this.preventExit);
        });
    }

    changeBoxType(index, previousType, newType) {
        var contents = this.state.contents;
        var pageBoxes = this.image.current.getAllBoxes();

        var globalIndex = this.typeIndexToGlobalIndex(pageBoxes, previousType, index);
        var box = pageBoxes[globalIndex];
        pageBoxes.splice(globalIndex, 1);
        box["type"] = newType;

        for (var i = pageBoxes.length - 1; i >= 0; i--) {
            if (pageBoxes[i]["type"] === newType) {
                pageBoxes.splice(i + 1, 0, box);
                break;
            }
        }
        if (i === -1) {
            pageBoxes.push(box);
        }

        contents[this.state.page - 1]["boxes"] = pageBoxes;
        this.setState({contents: contents, uncommittedChanges: true}, () => {
            this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
            this.generateBoxes();
            window.addEventListener('beforeunload', this.preventExit);
        });
    }

    boxDragged(type, box, yCoord) {
        var boxes, container;
        if (type === "text") {
            boxes = this.boxRefs;
            container = this.textBox
        } else if (type === "image") {
            boxes = this.imageRefs;
            container = this.imageBox;
        } else if (type === "ignore") {
            boxes = this.ignoreRefs;
            container = this.ignoreBox;
        }

        yCoord -= container.current.offsetTop;

        var spacingBox = Math.max(Math.floor((yCoord - 20) / 48), 0);

        for (var i = 0; i < boxes.length; i++) {
            boxes[i].current.setSpacing(false);
            boxes[i].current.setLastSpacing(false);
        }

        var found = false;
        for (i = 0; i < boxes.length; i++) {
            if (i === box) continue;
            if (spacingBox === 0) {
                boxes[i].current.setSpacing(true);
                found = true;
                break;
            }
            spacingBox -= 1;
        }

        if (!found) {
            boxes[boxes.length - 1].current.setLastSpacing(true);
        }
    }

    boxDropped(type, boxIndex, yCoord) {
        var boxes, container;
        if (type === "text") {
            boxes = this.boxRefs;
            container = this.textBox
        } else if (type === "image") {
            boxes = this.imageRefs;
            container = this.imageBox;
        } else if (type === "ignore") {
            boxes = this.ignoreRefs;
            container = this.ignoreBox;
        }

        for (var i = 0; i < boxes.length; i++) {
            boxes[i].current.setSpacing(false);
            boxes[i].current.setLastSpacing(false);
        }

        var contents = this.state.contents;
        var pageBoxes = this.image.current.getAllBoxes();

        var globalIndex = this.typeIndexToGlobalIndex(pageBoxes, type, boxIndex + 1);
        var box = pageBoxes[globalIndex];

        pageBoxes.splice(globalIndex, 1);

        yCoord -= container.current.offsetTop;
        var spacingBox = Math.max(Math.floor((yCoord - 20) / 48), 0);

        for (var j = 0; j < pageBoxes.length; j++) {
            if (pageBoxes[j]["type"] === type) {
                spacingBox -= 1;
                if (spacingBox === -1) {
                    break;
                }
            }
        }

        pageBoxes.splice(j, 0, box);
        contents[this.state.page - 1]["boxes"] = pageBoxes;

        this.setState({contents: contents, uncommittedChanges: true}, () => {
            this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
            this.generateBoxes();
            window.addEventListener('beforeunload', this.preventExit);
        });
    }

    createBoxLine(ref, index, box, type) {
        return <BoxLine
            classList="box"
            ref={ref}
            key={index + " " + box.top + " " + box.left + " " + box.bottom + " " + box.right + " " + type}
            menu={this}
            box={index+1}
            size={box}
            type={type}
        />
    }

    generateBoxes() {
        var boxes = this.state.contents[this.state.page - 1]["boxes"];
        var newBoxes = [];
        var imageBoxes = [];
        var ignoreBoxes = [];

        var boxRefs = [];
        var imageRefs = [];
        var ignoreRefs = [];

        for (var i = 0; i < boxes.length; i++) {
            var ref = React.createRef();
            var type = boxes[i]["type"] || "text";

            var boxesList;
            var refsList;
            
            if (type === "text") {
                boxesList = newBoxes;
                refsList = boxRefs;
            } else if (type === "image") {
                boxesList = imageBoxes;
                refsList = imageRefs;
            } else if (type === "ignore") {
                boxesList = ignoreBoxes;
                refsList = ignoreRefs;
            }

            var box = this.createBoxLine(ref, boxesList.length, boxes[i], type);
            boxesList.push(box);
            refsList.push(ref);
        }

        this.boxRefs = boxRefs;
        this.imageRefs = imageRefs;
        this.ignoreRefs = ignoreRefs;

        this.setState({boxes: newBoxes, images: imageBoxes, ignore: ignoreBoxes});
    }

    goBack() {
        if (this.state.uncommittedChanges) {
            this.confirmLeave.current.toggleOpen();
        } else {
            window.removeEventListener('beforeunload', this.preventExit);
            this.state.filesystem.setState({layoutMenu: false});
        }
    }

    leave() {
        window.removeEventListener('beforeunload', this.preventExit);
        this.state.filesystem.setState({layoutMenu: false})
        this.confirmLeave.current.toggleOpen();
    }

    saveLayout() {
        fetch(process.env.REACT_APP_API_URL + 'save-layouts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: this.state.filesystem.state.current_folder.join("/") + "/" + this.state.filename,
                layouts: this.state.contents  
            })
        }).then(response => {return response.json()})
        .then(data => {
            if (data["success"]) {
                this.setState({uncommittedChanges: false});
                this.state.filesystem.setState({layoutMenu: false})
            } else {
                alert("Erro inesperado ao guardar o layout.")
            }
        });
    }

    showWarningNotification(message) {
        this.warningNot.current.setMessage(message);
        this.warningNot.current.open();
    }

    render() {
        const LayoutImage = loadComponent('LayoutMenu', 'LayoutImage');
        const ConfirmLeave = loadComponent('EditPage', 'ConfirmLeave');
        const Notification = loadComponent('Notification', 'Notifications');
        
        return (
            <>
                <Notification message={""} severity={"warning"} ref={this.warningNot}/>
                <ConfirmLeave page={this} ref={this.confirmLeave}/>
                <Box sx={{
                    ml: '1.5rem',
                    mr: '1.5rem',
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: '#fff',
                    paddingBottom: '1rem',
                    marginBottom: '0.5rem',
                    borderBottom: '1px solid black',
                }}>
                    <Button
                        disabled={this.state.buttonsDisabled}
                        variant="contained"
                        startIcon={<UndoIcon />}
                        sx={{backgroundColor: '#ffffff', color: '#000000', border: '1px solid black', mr: '1rem', ':hover': {bgcolor: '#ddd'}}}
                        onClick={() => this.goBack()}
                    >
                        Voltar atrás
                    </Button>

                    <Button
                        disabled={this.state.buttonsDisabled}
                        variant="contained"
                        color="success"
                        startIcon={<SaveIcon />}
                        sx={{border: '1px solid black'}}
                        onClick={() => this.saveLayout()}
                    >
                        Guardar
                    </Button>
                </Box>
                <Box ref={this.menu} sx={{
                    display: 'flex',
                    flexDirection: 'row',
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        <Box>
                            {
                                this.state.contents.length === 0
                                ? null
                                : <LayoutImage ref={this.image} menu={this} boxesCoords={this.state.contents[this.state.page - 1]["boxes"]} key={this.state.page - 1} image={this.state.contents[this.state.page - 1]["page_url"]}/>
                            }
                        </Box>
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'center',
                        }}>
                            <IconButton disabled={this.state.page === 1} onClick={() => this.changePage(-1)}>
                                <ArrowBackIosRoundedIcon/>
                            </IconButton>
                            <p>Page {this.state.page} / {this.state.contents.length}</p>
                            <IconButton disabled={this.state.page === this.state.contents.length} onClick={() => this.changePage(1)}>
                                <ArrowForwardIosRoundedIcon/>
                            </IconButton>
                        </Box>
                    </Box>

                    <Box sx={{
                        position: 'relative',
                        marginLeft: '1rem',
                        width: '290px',
                        display: 'flex',
                        flexDirection: 'column',
                        // height: `${window.innerHeight - 250}px`
                        // overflowY: 'scroll'
                    }}>
                        <Box ref={this.textBox}>
                            <span style={{fontSize: '20px'}}><b>Texto</b></span>
                            {
                                this.state.boxes.length === 0
                                ? <><br/><span>Não existem caixas nesta página.</span></>
                                : this.state.boxes
                            }
                        </Box>

                        <Box ref={this.imageBox}>
                            <span style={{fontSize: '20px'}}><b>Imagens</b></span>
                            {
                                this.state.images.length === 0
                                ? <><br/><span>Não existem imagens nesta página.</span></>
                                : this.state.images
                            }
                        </Box>

                        <Box ref={this.ignoreBox}>
                            <span style={{fontSize: '20px'}}><b>Ignorar</b></span>
                            {
                                this.state.ignore.length === 0
                                ? <><br/><span>Não existem elementos ignorados nesta página.</span></>
                                : this.state.ignore
                            }
                        </Box>
                    </Box>
                </Box>
            </>
        )
    }
}