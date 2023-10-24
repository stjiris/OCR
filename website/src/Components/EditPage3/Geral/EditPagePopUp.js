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

import loadComponent from '../../../utils/loadComponents';

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

class Word extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            overlay: props.overlay,
            text: props.text,
            id: props.id,
            box: props.box,
            cleanText: props.cleanText
        }
    }

    render() {
        return <p
            id={this.state.id}
            className={`${this.state.cleanText}`}
            style={{
                margin: "0px 2px", 
                display: "inline-block", 
                fontSize: "14px",
                backgroundColor: (false) ? "#ffd700" : "transparent",
                borderRadius: "5px",
            }}
            onMouseEnter={(e) => {
                this.state.overlay.setState({hoveredId: this.state.id});
                this.state.overlay.showImageHighlight(e, this.state.box);
            }}
            onMouseLeave={(e) => {
                this.state.overlay.setState({selectedWordBox: null})
            }}
        >
            {
                this.state.text
            }
        </p>
    }
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

            selectedWord: "",
            selectedWordIndex: 0,

            selectedWordBox: null,
            parentNode: null,
            coordinates: null,
            editingText: "",

            addLineMode: false,
            removeLineMode: false,
        }

        this.image = React.createRef();
        this.corpusSelect = React.createRef();
        this.textWindow = React.createRef();

        this.selectedWord = "";
        this.wordsIndex = {};
    }

    /**
     * GENERAL FUNCTIONS
     * Usually runned at the start of the component or called from the parent component
     */
    componentDidMount() {
        console.log("EditPagePopUp componentDidMount");
        this.setState({
            imageHeight: window.innerHeight * 0.9 - 30,
            baseImageHeight: window.innerHeight * 0.9 - 30,

            textWidth: window.innerWidth * 0.9 * 0.6 - 70,
            wordsWidth: 0,
            wordsMargin: 0,

            corpusChoice: [{"name": "Português", "code": "Português"}],
        });
    }

    toggleOpen() {
        console.log("EditPagePopUp toggleOpen");
        this.setState({ 
            open: !this.state.open, 
            currentPage: 1, 
            selectedWordBox: null, 
            selectedWord: "",
            selectedWordIndex: 0,
            parentNode: null, 
            coordinates: null, 
            editingText: "", 
            imageHeight: this.state.baseImageHeight, 
            addLineMode: false, 
            removeLineMode: false 
        });
    }

    setFile(path, file) {
        console.log("EditPagePopUp setFile");
        this.setState({ path: path, file: file }, this.getContents);
    }

    getContents(page = 1) {
        console.log("EditPagePopUp getContents");
        this.setState({loading: true});
        fetch(process.env.REACT_APP_API_URL + 'get-file?path=' + this.state.file + '&page=' + page, {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            var pages = parseInt(data["pages"]);

            var contents = data["doc"].sort((a, b) =>
                (a["page_number"] > b["page_number"]) ? 1 : -1
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
        console.log("EditPagePopUp orderWords");
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

    /**
     * IMAGE FUNCTIONS
     * Used to zoom and change pages (text changes accordingly)
     */
    changePage(diff) {
        console.log("EditPagePopUp changePage");
        this.setState({
            currentPage: this.state.currentPage + diff, 
            selectedWord: "",
            selectedWordIndex: 0,
            selectedWordBox: null,
            addLineMode: false,
            removeLineMode: false
        });
    }

    firstPage() {
        console.log("EditPagePopUp firstPage");
        this.setState({
            currentPage: 1,
            selectedWord: "",
            selectedWordIndex: 0,
            selectedWordBox: null,
            addLineMode: false,
            removeLineMode: false
        });
    }

    lastPage() {
        console.log("EditPagePopUp lastPage");
        this.setState({
            currentPage: this.state.totalPages, 
            selectedWord: "",
            selectedWordIndex: 0,
            selectedWordBox: null,
            addLineMode: false,
            removeLineMode: false
        });
    }

    imageToScreenCoordinates(x, y) {
        console.log("EditPagePopUp imageToScreenCoordinates");
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
        console.log("EditPagePopUp showImageHighlight");
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
        console.log("EditPagePopUp zoom");
        var newHeight = this.state.imageHeight * (1 + delta * 0.4);

        if (newHeight < this.state.baseImageHeight) {
            newHeight = this.state.baseImageHeight;
        }

        this.setState({imageHeight: newHeight});
    }

    /**
     * SYNTAX FUNCTIONS
     * Used to check the syntax of the text
     */

    requestSyntax() {
        console.log("EditPagePopUp requestSyntax");
        this.setState({ loadingSintax: true });
        fetch(process.env.REACT_APP_API_URL + 'check-sintax', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "languages": this.corpusSelect.current.getChoiceList(),
                "words": this.state.words_list,
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.updateSyntax(data.result);
                this.setState({ loadingSintax: false });
            }
        });
    }

    updateSyntax(words) {
        console.log("EditPagePopUp updateSyntax");
        var words_list = this.state.words_list;
        Object.entries(words).forEach(([key, value]) => {
            words_list[key]["syntax"] = value;
        });

        this.setState({words_list: words_list});
    }

    /**
     * TEXT CORRECTION
     * Used to handle the text selection and correction
     */
    generatePossibleWordCombinations(words, combination, startIndex = 0) {
        /**
         * Generate all possible combinations of words
         */
        console.log("EditPagePopUp generatePossibleWordCombinations");
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

        console.log("EditPagePopUp findBestCombination");

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
        console.log("EditPagePopUp splitWordsByLines");
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
    }
    
    updateText(sectionIndex, lineIndex, wordIndex) {
        console.log("EditPagePopUp updateText");
        var wordsList = this.state.words_list;

        var contents = this.state.contents;
        var line = contents[this.state.currentPage - 1]["content"][sectionIndex][lineIndex];

        var initial_text = line[wordIndex]["initial_text"];
        var text = line[wordIndex]["text"];
        var words = text.split(" ");

        var coordinates = line[wordIndex]["coordinates"];
        var combination = this.splitWordsByLines(words, coordinates);
        
        var newWords = [];

        initial_text.split(" ").forEach((item) => {
            item = this.cleanWord(item.toLowerCase());

            if (item === "") return;

            var info = wordsList[item];

            if (info["pages"].length === 1) {
                // Remove the word from the wordsList dictionary
                delete wordsList[item];
            } else {
                // Remove the page from the pages list
                var pages = info["pages"];
                pages.splice(pages.indexOf(this.state.currentPage - 1), 1);

                wordsList[item]["pages"] = pages;
            }
        })

        for (var i = 0; i < combination.length; i++) {
            var box = coordinates[i].slice(0, 4);
            var widthPerChar = (box[2] - box[0]) / (combination[i].reduce((a, b) => a + b.length, 0) + combination[i].length - 1);
            var charsPassed = 0;

            for (var j = 0; j < combination[i].length; j++) {
                var word = combination[i][j];
                var cleanedWord = this.cleanWord(word.toLowerCase());
                newWords.push({
                    "b": 0,
                    "box": [box[0] + charsPassed * widthPerChar, box[1], box[0] + (charsPassed + word.length) * widthPerChar, box[3]],
                    "text": word,
                    "clean_text": cleanedWord,
                });
                charsPassed += word.length + 1;

                if (cleanedWord === "") continue;

                // Update the words list
                if (cleanedWord in wordsList) {
                    var pages = wordsList[cleanedWord]["pages"];
                    pages.push(this.state.currentPage - 1);

                    // Sort the list
                    pages.sort((a, b) => a - b);

                    wordsList[cleanedWord]["pages"] = pages;
                } else {
                    wordsList[cleanedWord] = {"pages": [this.state.currentPage - 1], "syntax": true};
                }

            }
        }

        line.splice(wordIndex, 1, ...newWords);
        contents[this.state.currentPage - 1]["content"][sectionIndex][lineIndex] = line;

        wordsList = this.orderWords(wordsList);

        if (this.state.selectedWord !== "" && !(this.state.selectedWord in wordsList)) {
            this.setState({contents: contents, words_list: wordsList, selectedWord: "", selectedWordIndex: 0});
        }
        else if (this.state.selectedWord !== "" && this.state.selectedWordIndex === this.state.words_list[this.state.selectedWord]["pages"].length) {
            this.setState({contents: contents, words_list: wordsList, selectedWordIndex: 0}, this.goToNextOccurrence);
        } else {
            this.setState({contents: contents, words_list: wordsList});
        }
    }

    updateInputSize() {
        console.log("EditPagePopUp updateInputSize");
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
        console.log("EditPagePopUp getSelectedText");
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

            var textField = {"input": true, "text": text, "initial_text": text, "coordinates": coordinates};

            document.getSelection().removeAllRanges();

            line.splice(firstSpanInfo[6], elements.length, textField);
            contents[this.state.currentPage - 1]["content"][firstSpanInfo[4]][firstSpanInfo[5]] = line;

            this.setState({contents: contents, inputSize: text.length});
        }
    }
    
    /**
     * LINE FUNCTIONS
     * Add and remove new lines (\n)
     */
    addLine(sectionIndex, lineIndex, wordIndex) {
        console.log("EditPagePopUp addLine");
        var contents = this.state.contents;
        var section = [...contents[this.state.currentPage - 1]["content"][sectionIndex]];
        var line = section[lineIndex];

        var secondPart = line.splice(wordIndex);
        var firstPart = line;

        section.splice(lineIndex, 1, firstPart, secondPart);
        contents[this.state.currentPage - 1]["content"][sectionIndex] = section;

        this.setState({contents: contents});
    }

    removeLine(sectionIndex, lineIndex) {
        console.log("EditPagePopUp removeLine");
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
            this.setState({contents: contents});
        }
    }

    /**
     * WORD LIST FUNCTIONS
     * Handle the words list and actions
     */  
    cleanWord(word) {
        console.log("EditPagePopUp cleanWord");
        var punctuation = "!\"#$%&'()*+, -./:;<=>?@[\\]^_`{|}~«»—";
        while (word !== "") {
            if (punctuation.includes(word[0])) {
                word = word.slice(1);
            } else {
                break;
            }
        }

        while (word !== "") {
            if (punctuation.includes(word[word.length - 1])) {
                word = word.slice(0, word.length - 1);
            } else {
                break;
            }
        }

        return word.toLowerCase();
    }

    cleanWordSelection() {
        console.log("EditPagePopUp cleanWordSelection");
        var words = document.getElementsByClassName(this.selectedWord);

        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            word.style.backgroundColor = "transparent";
        }
    }

    getScrollValue(word, count = 0) {
        console.log("EditPagePopUp getScrollValue");
        // var words = [];
        var words = document.getElementsByClassName(word);
    
        var middleHeight = window.innerHeight / 2;

        var wordHeight = null;
        var chosenWord = null;

        for (var i = 0; i < words.length; i++) {
            var wordComponent = words[i];
            if (count === 0) {
                chosenWord = wordComponent;
            }
            
            count -= 1;
            wordComponent.style.backgroundColor = "#ffd700";
        }

        if (chosenWord !== null) {
            chosenWord.style.backgroundColor = "#e88504";
            wordHeight = chosenWord.offsetTop;
        }

        var scrollValue = wordHeight - middleHeight;
        return scrollValue;
    }

    goToNextOccurrence(word) {
        console.log("EditPagePopUp goToNextOccurrence");
        
        // var word = this.state.selectedWord;
        var index = Math.max(0, this.state.selectedWordIndex);
        var pages = this.state.words_list[word]["pages"];
        
        var newPage = pages[index];
        var count = pages.slice(0, index).reduce((acc, value) => value === newPage ? acc + 1 : acc, 0);

        var page = newPage + 1;

        this.selectedWord = word;

        this.setState({selectedWordIndex: index});

        if (page !== this.state.currentPage) {
            this.setState({
                currentPage: page,
                selectedWordBox: null,
                addLineMode: false,
                removeLineMode: false
            }, () => {
                var scrollValue = this.getScrollValue(word, count);
                this.textWindow.current.scrollTop = scrollValue;
            })
        } else {
            var scrollValue = this.getScrollValue(word, count);
            this.textWindow.current.scrollTop = scrollValue;
        }
    }

    /**
     * SAVE FINAL CHANGES
     * Send to the server the new text and structure
     */
    saveChanges() {
        console.log("EditPagePopUp saveChanges");
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

    /**
     * Render the component
     */
    render() {
        console.log("EditPagePopUp render");
        const CorpusDropdown = loadComponent('Dropdown', 'CorpusDropdown');

        var incorrectSyntax = Object.keys(this.state.words_list).filter((item) => !this.state.words_list[item]["syntax"]);
        this.wordsIndex = {};

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

                                    <Box sx={{display: "flex", flexDirection: "row"}}>
                                        <Box
                                            ref={this.textWindow}
                                            id="textWindow"
                                            sx={{
                                                position: 'relative',
                                                marginLeft: "10px",
                                                width: this.state.wordsMode ? `${window.innerWidth * 0.9 * 0.6 - 352}px` : `${window.innerWidth * 0.9 * 0.6 - 70}px`,
                                                height: `${this.state.baseImageHeight}px`,
                                                overflowY: 'scroll', 
                                                overflowX: 'wrap',
                                                border: '1px solid grey',
                                                paddingLeft: "10px",
                                                scrollBehavior: "smooth",
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
                                                                            var ref = React.createRef();

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

                                                                                <Word
                                                                                    ref = {ref}
                                                                                    key={`word${wordIndex} line${lineIndex} section${sectionIndex} ${word["text"]}`}
                                                                                    overlay={this}
                                                                                    text={word["text"]}
                                                                                    id={id}
                                                                                    box={word["box"]}  
                                                                                    cleanText={word["clean_text"]}   
                                                                                />

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

                                        <Box sx={{
                                            display: this.state.wordsMode ? "block" : "none",
                                            overflowY: 'scroll',
                                            overflowX: 'wrap',
                                            marginLeft: "10px",
                                            width: "250px",
                                            height: `${this.state.baseImageHeight}px`,
                                            border: '1px solid grey',
                                            backgroundColor: "#f0f0f0",
                                            padding: "0px 10px"
                                        }}>
                                            <p style={{fontSize: "18px", margin: "10px 0px 0px 0px"}}><b>Palavras</b></p>
                                            <CorpusDropdown 
                                                ref={this.corpusSelect} 
                                                options={this.state.corpusOptions} 
                                                choice={this.state.corpusChoice} 
                                            />

                                            <Box sx={{display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center"}}>
                                                <Button
                                                    variant="text"
                                                    color="success"
                                                    sx={{padding: 0, textTransform: "none", color: 'blue'}}
                                                    onClick={() => this.requestSyntax()}
                                                >
                                                    Verificar ortografia
                                                </Button>

                                                {
                                                    this.state.loadingSintax
                                                    ? <CircularProgress sx={{ml: "1rem"}} color="success" size="1rem" />
                                                    : null
                                                }

                                            </Box>

                                            {
                                                Object.entries(this.state.words_list).map(([key, value]) => {
                                                    return <Box
                                                        sx={{display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}
                                                    >
                                                        <Box
                                                            sx={{':hover': {cursor: "pointer", textDecoration: 'underline'}}}
                                                            onClick={() => {
                                                                this.cleanWordSelection();
                                                                this.setState({selectedWordIndex: 0});
                                                                if (this.selectedWord === key) {
                                                                    this.selectedWord = "";
                                                                } else {
                                                                    this.goToNextOccurrence(key);
                                                                }
                                                            }}
                                                        >
                                                            <span
                                                                key={key + " " + value["pages"].length + " " + value["syntax"]}
                                                                style={{
                                                                    fontWeight: (key === this.selectedWord) ? 'bold' : 'normal',
                                                                }}
                                                            >
                                                                {key} ({value["pages"].length})
                                                                    <span style={{marginLeft: '5px'}}>
                                                                        {
                                                                            "syntax" in value && !value["syntax"]
                                                                            ? "⚠️"
                                                                            : ""
                                                                        }
                                                                    </span>
                                                            </span>
                                                        </Box>

                                                        {
                                                            this.selectedWord === key
                                                            ? <Box>
                                                                <IconButton
                                                                    sx={{p: 0.1, m: 0, ml: 1}}
                                                                    onClick={() => {
                                                                        var newIndex = this.state.selectedWordIndex - 1;
                                                                        if (newIndex < 0) newIndex += value["pages"].length;

                                                                        this.setState({selectedWordIndex: (newIndex) % value["pages"].length}, () => {
                                                                            this.goToNextOccurrence(this.selectedWord);
                                                                        });
                                                                    }}
                                                                >
                                                                    <KeyboardArrowLeftIcon />
                                                                </IconButton>

                                                                <span key={this.state.selectedWordIndex}>{this.state.selectedWordIndex + 1}/{value["pages"].length}</span>

                                                                <IconButton
                                                                    sx={{p: 0.1, m: 0, ml: 1}}
                                                                    onClick={() => {
                                                                        this.setState({selectedWordIndex: (this.state.selectedWordIndex + 1) % value["pages"].length}, () => {
                                                                            this.goToNextOccurrence(this.selectedWord);
                                                                        });
                                                                    }}
                                                                >
                                                                    <KeyboardArrowRightIcon />
                                                                </IconButton>

                                                            </Box>
                                                            : null
                                                        }

                                                    </Box>
                                                })
                                            }
                                        </Box>
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
                                                style={{border: '1px solid black', height: "25px", marginLeft: "10px", textTransform: "none"}}
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
                                                style={{border: '1px solid black', height: "25px", marginLeft: "10px", textTransform: "none"}}
                                                color="error"
                                                variant="contained"
                                                onClick={() => {this.setState({removeLineMode: false})}}
                                                startIcon={<CloseRoundedIcon />}
                                            >
                                                Cancelar
                                            </Button>

                                            : <Button
                                                style={{border: '1px solid black', height: "25px", marginLeft: "10px", textTransform: "none"}}
                                                variant="contained"
                                                onClick={() => {this.setState({removeLineMode: true, addLineMode: false})}}
                                                startIcon={<img style={{width: '1.2rem'}} alt="deleteLine" src={RemoveLineIcon} />}
                                            >
                                                Remover Linhas
                                            </Button>
                                        }

                                        {
                                            this.state.wordsMode
                                            ? <Button
                                                style={{border: '1px solid black', height: "25px", marginLeft: "10px", textTransform: "none"}}
                                                color="error"
                                                variant="contained"
                                                onClick={() => {this.cleanWordSelection(); this.setState({wordsMode: false})}}
                                                startIcon={<CloseRoundedIcon />}
                                            >
                                                Fechar
                                                {
                                                    incorrectSyntax.length > 0
                                                    ? <span style={{marginLeft: "15px"}}>
                                                        {incorrectSyntax.length} ⚠️
                                                    </span>
                                                    : null
                                                }
                                            </Button>
                                            : <Button
                                                style={{border: '1px solid black', height: "25px", marginLeft: "10px", textTransform: "none"}}
                                                variant="contained"
                                                onClick={() => {this.setState({wordsMode: true})}}
                                                startIcon={<SpellcheckIcon />}
                                            >
                                                Ortografia
                                                {
                                                    incorrectSyntax.length > 0
                                                    ? <span style={{marginLeft: "15px"}}>
                                                        {incorrectSyntax.length} ⚠️
                                                    </span>
                                                    : null
                                                }
                                            </Button>
                                        }

                                        <Button
                                            style={{border: '1px solid black', height: "25px", marginLeft: "10px", textTransform: "none"}}
                                            
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
