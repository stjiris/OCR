import React from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import SaveIcon from '@mui/icons-material/Save';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import UndoIcon from "@mui/icons-material/Undo";

import AddLineIcon from '../../../static/addLine.svg';
import RemoveLineIcon from '../../../static/removeLine.svg';

import loadComponent from '../../../utils/loadComponents';
import {CircularProgress, TextareaAutosize} from '@mui/material';

const CorpusDropdown = loadComponent('Dropdown', 'CorpusDropdown');
const Notification = loadComponent('Notification', 'Notifications');
const ConfirmLeave = loadComponent('EditingMenu', 'ConfirmLeave');
const ZoomingTool = loadComponent('ZoomingTool', 'ZoomingTool');

class Word extends React.Component {
    /*
    cleanWord(word) {
        const punctuation = "!\"#$%&'()*+, -./:;<=>?@[\\]^_`{|}~«»—";
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
     */

    render() {
        //const cleanedWord = this.cleanWord(this.props.text.toLowerCase());
        return <p
            id={this.props.id}
            className={`${this.props.text}`}
            style={{
                margin: "0px 2px",
                display: "inline-block",
                fontSize: "14px",
                backgroundColor: (false) ? "#ffd700" : "transparent",
                borderRadius: "5px",
            }}
            onMouseEnter={(e) => {
                this.props.hoverWord(this.props.id);
                this.props.highlightWord(e, this.props.box);
            }}
            onMouseLeave={(e) => {
                this.props.removeHighlightWord();
            }}
        >
            {this.props.text}
        </p>
    }
}

class EditingMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            contents: [],
            words_list: [],
            corpusOptions: [],

            currentPage: 1,
            totalPages: 1,

            imageZoom: 100,
            minImageZoom: 20,
            maxImageZoom: 600,

            selectedWord: "",
            selectedWordIndex: 0,
            selectedWordBox: null,
            parentNode: null,
            coordinates: null,

            uncommittedChanges: false,

            addLineMode: false,
            removeLineMode: false,

            corpusChoice: [{"name": "Português", "code": "Português"}]
        }

        this.imageRef = React.createRef();
        this.corpusSelect = React.createRef();
        this.textWindow = React.createRef();

        this.successNot = React.createRef();
        this.confirmLeave = React.createRef();

        this.selectedWord = "";

        this.leave = this.leave.bind(this);
        this.hoverWord = this.hoverWord.bind(this);
        this.showImageHighlight = this.showImageHighlight.bind(this)
        this.hideImageHighlight = this.hideImageHighlight.bind(this)

        this.zoomIn = this.zoomIn.bind(this);
        this.zoomOut = this.zoomOut.bind(this);
        this.zoomReset = this.zoomReset.bind(this);
    }

    preventExit(event) {
        event.preventDefault();
        event.returnValue = '';
    }

    componentDidMount() {
        this.getContents();
    }

    goBack() {
        if (this.state.uncommittedChanges) {
            this.confirmLeave.current.toggleOpen();
        } else {
            window.removeEventListener('beforeunload', this.preventExit);
            this.props.closeEditingMenu();
        }
    }

    leave() {
        window.removeEventListener('beforeunload', this.preventExit);
        this.props.closeEditingMenu();
        this.confirmLeave.current.toggleOpen();
    }

    getContents(page = 1) {
        const path = (this.props.sessionId + '/' + this.props.current_folder + '/' + this.props.filename).replace(/^\//, '');
        const is_private = this.props._private ? '_private=true&' : '';
        fetch(process.env.REACT_APP_API_URL + 'get-file?' + is_private + 'path=' + path + '&page=' + page, {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            const pages = parseInt(data["pages"]);

            const contents = data["doc"].sort((a, b) =>
                (a["page_number"] > b["page_number"]) ? 1 : -1
            )

            const sortedWords = this.orderWords(data["words"]);

            const newCorpusList = [];
            data["corpus"].forEach((item) => {
                newCorpusList.push({"name": item, "code": item});
            });

            this.setState({totalPages: pages, contents: contents, words_list: sortedWords, corpusOptions: newCorpusList});
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

    /**
     * IMAGE FUNCTIONS
     * Used to zoom and change pages (text changes accordingly)
     */
    changePage(diff) {

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

        var image = this.imageRef.current;

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

    hideImageHighlight() {
        this.setState({selectedWordBox: null});
    }

    zoomIn() {
        this.zoom(1);
    }

    zoomOut() {
        this.zoom(-1);
    }

    zoomReset() {
        this.setState({imageZoom: 100});
    }

    zoom(delta) {
        let newZoom = Math.max(this.state.imageZoom + (20 * delta), this.state.minImageZoom);
        newZoom = Math.min(newZoom, this.state.maxImageZoom);
        this.setState({imageZoom: newZoom});
    }

    /**
     * SYNTAX FUNCTIONS
     * Used to check the syntax of the text
     */

    requestSyntax() {

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
    }

    editWord(newText, sectionIndex, lineIndex, wordIndex) {
        const newContents = this.state.contents.slice(0);
        const line = newContents[this.state.currentPage - 1]["content"][sectionIndex][lineIndex];
        line[wordIndex]["text"] = newText;
        this.setState({contents: newContents, uncommittedChanges: true}, () => this.updateText(sectionIndex, lineIndex, wordIndex));
    }

    updateText(sectionIndex, lineIndex, wordIndex) {
        const wordsList = this.state.words_list;

        const contents = this.state.contents;
        const lineData = contents[this.state.currentPage - 1]["content"][sectionIndex][lineIndex];
        const wordData = lineData[wordIndex];

        const initial_text = wordData["initial_text"];
        const text = wordData["text"];
        const words = text.split(" ");

        const coordinates = wordData["coordinates"];
        const combination = this.splitWordsByLines(words, coordinates);

        const newWords = [];

        initial_text.split(" ").forEach((item) => {
            //item = this.cleanWord(item.toLowerCase());  // this cleanup removes ability to edit text with special signs

            if (item === "") return;

            const info = wordsList[item];

            if (info["pages"].length === 1) {
                // Remove the word from the wordsList dictionary
                delete wordsList[item];
            } else {
                // Remove the page from the pages list
                const pages = info["pages"];
                pages.splice(pages.indexOf(this.state.currentPage - 1), 1);
            }
        })

        for (let i = 0; i < combination.length; i++) {
            const box = coordinates[i].slice(0, 4);
            const widthPerChar = (box[2] - box[0]) / (combination[i].reduce((a, b) => a + b.length, 0) + combination[i].length - 1);
            let charsPassed = 0;

            for (let j = 0; j < combination[i].length; j++) {
                const word = combination[i][j];
                //const cleanedWord = this.cleanWord(word.toLowerCase());
                newWords.push({
                    "b": wordData["b"],  // b -> key used in server for text Y offset
                    "box": [box[0] + charsPassed * widthPerChar, box[1], box[0] + (charsPassed + word.length) * widthPerChar, box[3]],
                    "text": word,
                    //"clean_text": cleanedWord,
                });
                charsPassed += word.length + 1;

                if (word === "") continue;

                // Update the words list
                if (word in wordsList) {
                    const pages = wordsList[word]["pages"];
                    pages.push(this.state.currentPage - 1);

                    // Sort the list
                    pages.sort((a, b) => a - b);

                    wordsList[word]["pages"] = pages;
                } else {
                    wordsList[word] = {"pages": [this.state.currentPage - 1], "syntax": true};
                }

            }
        }

        lineData.splice(wordIndex, 1, ...newWords);

        window.addEventListener('beforeunload', this.preventExit);
        if (this.state.selectedWord !== "" && !(this.state.selectedWord in wordsList)) {
            this.setState({contents: contents, words_list: this.orderWords(wordsList), selectedWord: "", selectedWordIndex: 0});
        }
        else if (this.state.selectedWord !== "" && this.state.selectedWordIndex === this.state.words_list[this.state.selectedWord]["pages"].length) {
            this.setState({contents: contents, words_list: this.orderWords(wordsList), selectedWordIndex: 0}, this.goToNextOccurrence);
        } else {
            this.setState({contents: contents, words_list: this.orderWords(wordsList)});
        }
    }

    updateInputSize(text) {
        const textField = document.getElementById("textfield");
        textField.style.width = text.length+'ch';
    }

    hoverWord(wordId) {
        this.setState({hoveredId: wordId});
    }

    getSelectedText() {
        if (typeof window.getSelection !== "undefined") {
            // Get the range and make the all word selected
            if (window.getSelection().toString().length === 0) return null;

            const selection = window.getSelection();

            const firstSpan = selection.anchorNode.parentNode;
            const lastSpan = selection.focusNode.parentNode;
            const parentNode = firstSpan.parentNode;

            const firstSpanIndex = Array.prototype.indexOf.call(parentNode.childNodes, firstSpan);
            const lastSpanIndex = Array.prototype.indexOf.call(parentNode.childNodes, lastSpan);

            const range = new Range();
            range.setStart(parentNode, firstSpanIndex);
            range.setEnd(parentNode, lastSpanIndex + 1);
            // Selection end here

            const firstSpanInfo = firstSpan.id.split(" ").map((item) => parseInt(item));
            const lastSpanInfo = lastSpan.id.split(" ").map((item) => parseInt(item));

            const newContents = this.state.contents.slice(0);
            const line = newContents[this.state.currentPage - 1]["content"][firstSpanInfo[4]][firstSpanInfo[5]];

            const elements = line.slice(firstSpanInfo[6], lastSpanInfo[6] + 1);
            const words = [];
            const coordinates = [];
            const bs = [];  // array for y offsets of the baselines, to average for the selected text
            let totalChars = 0;

            let initialCoords = null;
            let rowCoords = null;

            for (let i = 0; i < elements.length; i++) {
                words.push(elements[i]["text"]);
                bs.push(elements[i]["b"]);

                const box = elements[i]["box"];

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

            const text = words.join(" ");
            const avg_b = bs.reduce((b1, b2) => b1 + b2, 0) / elements.length;
            const textField = {"input": true, "text": text, "initial_text": text, "coordinates": coordinates, "b": avg_b};

            document.getSelection().removeAllRanges();

            line.splice(firstSpanInfo[6], elements.length, textField);
            this.setState({contents: newContents}, () => this.updateInputSize(text));
        }
    }

    /**
     * LINE FUNCTIONS
     * Add and remove new lines (\n)
     */
    addLine(sectionIndex, lineIndex, wordIndex) {

        var contents = this.state.contents;
        var section = [...contents[this.state.currentPage - 1]["content"][sectionIndex]];
        var line = section[lineIndex];

        var secondPart = line.splice(wordIndex);
        var firstPart = line;

        section.splice(lineIndex, 1, firstPart, secondPart);
        contents[this.state.currentPage - 1]["content"][sectionIndex] = section;

        this.setState({contents: contents, uncommittedChanges: true});
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

            this.setState({contents: contents, uncommittedChanges: true});

        } else {
            // Just join lines
            firstLine = section[lineIndex];
            secondLine = section[lineIndex + 1];

            newLine = [...firstLine, ...secondLine];

            section.splice(lineIndex, 2, newLine);

            contents[this.state.currentPage - 1]["content"][sectionIndex] = section;
            this.setState({contents: contents, uncommittedChanges: true});
        }
    }

    /**
     * WORD LIST FUNCTIONS
     * Handle the words list and actions
     */
    /*
    cleanWord(word) {
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
     */

    cleanWordSelection() {
        var words = document.getElementsByClassName(this.selectedWord);

        for (var i = 0; i < words.length; i++) {
            var word = words[i];
            word.style.backgroundColor = "transparent";
        }
    }

    getScrollValue(word, count = 0) {
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

        return wordHeight - middleHeight;
    }

    goToNextOccurrence(word) {
        // var word = this.state.selectedWord;
        var index = Math.max(0, this.state.selectedWordIndex);
        var pages = this.state.words_list[word]["pages"];

        var newPage = pages[index];
        var count = pages.slice(0, index).reduce((acc, value) => value === newPage ? acc + 1 : acc, 0);

        var page = newPage + 1;

        this.selectedWord = word;

        if (page !== this.state.currentPage) {
            this.setState({
                selectedWordIndex: index,
                currentPage: page,
                selectedWordBox: null,
                addLineMode: false,
                removeLineMode: false
            }, () => {
                this.textWindow.current.scrollTop = this.getScrollValue(word, count);
            });
        } else {
            this.setState({selectedWordIndex: index}, () => {
                this.textWindow.current.scrollTop = this.getScrollValue(word, count);
            });
        }
    }

    /**
     * SAVE FINAL CHANGES
     * Send to the server the new text and structure
     */
    saveChanges(remakeFiles = false) {

        fetch(process.env.REACT_APP_API_URL + 'submit-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "text": this.state.contents,
                "remakeFiles": remakeFiles,
                "_private": this.props._private
            })
        })
        .then(response => {return response.json()})
        .then(data => {
            if (data.success) {
                // this.successNot.current.setMessage("Texto submetido com sucesso");
                // this.successNot.current.open();
                this.setState({uncommittedChanges: false});
                window.removeEventListener('beforeunload', this.preventExit);

                this.successNot.current.setMessage("Texto submetido com sucesso");
                this.successNot.current.open();

                if (remakeFiles) {
                    this.props.closeEditingMenu();
                }
            } else {
                // this.errorNot.current.setMessage(data.error);
                // this.errorNot.current.open();
            }
        });
    }

    render() {
        const incorrectSyntax = Object.keys(this.state.words_list).filter((item) => !this.state.words_list[item]["syntax"]);
        return (
            this.state.contents.length === 0 ?
                <Box sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <CircularProgress color="success" />
                </Box>
            :
            <Box>
                <Notification message={""} severity={"success"} ref={this.successNot}/>
                <ConfirmLeave leaveFunc={this.leave} ref={this.confirmLeave} />
                {
                    <>
                    <Box sx={{
                        ml: '0.5rem',
                        mr: '0.5rem',
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        position: 'sticky',
                        top: 0,
                        zIndex: 100,
                        backgroundColor: '#fff',
                        paddingBottom: '1rem',
                        marginBottom: '0.5rem',
                        borderBottom: '1px solid black'
                    }}>
                        <Button
                            variant="contained"
                            startIcon={<UndoIcon />}
                            onClick={() => this.goBack()}
                            sx={{
                                border: '1px solid black',
                                height: '2rem',
                                textTransform: 'none',
                                fontSize: '0.75rem',
                                backgroundColor: '#ffffff',
                                color: '#000000',
                                ':hover': { bgcolor: '#ddd' }
                            }}
                        >
                            Voltar
                        </Button>

                        <Box>
                            {
                            this.state.addLineMode
                                ? <Button
                                    color="error"
                                    variant="contained"
                                    className="menuFunctionButton"
                                    onClick={() => {this.setState({addLineMode: false, hoveredId: null})}}
                                    startIcon={<CloseRoundedIcon />}
                                >
                                    Cancelar
                                </Button>

                                : <Button
                                    variant="contained"
                                    className="menuFunctionButton"
                                    onClick={() => {this.setState({addLineMode: true, removeLineMode: false})}}
                                    startIcon={<img style={{width: '1.2rem'}} alt="newLine" src={AddLineIcon} />}
                                >
                                    Adicionar Linhas
                                </Button>
                            }

                            {
                            this.state.removeLineMode
                                ? <Button
                                    color="error"
                                    variant="contained"
                                    className="menuFunctionButton"
                                    onClick={() => {this.setState({removeLineMode: false})}}
                                    startIcon={<CloseRoundedIcon />}
                                >
                                    Cancelar
                                </Button>

                                : <Button
                                    variant="contained"
                                    className="menuFunctionButton"
                                    onClick={() => {this.setState({removeLineMode: true, addLineMode: false})}}
                                    startIcon={<img style={{width: '1.2rem'}} alt="deleteLine" src={RemoveLineIcon} />}
                                >
                                    Remover Linhas
                                </Button>
                            }

                            {
                            this.state.wordsMode
                                ? <Button
                                    color="error"
                                    variant="contained"
                                    className="menuFunctionButton"
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
                                    variant="contained"
                                    className="menuFunctionButton"
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
                                color="success"
                                variant="contained"
                                className="menuFunctionButton"
                                onClick={() => this.saveChanges()}
                                startIcon={<SaveIcon />
                                }>
                                Guardar
                            </Button>

                            <Button
                                variant="contained"
                                color="success"
                                className="menuFunctionButton noMargin"
                                onClick={() => this.saveChanges(true)}
                                startIcon={<CheckRoundedIcon />
                                }>
                                Terminar
                            </Button>
                        </Box>
                    </Box>

                    <Box sx={{
                        display: "flex",
                        flexDirection: "row",
                        ml: "1rem",
                        mr: "1rem"
                    }}>
                        <Box sx={{
                            display: "flex",
                            flexDirection: "column",
                            width: "50%"
                        }}>
                            <Box sx={{display: "flex", flexDirection: "row"}}>
                                <Box className="pageImageContainer">
                                    <img
                                        ref={this.imageRef}
                                        src={this.state.contents[this.state.currentPage - 1]["page_url"]}
                                        alt="Imagem da pagina"
                                        className={"pageImage"}
                                        style={{
                                            maxWidth: `${this.state.imageZoom}%`,
                                            maxHeight: `${this.state.imageZoom}%`,
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

                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mt: "5px"
                            }}>
                                <ZoomingTool zoomInFunc={this.zoomIn} zoomOutFunc={this.zoomOut} zoomResetFunc={this.zoomReset}/>

                                <Box sx={{marginLeft: "auto", marginRight: "auto"}}>
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
                            </Box>
                        </Box>

                        <Box sx={{display: "flex", flexDirection: "column", width: "50%"}}>
                            <Box sx={{display: "flex", flexDirection: "row"}}>
                                <Box
                                    ref={this.textWindow}
                                    id="textWindow"
                                    sx={{
                                        position: 'relative',
                                        ml: '1rem',
                                        //width: this.state.wordsMode ? `${3 * window.innerWidth / 5 - 16*4 - 280}px` : `${3 * window.innerWidth / 5 - 16*4}px`,
                                        //height: `${this.state.baseImageHeight}px`,
                                        width: "calc(100% - 20px)",
                                        height: "80vh",
                                        overflowY: 'scroll',
                                        overflowX: 'wrap',
                                        border: '1px solid grey',
                                        paddingLeft: "10px",
                                        paddingRight: "10px",
                                        scrollBehavior: "smooth",
                                    }}
                                    onMouseUp={() => this.getSelectedText()}
                                >
                                    {
                                        this.state.contents[this.state.currentPage - 1]["content"].map((section, sectionIndex) => {
                                            return <Box key={`section${sectionIndex}`} className="section" sx={{display: "flex", flexDirection: "column", maxWidth: "100%"}}>
                                                {
                                                    section.map((line, lineIndex) => {
                                                        return <Box key={`line${lineIndex} section${sectionIndex}`} style={{marginBottom: "0px", marginTop: "10px", maxWidth: "100%"}}>
                                                            {
                                                                line.map((word, wordIndex) => {
                                                                    if ("input" in word) {
                                                                        return <TextareaAutosize
                                                                            id={"textfield"}
                                                                            key={`word${wordIndex} line${lineIndex} section${sectionIndex} ${word["text"]}`}
                                                                            variant='outlined'
                                                                            defaultValue={word["text"]}
                                                                            size="small"
                                                                            style={{margin: "0px 2px", fontFamily: "inherit", fontSize: "14px", padding: "0px 5px",
                                                                                width: word["text"].length+'ch', maxWidth: '100%',
                                                                                overflowWrap: "break-word", resize: "none"}}
                                                                            autoFocus={true}
                                                                            onChange={(e) => {
                                                                                this.updateInputSize(e.target.value);
                                                                            }}
                                                                            onBlur={(e) => {this.editWord(e.target.value, sectionIndex, lineIndex, wordIndex);}}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === "Enter") {
                                                                                    e.preventDefault();
                                                                                    this.editWord(e.target.value, sectionIndex, lineIndex, wordIndex);
                                                                                }
                                                                            }}
                                                                        />
                                                                    }

                                                                    if (word["text"] === "") return null;

                                                                    const id = `${word["box"][0]} ${word["box"][1]} ${word["box"][2]} ${word["box"][3]} ${sectionIndex} ${lineIndex} ${wordIndex}`;
                                                                    const ref = React.createRef();

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
                                                                            text={word["text"]}
                                                                            id={id}
                                                                            box={word["box"]}
                                                                            //cleanText={word["clean_text"]}
                                                                            hoverWord={this.hoverWord}
                                                                            highlightWord={this.showImageHighlight}
                                                                            removeHighlightWord={this.hideImageHighlight}
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
                                    overflowY: "scroll",
                                    overflowX: "wrap",
                                    marginLeft: "10px",
                                    width: "25vw",
                                    height: "80vh",
                                    border: "1px solid grey",
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
                                                        this.setState({selectedWordIndex: 0}, () => {
                                                            if (this.selectedWord === key) {
                                                                this.selectedWord = "";
                                                            } else {
                                                                this.goToNextOccurrence(key);
                                                            }
                                                        });
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
                        </Box>

                    </Box>
                    </>
                }
            </Box>
        )
    }
}

Word.defaultProps = {
    id: null,
    text: null,
    box: null,
    overlay: null,
    // functions:
    hoverWord: null,
    highlightWord: null,
    removeHighlightWord: null
}

EditingMenu.defaultProps = {
    _private: false,
    sessionId: "",
    current_folder: null,
    filename: null,
    // functions:
    closeEditingMenu: null
}

export default EditingMenu;
