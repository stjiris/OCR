import React from 'react';

import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import SaveIcon from '@mui/icons-material/Save';
import TextField from '@mui/material/TextField';

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
        this.setState({ open: !this.state.open, currentPage: 1, selectedWordBox: null, parentNode: null, coordinates: null, editingText: "", imageHeight: this.state.baseImageHeight, addLineMode: false, removeLineMode: false });
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

    generatePossibleWordCombinations(words, combination, startIndex = 0) {
        /**
         * Generate all possible combinations of words
         */
        var word = words.splice(0, 1)[0];
        var totalCombinations = [];

        for (var i = startIndex; i < combination.length; i++) {
            // Create a copy of combination
            var newCombination = JSON.parse(JSON.stringify(combination));

            // Insert word in the new combination
            newCombination[i].push(word);

            // If there are more words, call the function again
            if (words.length > 0) {
                var combs = this.generatePossibleWordCombinations([...words], newCombination, i);
                totalCombinations.push(...combs);
            } else {
                totalCombinations.push(newCombination);
            }
        }

        var keepingCombinations = [];
        for (var j = 0; j < totalCombinations.length; j++) {
            var comb = totalCombinations[j];
            var hasEmpty = false;

            for (var k = 0; k < comb.length; k++) {
                if (comb[k].length === 0) {
                    hasEmpty = true;
                    break;
                }
            }

            if (!hasEmpty) keepingCombinations.push(totalCombinations[j]);
        }
        return keepingCombinations;
    }

    findBestCombination(combinations, lengths) {
        /**
         * Find the combination that minimizes the difference between the previous text and the new text
         */

        // Infinite
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Infinity?retiredLocale=pt-PT
        var score = Math.pow(10, 1000);
        var best = null;

        for (var i = 0; i < combinations.length; i++) {
            var comb = combinations[i];
            var currentLengths = [];

            for (var j = 0; j < comb.length; j++) {
                currentLengths.push(comb[j].reduce((a, b) => a + b.length, 0));
            }

            var currentDiff = 0;
            for (j = 0; j < lengths.length; j++) {
                currentDiff += Math.abs(lengths[j] - currentLengths[j]);
            }

            if (currentDiff < score) {
                score = currentDiff;
                best = comb;
            }
        }

        return best;
    }

    splitWordsByLines(words, coordinates) {
        if (coordinates.length === 1) return [words];

        var separation = [];
        var charsPerLine = [];
        for (var i = 0; i < coordinates.length; i++) {
            separation.push([]);
            charsPerLine.push(coordinates[i][4]);
        }

        var combinations = this.generatePossibleWordCombinations(words, JSON.parse(JSON.stringify(separation)));
        var bestCombination = this.findBestCombination(combinations, charsPerLine);

        return bestCombination;

        // var currentIndex = 0;
        // for (i = 0; i < words.length; i++) {
        //     var word = words[i];
        //     separation[currentIndex].push(word);

        //     var wordLength = word.length;
        //     charsPerLine[currentIndex] -= wordLength;
        //     if (charsPerLine[currentIndex] < 0) {
        //         currentIndex = Math.min(currentIndex + 1, separation.length - 1);
        //     }
        // }

        // // Check if any element of separation is an empty list
        // for (i = coordinates.length - 1; i >= 0; i--) {
        //     if (separation[i].length === 0) {
        //         // Pick the element from the previous line
        //         separation[i] = separation[i - 1].splice(-1, 1);
        //     }
        // }

        // return separation;
    }

    updateText(sectionIndex, lineIndex, wordIndex) {
        var contents = this.state.contents;
        var line = contents[this.state.currentPage - 1]["content"][sectionIndex][lineIndex];

        var text = line[wordIndex]["text"];
        var words = text.split(" ");

        var coordinates = line[wordIndex]["coordinates"];
        var combination = this.splitWordsByLines(words, coordinates);
        
        var newWords = [];

        for (var i = 0; i < combination.length; i++) {
            var box = coordinates[i].slice(0, 4);
            var widthPerChar = (box[2] - box[0]) / (combination[i].reduce((a, b) => a + b.length, 0) + combination[i].length - 1);
            var charsPassed = 0;

            for (var j = 0; j < combination[i].length; j++) {
                var word = combination[i][j];
                newWords.push({
                    "b": 0,
                    "box": [box[0] + charsPassed * widthPerChar, box[1], box[0] + (charsPassed + word.length) * widthPerChar, box[3]],
                    "text": word,
                });
                charsPassed += word.length + 1;
            }
        }

        line.splice(wordIndex, 1, ...newWords);
        contents[this.state.currentPage - 1]["content"][sectionIndex][lineIndex] = line;

        this.setState({contents: contents});
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
            // Get the range and make the all word selected
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
            // Selection end here

            var firstSpanInfo = firstSpan.id.split(" ").map((item) => parseInt(item));
            var lastSpanInfo = lastSpan.id.split(" ").map((item) => parseInt(item));

            var contents = [...this.state.contents];
            var line = contents[this.state.currentPage - 1]["content"][firstSpanInfo[4]][firstSpanInfo[5]];

            var elements = line.slice(firstSpanInfo[6], lastSpanInfo[6] + 1)
            var words = [];
            var coordinates = [];
            var totalChars = 0;

            var initialCoords = null;
            var rowCoords = null;

            for (var i = 0; i < elements.length; i++) {
                words.push(elements[i]["text"]);

                var box = elements[i]["box"];

                if (rowCoords === null || (initialCoords !== null && box[0] < initialCoords[0])) {
                    if (rowCoords !== null) {
                        rowCoords.push(totalChars);
                        coordinates.push(rowCoords);
                    }

                    totalChars = 0;
                    initialCoords = [box[0], box[1], box[2], box[3]];
                    rowCoords = [box[0], box[1], box[2], box[3]];
                }

                totalChars += elements[i]["text"].length;

                rowCoords[2] = box[2];
                rowCoords[3] = box[3];
            }

            rowCoords.push(totalChars);
            coordinates.push(rowCoords);

            var text = words.join(" ");

            var textField = {"input": true, "text": text, "coordinates": coordinates};

            document.getSelection().removeAllRanges();

            line.splice(firstSpanInfo[6], elements.length, textField);
            contents[this.state.currentPage - 1]["content"][firstSpanInfo[4]][firstSpanInfo[5]] = line;

            this.setState({contents: contents, inputSize: text.length});
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
            console.log("Joining sections")
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
                                                return <Box key={`section${sectionIndex}`} className="section" sx={{display: "flex", flexDirection: "column"}}>
                                                    {
                                                        section.map((line, lineIndex) => {
                                                            return <Box key={`line${lineIndex} section${sectionIndex}`} style={{marginBottom: "0px", marginTop: "10px"}}>
                                                                {
                                                                    line.map((word, wordIndex) => {
                                                                        if ("input" in word) {
                                                                            return <TextField
                                                                                key={`word${wordIndex} line${lineIndex} section${sectionIndex} ${word["text"]}`}
                                                                                variant='outlined'
                                                                                defaultValue={word["text"]}
                                                                                size="small"
                                                                                style={{margin: "0px 2px", width: `${(this.state.inputSize + 1) * 9}px`}}
                                                                                inputProps={{style: {fontSize: "14px", padding: "0px 5px"}}}
                                                                                autoFocus={true}
                                                                                onChange={(e) => {
                                                                                    this.setState({inputSize: e.target.value.length});
                                                                                }}
                                                                                onBlur={(e) => {
                                                                                    var contents = [...this.state.contents];
                                                                                    var line = contents[this.state.currentPage - 1]["content"][sectionIndex][lineIndex];
                                                                                    line[wordIndex]["text"] = e.target.value;
                                                                                    contents[this.state.currentPage - 1]["content"][sectionIndex][lineIndex] = line;
                                                                                    this.setState({contents: contents}, () => this.updateText(sectionIndex, lineIndex, wordIndex));
                                                                                }}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === "Enter") {
                                                                                        e.preventDefault();

                                                                                        var contents = [...this.state.contents];
                                                                                        var line = contents[this.state.currentPage - 1]["content"][sectionIndex][lineIndex];
                                                                                        line[wordIndex]["text"] = e.target.value;
                                                                                        contents[this.state.currentPage - 1]["content"][sectionIndex][lineIndex] = line;
                                                                                        this.setState({contents: contents}, () => this.updateText(sectionIndex, lineIndex, wordIndex));
                                                                                    }
                                                                                }}
                                                                            />
                                                                        }


                                                                        if (word["text"] === "") return null;

                                                                        let id = `${word["box"][0]} ${word["box"][1]} ${word["box"][2]} ${word["box"][3]} ${sectionIndex} ${lineIndex} ${wordIndex}`;

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

                                                                            <p
                                                                                key={`word${wordIndex} line${lineIndex} section${sectionIndex} ${word["text"]}`}
                                                                                style={{margin: "0px 2px", display: "inline-block", fontSize: "14px"}}
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
                                                                            </p>

                                                                            {
                                                                                this.state.removeLineMode && wordIndex === line.length - 1 && (lineIndex !== section.length - 1 || sectionIndex !== this.state.contents[this.state.currentPage - 1]["content"].length - 1)
                                                                                ? <IconButton 
                                                                                    sx={{p: 0.1, m: 0, ml: 1, backgroundColor: "#ff000088", "&:hover": {backgroundColor: "#ff0000dd"}}}
                                                                                    onClick={() => this.removeLine(sectionIndex, lineIndex)}
                                                                                >
                                                                                    <img style={{width: '1rem', color: "white"}} alt="deleteLine" src={RemoveLineIcon} />
                                                                                </IconButton>
                                                                                : null
                                                                            }
                                                                        </>

                                                                    })
                                                                }
                                                            </Box>
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
                                            Ortografia
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
