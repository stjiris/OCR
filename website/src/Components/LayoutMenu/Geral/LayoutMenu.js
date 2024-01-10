import React from 'react';
import { v4 as uuidv4 } from 'uuid';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import UndoIcon from '@mui/icons-material/Undo';
import SaveIcon from '@mui/icons-material/Save';

import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import CallSplitIcon from '@mui/icons-material/CallSplit';

import loadComponent from '../../../utils/loadComponents';

import { Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

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

            selectedRows: [],
        }

        this.boxRefs = [];
        this.imageRefs = [];
        this.ignoreRefs = [];

        this.image = React.createRef();
        this.menu = React.createRef();
        this.confirmLeave = React.createRef();

        this.warningNot = React.createRef();
        this.successNot = React.createRef();
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
                (a["page_number"] > b["page_number"]) ? 1 : -1
            )

            for (var i = 0; i < contents.length; i++) {
                var groups = contents[i]["boxes"];
                for (var j = 0; j < groups.length; j++) {
                    groups[j]["checked"] = false;
                }
            }
        
            this.setState({contents: contents}, () => {
                this.generateBoxes();
                this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
            });
        });
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
        this.setState({page: page, contents: contents}, () => {
            this.generateBoxes();
            this.image.current.loadBoxes();
            // this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
        });
    }

    updateBoxes(groups) {
        var contents = this.state.contents;
        contents[this.state.page - 1]["boxes"] = groups;

        for (var i = 0; i < groups.length; i++) {
            var group = groups[i];

            if (group["copyId"] !== undefined) {

                for (var j = 0; j < contents.length; j++) {

                    var c_boxes = contents[j]["boxes"];

                    for (var k = 0; k < c_boxes.length; k++) {
                        if (c_boxes[k]["copyId"] === group["copyId"]) {
                            // Make an independent copy of the box
                            var newBox = JSON.parse(JSON.stringify(group));
                            newBox["id"] = c_boxes[k]["id"];
                            c_boxes[k] = newBox;

                            contents[j]["boxes"] = this.renameGroups(c_boxes, j + 1);

                            break;
                        }
                    }
                }
            }
        }


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

    createBoxLine(box, type, index) {
        return {
            id: box.id || type[0].toUpperCase() + this.state.page + "." + index,
            pxs: `${Math.round(box.right - box.left)} x ${Math.round(box.bottom - box.top)}`,
            type: type,
            size: box
        }
    }

    generateBoxes() {
        var boxes = this.state.contents[this.state.page - 1]["boxes"];
        var newBoxes = [];

        for (var i = 0; i < boxes.length; i++) {
            var type = boxes[i]["type"] || "text";
            var box = this.createBoxLine(boxes[i], type, i + 1);
            newBoxes.push(box);
        }

        this.setState({boxes: newBoxes});
    }

    goBack() {
        if (this.state.uncommittedChanges) {
            this.confirmLeave.current.toggleOpen();
        } else {
            window.removeEventListener('beforeunload', this.preventExit);
            this.state.filesystem.closeLayoutMenu();
        }
    }

    leave() {
        window.removeEventListener('beforeunload', this.preventExit);
        this.state.filesystem.closeLayoutMenu();
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
                this.state.filesystem.closeLayoutMenu();
            } else {
                alert("Erro inesperado ao guardar o layout.")
            }
        });
    }

    GenerateLayoutAutomatically() {
        const path = this.state.filesystem.state.current_folder.join("/");

        this.successNot.current.setMessage("A gerar layouts automaticamente... Por favor aguarde.");
        this.successNot.current.open();

        fetch(process.env.REACT_APP_API_URL + 'generate-automatic-layouts?path=' + path + "/" + this.state.filename, {
            method: 'GET'
        }).then(response => {return response.json()})
        .then(data => {
            var contents = data["layouts"].sort((a, b) =>
                (a["page_number"] > b["page_number"]) ? 1 : -1
            )

            this.setState({contents: contents}, () => {
                this.generateBoxes();
                this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
            });
        });
    }

    cleanAllBoxes() {
        var contents = this.state.contents;
        for (var i = 0; i < contents.length; i++) {
            contents[i]["boxes"] = [];
        }
        this.setState({contents: contents}, () => {
            this.generateBoxes();
            this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
        });
    }

    showWarningNotification(message) {
        this.warningNot.current.setMessage(message);
        this.warningNot.current.open();
    }

    commitAllCheckBoxes(e) {
        var contents = this.state.contents;
        var boxes = contents[this.state.page - 1]["boxes"];

        for (var i = 0; i < boxes.length; i++) {
            boxes[i]["checked"] = e.target.checked;
        }

        this.setState({contents: contents}, () => {
            this.generateBoxes();
            this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
        });
    }

    changeChecked(e, index) {
        var contents = this.state.contents;
        var boxes = contents[this.state.page - 1]["boxes"];
        boxes[index]["checked"] = e.target.checked;

        this.setState({contents: contents}, () => {
            this.generateBoxes();
            this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
        });
    }

    allCheckboxesAreChecked() {
        var contents = this.state.contents;
        if (contents.length === 0) return false;
        if (contents[this.state.page - 1] === undefined) return false;

        var boxes = contents[this.state.page - 1]["boxes"];
        if (boxes.length === 0) return false;

        for (var i = 0; i < boxes.length; i++) {
            if (!boxes[i]["checked"]) {
                return false;
            }
        }

        return true;
    }

    renameGroups(groups, page) {
        var textGroups = groups.filter(e => e["type"] === "text");
        var imageGroups = groups.filter(e => e["type"] === "image");
        var ignoreGroups = groups.filter(e => e["type"] === "ignore");

        groups = textGroups.concat(imageGroups).concat(ignoreGroups);

        for (var i = 0; i < groups.length; i++) {

            var boxes = groups[i]["squares"];

            for (var j = 0; j < boxes.length; j++) {
                var box = boxes[j];

                let id;
                if (boxes.length === 1) {
                    id = groups[i].type[0].toUpperCase() + (page) + "." + (i + 1);
                } else {
                    id = groups[i].type[0].toUpperCase() + (page) + "." + (i + 1) + "." + (j + 1);
                }
                box["id"] = id;
            }
            // newGroups.push(newGroup);
        }

        return groups;
    }

    deleteCheckedBoxes() {
        var contents = this.state.contents;
        var boxes = contents[this.state.page - 1]["boxes"];

        var keeping = [];

        for (var i = 0; i < boxes.length; i++) {
            if (!boxes[i]["checked"]) {
                keeping.push(boxes[i]);
            }
        }

        contents[this.state.page - 1]["boxes"] = this.renameGroups(keeping, this.state.page);
        this.setState({contents: contents}, () => {
            this.generateBoxes();
            this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
        });
    }

    makeBoxCopy() {
        var contents = this.state.contents;
        var groups = contents[this.state.page - 1]["boxes"];

        for (var i = 0; i < groups.length; i++) {
            if (groups[i].checked) {
                let copyId = groups[i]["copyId"] || uuidv4();
                groups[i]["copyId"] = copyId;
                groups[i]["checked"] = false;

                for (var j = 0; j < contents.length; j++) {
                    var c_groups = contents[j]["boxes"];
                    if (!c_groups.some(e => e["copyId"] === copyId)) {
                        // Create an independent copy of the group
                        var group = JSON.parse(JSON.stringify(groups[i]));

                        c_groups.push(group);
                        contents[j]["boxes"] = this.renameGroups(c_groups, j + 1);
                    }
                }
            }
        }

        this.setState({contents: contents}, () => {
            this.generateBoxes();
            this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
        });
    }

    groupCheckedBoxes() {
        var contents = this.state.contents;
        var groups = contents[this.state.page - 1]["boxes"];

        var newGroups = [];
        var joined = [];
        var insertIndex = -1;
        for (var i = 0; i < groups.length; i++) {
            if (groups[i].checked) {
                if (insertIndex === -1) {
                    insertIndex = i;
                }
                joined = joined.concat(groups[i]["squares"]);
            } else {
                newGroups.push(groups[i]);
            }
        }

        var newGroup = {
            type: "text",
            squares: joined,
            checked: false,
        }

        newGroups.splice(insertIndex, 0, newGroup);

        contents[this.state.page - 1]["boxes"] = this.renameGroups(newGroups, this.state.page);
        this.setState({contents: contents}, () => {
            this.generateBoxes();
            this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
        });
    }

    splitCheckedBoxes() {
        var contents = this.state.contents;
        var groups = contents[this.state.page - 1]["boxes"];

        var newGroups = [];

        for (var i = 0; i < groups.length; i++) {
            if (groups[i].checked) {
                for (var j = 0; j < groups[i]["squares"].length; j++) {
                    newGroups.push({
                        type: "text",
                        squares: [groups[i]["squares"][j]],
                        checked: false,
                    });
                }
            } else {
                newGroups.push(groups[i]);
            }
        }

        contents[this.state.page - 1]["boxes"] = this.renameGroups(newGroups, this.state.page);
        this.setState({contents: contents}, () => {
            this.generateBoxes();
            this.image.current.updateBoxes(this.state.contents[this.state.page - 1]["boxes"]);
        });
    }

    render() {
        const LayoutImage = loadComponent('LayoutMenu', 'LayoutImage');
        const ConfirmLeave = loadComponent('EditPage', 'ConfirmLeave');
        const Notification = loadComponent('Notification', 'Notifications');

        var noCheckBoxActive = false;
        if (this.state.contents.length !== 0) {
            noCheckBoxActive = !this.state.contents[this.state.page - 1]["boxes"].some(e => e["checked"]);
            var groupDisabled = noCheckBoxActive || this.state.contents[this.state.page - 1]["boxes"].some(e => e["checked"] && e["copyId"] !== undefined) ||
                this.state.contents[this.state.page - 1]["boxes"].map(e => e["checked"]).filter(Boolean).length <= 1 ||
                this.state.contents[this.state.page - 1]["boxes"].some(e => e["checked"] && e["type"] !== "text");
            var separateDisabled = noCheckBoxActive || this.state.contents[this.state.page - 1]["boxes"].some(e => e["checked"] && e["squares"].length === 1);

            var copyDisabled = noCheckBoxActive || this.state.contents[this.state.page - 1]["boxes"].some(e => e["checked"] && e["squares"].length !== 1)
        }


        return (
            <>
                <Notification message={""} severity={"warning"} ref={this.warningNot}/>
                <Notification message={""} severity={"success"} ref={this.successNot}/>
                <ConfirmLeave page={this} ref={this.confirmLeave}/>
                <Box sx={{
                    ml: '0.5rem',
                    mr: '0.5rem',
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
                        startIcon={<UndoIcon/>}
                        onClick={() => this.goBack()}
                        sx={{
                            border: '1px solid black',
                            height: '2rem',
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            backgroundColor: '#ffffff',
                            color: '#000000',
                            ':hover': {bgcolor: '#ddd'}
                        }}
                    >
                        Voltar
                    </Button>

                    <Box>
                        <Button
                            disabled={this.state.buttonsDisabled}
                            variant="contained"
                            onClick={() => this.cleanAllBoxes()}
                            startIcon={<DeleteRoundedIcon/>}
                            sx={{
                                border: '1px solid black', 
                                mr: '1rem',
                                height: '2rem',
                                textTransform: 'none',
                                fontSize: '0.75rem',
                            }}
                        >
                            Limpar Tudo
                        </Button>
                        <Button
                            disabled={this.state.buttonsDisabled}
                            variant="contained"
                            onClick={() => this.GenerateLayoutAutomatically()}
                            sx={{
                                border: '1px solid black', 
                                mr: '1rem',
                                height: '2rem',
                                textTransform: 'none',
                                fontSize: '0.75rem',
                            }}
                        >
                            Segmentar automaticamente
                        </Button>
                        <Button
                            disabled={this.state.buttonsDisabled}
                            variant="contained"
                            color="success"
                            startIcon={<SaveIcon />}
                            sx={{
                                border: '1px solid black',
                                height: '2rem',
                                textTransform: 'none',
                                fontSize: '0.75rem',
                            }}
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
                                : <LayoutImage ref={this.image} menu={this} boxesCoords={this.state.contents[this.state.page - 1]["boxes"]} key={this.state.page - 1} pageIndex={this.state.page} image={this.state.contents[this.state.page - 1]["page_url"]}/>
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

                    <Box sx={{display: "flex", flexDirection: "column", width: "100%", ml: '0.5rem', mr: '0.5rem'}}>
                        <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-evenly", alignItems: "center"}}>
                            <Button
                                disabled={copyDisabled}
                                variant="text"
                                startIcon={<ContentCopyIcon/>}
                                onClick={() => this.makeBoxCopy()}
                                sx={{
                                    textTransform: 'none',
                                }}
                            >
                                Copiar
                            </Button>

                            <Button
                                disabled={groupDisabled}
                                variant="text"
                                startIcon={<CallMergeIcon/>}
                                onClick={() => this.groupCheckedBoxes()}
                                sx={{
                                    textTransform: 'none',
                                }}
                            >
                                Agrupar
                            </Button>

                            <Button
                                disabled={separateDisabled}
                                variant="text"
                                startIcon={<CallSplitIcon/>}
                                onClick={() => this.splitCheckedBoxes()}
                                sx={{
                                    textTransform: 'none',
                                }}
                            >
                                Separar
                            </Button>

                            <Button
                                disabled={noCheckBoxActive}
                                color="error"
                                variant="text"
                                startIcon={<DeleteRoundedIcon />}
                                onClick={() => this.deleteCheckedBoxes()}
                                sx={{
                                    textTransform: 'none',
                                }}
                            >
                                Apagar
                            </Button>

                        </Box>

                        <TableContainer sx={{width: "100%", maxHeight: `${window.innerHeight - 197}px`, border: '1px solid #aaa'}}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell align='center' sx={{borderBottom: '1px solid #aaa'}}>
                                            <Checkbox checked={this.allCheckboxesAreChecked()} sx={{m:0, p:0}} onChange={(e) =>this.commitAllCheckBoxes(e)}/>
                                        </TableCell>
                                        <TableCell align='center' sx={{borderBottom: '1px solid #aaa'}}><b>ID</b></TableCell>
                                        <TableCell align='center' sx={{borderBottom: '1px solid #aaa'}}><b>Pixels</b></TableCell>
                                        <TableCell align='center' sx={{borderBottom: '1px solid #aaa'}}><b>Tipo</b></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {
                                        this.state.contents.length === 0 || this.state.contents[this.state.page-1] === undefined
                                        ? null
                                        : this.state.contents[this.state.page-1]["boxes"].map((group, index) => {
                                            return <TableRow key={index + " " + group.checked} sx={{borderBottom: '1px solid #aaa'}}>
                                                <TableCell align='center' sx={{borderBottom: '1px solid #aaa'}}>
                                                    <Checkbox checked={group.checked} sx={{m:0, p:0}} onClick={(e) => this.changeChecked(e, index)}/>
                                                </TableCell>
                                                <TableCell align='center' sx={{borderBottom: '1px solid #aaa'}}>
                                                    <Box>
                                                        {
                                                            group["squares"].map((box, index) => {
                                                            return (<Box
                                                                sx = {{
                                                                    backgroundColor: "#00f",
                                                                    borderRadius: '10px',
                                                                    justifyContent: 'center',
                                                                    display: 'flex',
                                                                    color: '#fff',
                                                                    margin: '0.25rem',
                                                                }}    
                                                            >
                                                                {box.id}    
                                                            </Box>);
                                                            })
                                                        }
                                                    </Box>
                                                </TableCell>
                                                <TableCell align='center' sx={{borderBottom: '1px solid #aaa'}}>
                                                    <Box sx={{display: "flex", flexDirection: "column"}}>
                                                        {
                                                            group.squares.map((box, index) => {
                                                                return (<span>{Math.ceil(box.bottom - box.top)} x {Math.ceil(box.right - box.left)}</span>);
                                                            })
                                                        }
                                                    </Box>
                                                </TableCell>
                                                <TableCell align='center' sx={{borderBottom: '1px solid #aaa'}}>{group.type}</TableCell>
                                            </TableRow>
                                        })
                                    }
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>
            </>
        )
    }
}