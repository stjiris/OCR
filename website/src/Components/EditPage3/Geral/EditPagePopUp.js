import React from 'react';

import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import SaveIcon from '@mui/icons-material/Save';

import CircularProgress from '@mui/material/CircularProgress';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

import AddLineIcon from '../../../static/addLine.svg';
import RemoveLineIcon from '../../../static/removeLine.svg';

import { Button } from '@mui/material';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: window.innerWidth * 0.9,
    height: window.innerHeight * 0.9,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 1,
    borderRadius: 2
};

const crossStyle = {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem'
}

class EditPagePopUp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            path: "",
            file: "",
            app: props.app,
            open: false,

            loading: true,
            contents: [],
            words_list: {},
            corpusOptions: [],

            currentPage: 1,
            totalPages: 1,

            imageHeight: 0,
            baseImageHeight: 0,

            selectedWordBox: null,
            parentNode: null,
            coordinates: null,
            editingText: "",

            addLineMode: false,
            removeLineMode: false,
        }

        this.image = React.createRef();
    }

    componentDidMount() {
        this.setState({
            imageHeight: window.innerHeight * 0.9 - 30,
            baseImageHeight: window.innerHeight * 0.9 - 30,
        });
    }

    getContents(page = 1) {
        this.setState({loading: true});
        fetch(process.env.REACT_APP_API_URL + 'get-file?path=' + this.state.file + '&page=' + page, {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            var pages = parseInt(data["pages"]);

            var contents = data["doc"].sort((a, b) =>
                (a["page_url"] > b["page_url"]) ? 1 : -1
            )
            
            var sortedWords = this.orderWords(data["words"]);
    
            var newCorpusList = [];
            data["corpus"].forEach((item) => {
                newCorpusList.push({"name": item, "code": item});
            });
    
            this.setState({totalPages: pages, loading: false, contents: contents, words_list: sortedWords, corpusOptions: newCorpusList});
        });
    }

    orderWords(words) {
        var items = Object.keys(words).map(function(key) {
            return [key, words[key]];
        });

        items.sort(function(first, second) {
            if (first[1]["pages"].length === second[1]["pages"].length) {
                return (first[0] > second[0]) ? 1 : -1;
            }
            return first[1]["pages"].length - second[1]["pages"].length;
        });

        var sortedWords = {}
        items.forEach(function(item) {
            sortedWords[item[0]] = item[1];
        });

        return sortedWords;
    }

    setFile(path, file) {
        this.setState({ path: path, file: file }, this.getContents);
    }

    toggleOpen() {
        this.setState({ open: !this.state.open, currentPage: 1, selectedWordBox: null, parentNode: null, coordinates: null, editingText: "", imageHeight: this.state.baseImageHeight });
    }

    changePage(diff) {
        this.updateContents();
        this.setState({
            currentPage: this.state.currentPage + diff, 
            selectedWordBox: null,
            addLineMode: false,
            removeLineMode: false
        });
    }

    firstPage() {
        this.updateContents();
        this.setState({
            currentPage: 1,
            selectedWordBox: null,
            addLineMode: false,
            removeLineMode: false
        });
    }

    lastPage() {
        this.updateContents();
        this.setState({
            currentPage: this.state.totalPages, 
            selectedWordBox: null,
            addLineMode: false,
            removeLineMode: false
        });
    }

    zoomImage(e) {
        const delta = -Math.sign(e.deltaY);
        
        var newImageHeight = this.state.imageHeight * (1 + delta * 0.1);
        if (newImageHeight < this.state.baseImageHeight) {
            newImageHeight = this.state.baseImageHeight;
        }

        this.setState({imageHeight: newImageHeight});
    }

    imageToScreenCoordinates(x, y) {
        var image = this.image.current;

        var ratioX = image.naturalWidth / image.offsetWidth;
        var ratioY = image.naturalHeight / image.offsetHeight;

        var domX = x / ratioX;
        var domY = y / ratioY;

        var screenX = domX + image.offsetLeft;
        var screenY = domY + image.offsetTop;

        return [screenX, screenY];
    }

    showImageHighlight(e, box) {
        var topCorner = this.imageToScreenCoordinates(box[0], box[1]);
        var bottomCorner = this.imageToScreenCoordinates(box[2], box[3]);

        this.setState({
            selectedWordBox: [
                topCorner[1],
                topCorner[0],
                bottomCorner[0] - topCorner[0],
                bottomCorner[1] - topCorner[1]
            ]
        });
    }

    zoom(delta) {
        var newHeight = this.state.imageHeight * (1 + delta * 0.4);

        if (newHeight < this.state.baseImageHeight) {
            newHeight = this.state.baseImageHeight;
        }

        this.setState({imageHeight: newHeight});
    }

    updateText() {
        var parentNode = this.state.parentNode;
        var coordinates = this.state.coordinates;
        var text = this.state.editingText;

        var widthPerChar = (coordinates[2] - coordinates[0]) / text.length;
        var charsPassed = 0;

        var words = text.split(" ");
        var newComponents = [];
        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            let id = `${coordinates[0] + charsPassed * widthPerChar} ${coordinates[1]} ${coordinates[0] + (charsPassed + word.length) * widthPerChar} ${coordinates[3]}`;
            var newSpan = document.createElement("span");
            newSpan.innerText = word;
            newSpan.style.marginLeft = "2px";
            newSpan.style.marginRight = "2px";
            newSpan.id = id;
            newSpan.onmouseenter = (e) => this.showImageHighlight(e, id.split(" ").map((item) => parseFloat(item)));
            newSpan.onmouseleave = () => this.setState({selectedWordBox: null});

            newComponents.push(newSpan);
            charsPassed += word.length + 1;
        }

        // Find the children of the parent node that is a input
        var newChildren = [...parentNode.childNodes];

        var inputIndex = -1;
        for (i = 0; i < newChildren.length; i++) {
            if (newChildren[i].tagName === "INPUT") {
                inputIndex = i;
                break;
            }
        }

        if (inputIndex !== -1) {
            // Replace the input with the new components
            newChildren.splice(inputIndex, 1, ...newComponents);
        }

        // Replace the parent node children with the new children
        parentNode.replaceChildren(...newChildren);
    }

    updateInputSize() {
        var text = this.state.editingText;
        var parentNode = this.state.parentNode;
        var children = parentNode.children;

        // Find the input element
        for (var i = 0; i < children.length; i++) {
            if (children[i].tagName === "INPUT") {
                children[i].style.width = `${text.length * 1.5}ch`;
                break;
            }
        }

        // Replace the parent node children with the new children
        parentNode.replaceChildren(...children);
    }

    getSelectedText() {
        if (typeof window.getSelection !== "undefined") {
            if (window.getSelection().toString().length === 0) return null;

            var selection = window.getSelection();

            var firstSpan = selection.baseNode.parentNode;
            var lastSpan = selection.extentNode.parentNode;
            var parentNode = firstSpan.parentNode;

            var firstSpanIndex = Array.prototype.indexOf.call(parentNode.childNodes, firstSpan);
            var lastSpanIndex = Array.prototype.indexOf.call(parentNode.childNodes, lastSpan);

            let range = new Range();
            range.setStart(parentNode, firstSpanIndex);
            range.setEnd(parentNode, lastSpanIndex + 1);

            var textField = document.createElement("input");

            document.getSelection().removeAllRanges();

            var newChildren = [...parentNode.childNodes];
            var deletedElements = newChildren.splice(
                firstSpanIndex,
                lastSpanIndex - firstSpanIndex + 1,
                textField
            );
            parentNode.replaceChildren(...newChildren);

            var words = [];
            for (var i = 0; i < deletedElements.length; i++) {
                words.push(deletedElements[i].innerText);
            }
            var text = words.join(" ");
            textField.value = text;
            textField.style.width = `${text.length * 1.5}ch`;
            textField.onchange = (e) => {
                this.setState({editingText: e.target.value}, this.updateInputSize);
            }
            textField.onkeydown = (e) => {
                if (e.key === "Enter") {
                    this.setState({editingText: e.target.value}, this.updateText);
                }
            }
            textField.onblur = (e) => {
                this.setState({editingText: e.target.value}, this.updateText);
            }
            textField.focus();

            var firstSpanId = firstSpan.id.split(" ");
            var lastSpanId = lastSpan.id.split(" ");
            
            this.setState({
                selectedWordBox: null,
                parentNode: parentNode,
                coordinates: [firstSpanId[0], firstSpanId[1], lastSpanId[2], lastSpanId[3]].map((item) => parseFloat(item)),
                editingText: text,
            });
        }
    }

    updateContents() {
        var sections = document.getElementsByClassName("section");
        var contents = this.state.contents;
        var newPageContents = [];
        
        for (var i = 0; i < sections.length; i++) {
            var section = sections[i];
            var sectionContents = [];

            for (var j = 0; j < section.children.length; j++) {
                var line = section.children[j];
                var lineContents = [];

                for (var k = 0; k < line.children.length; k++) {
                    var word = line.children[k];
                    var wordId = word.id.split(" ");
                    var wordText = word.innerText;
                    var wordBox = [wordId[0], wordId[1], wordId[2], wordId[3]].map((item) => parseFloat(item));

                    lineContents.push({
                        "text": wordText,
                        "box": wordBox,
                        "b": 0,
                    });
                }
                sectionContents.push(lineContents);
            }
            newPageContents.push(sectionContents);
        }

        contents[this.state.currentPage - 1]["content"] = newPageContents;
        this.setState({contents: contents});
    }

    saveChanges() {
        this.updateContents();
        fetch(process.env.REACT_APP_API_URL + 'submit-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "text": this.state.contents
            })
        })
        .then(response => {return response.json()})
        .then(data => {
            if (data.success) {
                // this.successNot.current.setMessage("Texto submetido com sucesso");
                // this.successNot.current.open();
                // this.setState({uncommittedChanges: false});
                // window.removeEventListener('beforeunload', this.preventExit);
                this.toggleOpen();
            } else {
                // this.errorNot.current.setMessage(data.error);
                // this.errorNot.current.open();
            }
        });
    }

    removeLine(sectionIndex, lineIndex) {
        var contents = this.state.contents;
        var section = [...contents[this.state.currentPage - 1]["content"][sectionIndex]];

        var firstLine, secondLine, newLine;

        if (section.length -1 === lineIndex) {
            // Join sections
            var firstSection = section;
            var secondSection = contents[this.state.currentPage - 1]["content"][sectionIndex + 1];

            section = [...firstSection, ...secondSection];
            firstLine = section[lineIndex];
            secondLine = section[lineIndex + 1];

            newLine = [...firstLine, ...secondLine];

            section.splice(lineIndex, 2, newLine);
            contents[this.state.currentPage - 1]["content"].splice(sectionIndex, 2, section);

            this.setState({contents: contents});

        } else {
            // Just join lines
            firstLine = section[lineIndex];
            secondLine = section[lineIndex + 1];

            newLine = [...firstLine, ...secondLine];

            section.splice(lineIndex, 2, newLine);

            contents[this.state.currentPage - 1]["content"][sectionIndex] = section;
            console.log(contents);
            this.setState({contents: contents});
        }
    }

    addLine(sectionIndex, lineIndex, wordIndex) {
        var contents = this.state.contents;
        var section = [...contents[this.state.currentPage - 1]["content"][sectionIndex]];
        var line = section[lineIndex];

        var secondPart = line.splice(wordIndex);
        var firstPart = line;

        section.splice(lineIndex, 1, firstPart, secondPart);
        contents[this.state.currentPage - 1]["content"][sectionIndex] = section;

        this.setState({contents: contents});
    }

    render() {
        var incorrectSyntax = Object.keys(this.state.words_list).filter((item) => !this.state.words_list[item]["syntax"]);

        return (
            <Box>
                <Modal open={this.state.open}>
                    <Box sx={style}>
                        {
                            this.state.loading
                            ? <Box sx={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "center",
                                alignItems: "center"
                            }}>
                                <CircularProgress color="success" />
                            </Box>
                            : <Box sx={{display: "flex", flexDirection: "row"}}>
                                <Box sx={{display: "flex", flexDirection: "column"}}>
                                    <Box sx={{display: "flex", flexDirection: "row"}}>
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                width: `${window.innerWidth * 0.9 * 0.4}px`,
                                                overflow: 'scroll', 
                                                border: '1px solid grey',
                                                height: `${this.state.baseImageHeight}px`
                                            }}
                                        >
                                            <img
                                                ref={this.image}
                                                src={this.state.contents[this.state.currentPage - 1]["page_url"]} 
                                                alt="Imagem da pagina"
                                                style={{
                                                    display: 'block',
                                                    marginLeft: 'auto',
                                                    marginRight: 'auto',
                                                    border: '1px solid black',
                                                    maxHeight: `${this.state.imageHeight}px`,
                                                    height: `${this.state.imageHeight}px`,
                                                }}
                                            />

                                            {
                                                this.state.selectedWordBox !== null
                                                ? <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        border: `2px solid #0000ff`,
                                                        backgroundColor: `#0000ff30`,
                                                        top: `${this.state.selectedWordBox[0]}px`,
                                                        left: `${this.state.selectedWordBox[1]}px`,
                                                        width: `${this.state.selectedWordBox[2]}px`,
                                                        height: `${this.state.selectedWordBox[3]}px`,
                                                    }}
                                                />
                                                : null
                                            }
                                        </Box>
                                    </Box>

                                    <Box sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", mt: "5px"}}>
                                        <Box>
                                            <IconButton
                                                sx={{marginRight: "10px", p: 0}}
                                                onClick={() => this.zoom(1)}
                                            >
                                                <ZoomInIcon />
                                            </IconButton>
                                            <IconButton
                                                sx={{marginRight: "10px", p: 0}}
                                                onClick={() => this.zoom(-1)}
                                            >
                                                <ZoomOutIcon />
                                            </IconButton>
                                        </Box>
                                        <Box>
                                            <IconButton
                                                disabled={this.state.currentPage === 1}
                                                sx={{marginRight: "10px", p: 0}}
                                                onClick={() => this.firstPage()}
                                            >
                                                <FirstPageIcon />
                                            </IconButton>

                                            <IconButton
                                                disabled={this.state.currentPage === 1}
                                                sx={{marginRight: "10px", p: 0}}
                                                onClick={() => this.changePage(-1)}
                                            >
                                                <KeyboardArrowLeftIcon />
                                            </IconButton>

                                            <span style={{margin: "0px 10px"}}>
                                                Página {this.state.currentPage} / {this.state.totalPages}
                                            </span>
                                            
                                            <IconButton
                                                disabled={this.state.currentPage === this.state.totalPages}
                                                sx={{marginLeft: "10px", p: 0}}
                                                onClick={() => this.changePage(1)}
                                            >
                                                <KeyboardArrowRightIcon />
                                            </IconButton>

                                            <IconButton
                                                disabled={this.state.currentPage === this.state.totalPages}
                                                sx={{marginLeft: "10px", p: 0}}
                                                onClick={() => this.lastPage()}
                                            >
                                                <LastPageIcon />
                                            </IconButton>
                                        </Box>
                                        <Box>
                                            <IconButton
                                                disabled
                                                sx={{marginRight: "10px", p: 0}}
                                            >
                                                <ZoomInIcon sx={{color: "white"}} />
                                            </IconButton>
                                            <IconButton
                                                disabled
                                                sx={{marginRight: "10px", p: 0}}
                                            >
                                                <ZoomOutIcon sx={{color: "white"}} />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box sx={{display: "flex", flexDirection: "column"}}>

                                    <Box
                                        sx={{
                                            position: 'relative',
                                            marginLeft: "10px",
                                            width: `${window.innerWidth * 0.9 * 0.55}px`,
                                            height: `${this.state.baseImageHeight}px`,
                                            overflowY: 'scroll', 
                                            overflowX: 'wrap',
                                            border: '1px solid grey',
                                            paddingLeft: "10px"
                                        }}
                                        onMouseUp={() => this.getSelectedText()}
                                    >
                                        {
                                            this.state.contents[this.state.currentPage - 1]["content"].map((section, sectionIndex) => {
                                                return <Box className="section">
                                                    {
                                                        section.map((line, lineIndex) => {
                                                            return <p style={{marginBottom: "0px", marginTop: "5px"}}>
                                                                {
                                                                    line.map((word, wordIndex) => {
                                                                        let id = `${word["box"][0]} ${word["box"][1]} ${word["box"][2]} ${word["box"][3]}`;
                                                                        return <>
                                                                            {
                                                                                this.state.addLineMode && wordIndex !== 0 && this.state.hoveredId === id
                                                                                ? <IconButton 
                                                                                    sx={{p: 0.1, m: 0, backgroundColor: "#0000ff88", ml: 1, "&:hover": {backgroundColor: "#0000ffdd"}}}
                                                                                    onClick={() => this.addLine(sectionIndex, lineIndex, wordIndex)}
                                                                                >
                                                                                    <img style={{width: '1rem', color: "white"}} alt="addLine" src={AddLineIcon} />
                                                                                </IconButton>
                                                                                : null
                                                                            }

                                                                            <span
                                                                                style={{marginLeft: "2px", marginRight: "2px"}}
                                                                                id={id}
                                                                                onMouseEnter={(e) => {
                                                                                    this.setState({hoveredId: id});
                                                                                    this.showImageHighlight(e, word["box"]);
                                                                                }}
                                                                                onMouseLeave={(e) => {
                                                                                    this.setState({selectedWordBox: null})
                                                                                }}
                                                                            >
                                                                                {word["text"]}
                                                                            </span>

                                                                            {
                                                                                this.state.removeLineMode && wordIndex === line.length - 1 && (lineIndex !== section.length - 1 || sectionIndex !== this.state.contents[this.state.currentPage - 1]["content"].length - 1)
                                                                                ? <IconButton 
                                                                                    sx={{p: 0.1, m: 0, backgroundColor: "#ff000088", ml: 1, "&:hover": {backgroundColor: "#ff0000dd"}}}
                                                                                    onClick={() => this.removeLine(sectionIndex, lineIndex)}
                                                                                >
                                                                                    <img style={{width: '1rem', color: "white"}} alt="deleteLine" src={RemoveLineIcon} />
                                                                                </IconButton>
                                                                                : null
                                                                            }
                                                                        </>

                                                                    })
                                                                }
                                                            </p>
                                                        })
                                                    }
                                                </Box>;
                                            })
                                            
                                        }
                                    </Box>

                                    <Box sx={{display: "flex", flexDirection: "row", justifyContent: "flex-end", mt: "5px"}}>
                                        {
                                            this.state.addLineMode
                                            ? <Button
                                                style={{border: '1px solid black', height: "25px", marginLeft: "10px"}}
                                                color="error"
                                                variant="contained"
                                                onClick={() => {this.setState({addLineMode: false, hoveredId: null})}}
                                                startIcon={<CloseRoundedIcon />}
                                            >
                                                Cancelar
                                            </Button>

                                            : <Button
                                                style={{border: '1px solid black', height: "25px", marginLeft: "10px"}}
                                                variant="contained"
                                                onClick={() => {this.setState({addLineMode: true, removeLineMode: false})}}
                                                startIcon={<img style={{width: '1.2rem'}} alt="newLine" src={AddLineIcon} />}
                                            >
                                                Adicionar Linhas
                                            </Button>
                                        }


                                        {
                                            this.state.removeLineMode
                                            ? <Button
                                                style={{border: '1px solid black', height: "25px", marginLeft: "10px"}}
                                                color="error"
                                                variant="contained"
                                                onClick={() => {this.setState({removeLineMode: false})}}
                                                startIcon={<CloseRoundedIcon />}
                                            >
                                                Cancelar
                                            </Button>

                                            : <Button
                                                style={{border: '1px solid black', height: "25px", marginLeft: "10px"}}
                                                variant="contained"
                                                onClick={() => {this.setState({removeLineMode: true, addLineMode: false})}}
                                                startIcon={<img style={{width: '1.2rem'}} alt="deleteLine" src={RemoveLineIcon} />}
                                            >
                                                Remover Linhas
                                            </Button>
                                        }

                                        <Button
                                            disabled
                                            style={{
                                                border: '1px solid black', 
                                                height: "25px", 
                                                marginLeft: "10px"
                                            }}
                                            
                                            variant="contained" 
                                            onClick={() => this.toggleOpen()} 
                                            startIcon={<SpellcheckIcon />
                                        }>
                                            Verificar Ortografia
                                            {
                                                incorrectSyntax.length > 0
                                                ? <span style={{marginLeft: "15px"}}>
                                                    {incorrectSyntax.length} ⚠️
                                                </span>
                                                : null
                                            }

                                        </Button>

                                        <Button
                                            style={{border: '1px solid black', height: "25px", marginLeft: "10px"}}
                                            
                                            variant="contained" 
                                            color="success" 
                                            onClick={() => this.saveChanges()} 
                                            startIcon={<SaveIcon />
                                        }>
                                            Guardar
                                        </Button>
                                    </Box>
                                </Box> 

                            </Box>
                        }
                        

                        <IconButton sx={crossStyle} aria-label="close" onClick={() => this.toggleOpen()}>
                            <CloseRoundedIcon />
                        </IconButton>
                    </Box>
                </Modal>
            </Box>
        )
    }
}

export default EditPagePopUp;
