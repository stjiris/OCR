import React from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import UndoIcon from '@mui/icons-material/Undo';
import SaveIcon from '@mui/icons-material/Save';

import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import SwapVertIcon from '@mui/icons-material/SwapVert';

import loadComponent from '../../../utils/loadComponents';

class BoxLine extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            menu: props.menu,
            box: props.box,
            size: props.size,
            spacing: false,
            dragging: false,
            top: 0,
        }
    }

    setSpacing(spacing) {
        this.setState({spacing: spacing});
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
            }, () => this.state.menu.boxDragged(this.state.box - 1, yCoord)
        );
    }

    endReorderBox(e) {
        var yCoord = Math.max(e.clientY - this.state.menu.menu.current.offsetTop - 20, 0);
        this.setState({dragging: false}, () => this.state.menu.boxDropped(this.state.box - 1, yCoord));
    }

    render() {
        return (
            <Box
                key={this.state.box + " " + this.state.size.top + " " + this.state.size.left + " " + this.state.size.bottom + " " + this.state.size.right + " " + this.state.spacing}
                sx={{
                    position: this.state.dragging ? 'absolute' : 'block',
                    zIndex: this.state.dragging ? 100 : 0,
                    width: this.state.dragging ? '80%' : '95%',
                    opacity: this.state.dragging ? 0.5 : 1,
                    top: `${this.state.top}px`,
                    right: this.state.dragging ? '0' : 'auto',
                    marginTop: this.state.spacing ? '2.8rem' : '0.3rem',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '2.1rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '5px',
                    padding: '0.3rem',
                    border: '2px solid #00f'
                }}
            >
                <Box
                    sx={{
                        backgroundColor: "#00f",
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
                <Box>
                    <IconButton sx={{
                        color: '#f00'
                    }} onClick={(e) => {
                        e.stopPropagation();
                        this.state.menu.deleteBox(this.state.box);
                    }}>
                        <DeleteForeverRoundedIcon/>
                    </IconButton>
                    <IconButton draggable sx={{
                        color: '#00f',
                        cursor: 'grab',
                    }}
                        onClick={(e) => this.orderingClick(e)}
                        onDragStart={(e) => {this.startDrag(e)}}
                        onDrag={(e) => {this.reorderBox(e)}}
                        onDragEnd={(e) => {this.endReorderBox(e)}}
                    >
                        <SwapVertIcon/>
                    </IconButton>
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
            uncommittedChanges: false,
        }

        this.boxRefs = [];

        this.image = React.createRef();
        this.menu = React.createRef();
        this.confirmLeave = React.createRef();

        this.warningNot = React.createRef();
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

            this.setState({contents: contents}, () => {this.generateBoxes(); this.image.current.loadBoxes()});
        });
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

    deleteBox(index) {
        var boxes = this.image.current.getAllBoxes();
        var contents = this.state.contents;
        boxes.splice(index - 1, 1);
        contents[this.state.page - 1]["boxes"] = boxes;

        this.setState({contents: contents, uncommittedChanges: true}, () => {
            this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
            this.generateBoxes();
            window.addEventListener('beforeunload', this.preventExit);
        });
    }

    boxDragged(box, yCoord) {
        var boxes = this.boxRefs;

        var spacingBox = Math.max(Math.floor((yCoord - 20) / 48), 0);

        for (var i = 0; i < boxes.length; i++) {
            boxes[i].current.setSpacing(false);
            if (i === box) continue;
            if (spacingBox === 0) {
                boxes[i].current.setSpacing(true);
                break;
            }
            spacingBox -= 1;
        }

        for (var j = i + 1; j < boxes.length; j++) {
            boxes[j].current.setSpacing(false);
        }
    }

    boxDropped(boxIndex, yCoord) {
        var contents = this.state.contents;
        var boxes = this.boxRefs;
        var pageBoxes = contents[this.state.page - 1]["boxes"];

        var box = pageBoxes[boxIndex];
        pageBoxes.splice(boxIndex, 1);

        for (var i = 0; i < boxes.length; i++) {
            boxes[i].current.setSpacing(false);
        }

        var spacingBox = Math.max(Math.floor((yCoord - 20) / 48), 0);

        pageBoxes.splice(spacingBox, 0, box);
        contents[this.state.page - 1]["boxes"] = pageBoxes;

        this.setState({contents: contents, uncommittedChanges: true}, () => {
            this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
            this.generateBoxes();
            window.addEventListener('beforeunload', this.preventExit);
        });
    }

    generateBoxes() {
        var boxes = this.state.contents[this.state.page - 1]["boxes"];
        var newBoxes = [];
        var boxRefs = [];

        for (var i = 0; i < boxes.length; i++) {
            var ref = React.createRef();
            newBoxes.push(
                <BoxLine     
                    classList="box"
                    ref={ref}
                    key={i + " " + boxes[i].top + " " + boxes[i].left + " " + boxes[i].bottom + " " + boxes[i].right}
                    menu={this}
                    box={i+1}
                    size={boxes[i]}
                />
            )
            boxRefs.push(ref);
        }
        this.boxRefs = boxRefs;
        this.setState({boxes: newBoxes});
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

    GenerateLayoutAutomatically() {
        const path = this.state.filesystem.state.current_folder.join("/");
        fetch(process.env.REACT_APP_API_URL + 'generate-automatic-layouts?path=' + path + "/" + this.state.filename, {
            method: 'GET'
        }).then(response => {return response.json()})
        .then(data => {
            var contents = data["layouts"].sort((a, b) =>
                (a["page_url"] > b["page_url"]) ? 1 : -1
            )

            this.setState({contents: contents}, () => {this.generateBoxes(); this.image.current.loadBoxes()});
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

                    <Box>
                        <Button
                                    disabled={this.state.buttonsDisabled}
                                    variant="contained"
                                    onClick={() => this.GenerateLayoutAutomatically()}
                                    sx={{border: '1px solid black', mr: '1rem'}}
                                >
                                    Gerar caixas automaticamente
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
                        <span style={{fontSize: '20px'}}><b>Caixas de Texto</b></span>
                        {
                            this.state.boxes
                        }
                    </Box>
                </Box>
            </>
        )
    }
}