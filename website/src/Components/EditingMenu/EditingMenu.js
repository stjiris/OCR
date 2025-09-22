import React from 'react';
import axios from 'axios';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from "@mui/material/Typography";
import SaveIcon from '@mui/icons-material/Save';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CircularProgress from '@mui/material/CircularProgress';
import TextareaAutosize from '@mui/material/TextareaAutosize';

import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SpellcheckIcon from '@mui/icons-material/Spellcheck';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';

import AddLineIcon from 'static/addLine.svg';
import RemoveLineIcon from 'static/removeLine.svg';

import ReturnButton from 'Components/FileSystem/ReturnButton';
import CorpusDropdown from 'Components/Dropdown/CorpusDropdown';
import Notification from 'Components/Notifications/Notification';
import ConfirmLeave from 'Components/Notifications/ConfirmLeave';
import EditingImage from 'Components/EditingMenu/EditingImage';

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;

class Word extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hovered: null,
            editing: false,
        }
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        return this.props.showConfidence !== nextProps.showConfidence
                || this.state.hovered !== nextState.hovered
                || this.props.editing !== nextProps.editing
                || this.props.editLinesMode !== nextProps.editLinesMode;
    }

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
    confidenceColor() {
        if (this.props.confidence == null) {
            return "#000000ff"
        }

        if (this.props.confidence > 85) {
            return "#008a07ff";
        } else if (this.props.confidence > 75) {
            return "#ff8800ff";
        } else {
            return "#ee0000ff";
        }
    }

    updateInputSize(text) {
        const textField = document.getElementById("textfield");
        textField.style.width = (text.length + 1) + 'ch';
    }

    render() {
        //const cleanedWord = this.cleanWord(this.props.text.toLowerCase());
        return (
        <span
            style={{
                display: "inline-block",
                position: "relative",
                userSelect: this.props.editLinesMode ? "none" : "text",  // disable selection for editing text while editing lines
            }}
            onMouseEnter={(e) => {
                this.setState({hovered: true}, () => {
                    this.props.highlightWord(e, this.props.box);
                });
            }}
            onMouseLeave={(e) => {
                if (!this.state.editing) {
                    this.setState({hovered: false}, () => {
                        this.props.removeHighlightWord(e, this.props.box);
                    });
                }
            }}
        >
        {this.props.wordIndex !== 0 && this.props.editLinesMode
            ? <IconButton
                sx={{
                    display: this.state.hovered ? "" : "none",
                    padding: 0.1,
                    margin: 0,
                    marginLeft: 1,
                    backgroundColor: "#0000ff88",
                    "&:hover": {backgroundColor: "#0000ffdd"}
                }}
                onClick={() => this.props.addLine(this.props.sectionIndex, this.props.lineIndex, this.props.wordIndex)}
            >
                <img style={{width: '1rem', color: "white"}} alt="addLine" src={AddLineIcon} />
            </IconButton>
            : null
        }
        {this.props.editing
            ? <TextareaAutosize
                id="textfield"
                variant='outlined'
                defaultValue={this.props.text}
                size="small"
                style={{
                    margin: "0px 2px",
                    fontFamily: "inherit",
                    fontSize: "14px",
                    padding: "0px 5px",
                    width: (this.props.text.length + 1) +  'ch',
                    maxWidth: '100%',
                    overflowWrap: "break-word",
                    resize: "none"
                }}
                autoFocus={true}
                onChange={(e) => {
                    this.updateInputSize(e.target.value);
                }}
                onBlur={(e) => {
                    this.props.updateText(e.target.value, this.props.sectionIndex, this.props.lineIndex, this.props.wordIndex);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        this.props.updateText(e.target.value, this.props.sectionIndex, this.props.lineIndex, this.props.wordIndex);
                    }
                }}
            />

            : <span
                id={this.props.id}
                className={`${this.props.text}`}
                style={{
                    margin: "0px 2px",
                    display: "inline-block",
                    fontSize: "14px",
                    color: this.props.showConfidence ? this.confidenceColor() : "#000000ff",
                    // backgroundColor: (false) ? "#ffd700" : "transparent",
                    backgroundColor: "transparent",
                    borderRadius: "5px",
                }}
            >
                {this.props.text}
            </span>
        }

        {this.props.lineEnd && this.props.editLinesMode
            ? <IconButton
                sx={{
                    // End of line button always shown
                    padding: 0.1,
                    margin: 0,
                    backgroundColor: "#ff000088",
                    "&:hover": {backgroundColor: "#ff0000dd"}
                }}
                onClick={() => this.props.removeLine(this.props.sectionIndex, this.props.lineIndex)}
            >
                <img style={{width: '1rem', color: "white"}} alt="deleteLine" src={RemoveLineIcon} />
            </IconButton>
            : null
        }
    </span>);
    }
}

class EditingMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            contents: [],
            currentContents: [],
            textComponents: [],
            words_list: [],
            corpusOptions: [],

            currentPage: 1,
            totalPages: 1,

            selectedWord: "",
            selectedWordIndex: 0,
            parentNode: null,
            coordinates: null,

            uncommittedChanges: false,
            mustRecreate: false,

            editLinesMode: false,
            showConfidence: false,

            corpusChoice: [{"name": "Português", "code": "Português"}]
        }

        this.imageRef = React.createRef();
        this.imageContainerRef = React.createRef();
        this.corpusSelect = React.createRef();
        this.textWindow = React.createRef();

        this.successNot = React.createRef();
        this.errorNotifRef = React.createRef();
        this.confirmLeave = React.createRef();

        this.selectedWord = "";

        this.goBack = this.goBack.bind(this);
        this.leave = this.leave.bind(this);
        this.hoverWord = this.hoverWord.bind(this);
        this.showImageHighlight = this.showImageHighlight.bind(this);
        this.hideImageHighlight = this.hideImageHighlight.bind(this);
        this.updateText = this.updateText.bind(this);
        this.addLine = this.addLine.bind(this);
        this.removeLine = this.removeLine.bind(this);
    }

    preventExit(event) {
        event.preventDefault();
        event.returnValue = '';
    }

    componentDidMount() {
        this.getContents();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevState.currentContents !== this.state.currentContents
            || prevState.showConfidence !== this.state.showConfidence
            || prevState.editLinesMode !== this.state.editLinesMode) {
            this.setState({
                textComponents: this.produceTextComponents(),
            });
        }
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
        const path = (this.props.current_folder + '/' + this.props.filename).replace(/^\//, '');
        axios.get(API_URL + '/get-text-content', {
            params: {
                _private: this.props._private,
                path: (this.props._private ? this.props.spaceId + '/' + path : path),
                page: page,
            }
        })
        .then(({data}) => {
            const pages = parseInt(data["pages"]);

            const sortedWords = this.orderWords(data["words"]);

            const newCorpusList = [];
            data["corpus"].forEach((item) => {
                newCorpusList.push({"name": item, "code": item});
            });

            this.setState({
                mustRecreate: data["must_recreate"],
                totalPages: pages,
                contents: data["doc"],
                currentContents: data["doc"][page-1]["content"],
                words_list: sortedWords,
                corpusOptions: newCorpusList,
                loaded: true
            });
        })
        .catch(err => {
            this.errorNotifRef.current.openWithMessage("Não foi possível obter resultados");
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
        this.imageContainerRef.current.clearWordBox(() => {
            this.setState({
                currentPage: this.state.currentPage + diff,
                currentContents: this.state.contents[this.state.currentPage + diff - 1]["content"],
                selectedWordIndex: 0,
                editLinesMode: false,
            });
        });
    }

    firstPage() {
        this.imageContainerRef.current.clearWordBox(() => {
            this.setState({
                currentPage: 1,
                currentContents: this.state.contents[0]["content"],
                selectedWordIndex: 0,
                editLinesMode: false,
            });
        });
    }

    lastPage() {
        this.imageContainerRef.current.clearWordBox(() => {
            this.setState({
                currentPage: this.state.totalPages,
                currentContents: this.state.contents[this.state.totalPages - 1]["content"],
                selectedWordIndex: 0,
                editLinesMode: false,
            });
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

        return [screenX, screenY];
    }

    showImageHighlight(e, box) {
        const topCorner = this.imageToScreenCoordinates(box[0], box[1]);
        const bottomCorner = this.imageToScreenCoordinates(box[2], box[3]);
        this.imageContainerRef.current.setWordBox(
            [
                topCorner[1],
                topCorner[0],
                bottomCorner[0] - topCorner[0],
                bottomCorner[1] - topCorner[1]
            ]
        );
    }

    hideImageHighlight(e, box) {
        const topCorner = this.imageToScreenCoordinates(box[0], box[1]);
        const bottomCorner = this.imageToScreenCoordinates(box[2], box[3]);
        this.imageContainerRef.current.unsetWordBox(
            [
                topCorner[1],
                topCorner[0],
                bottomCorner[0] - topCorner[0],
                bottomCorner[1] - topCorner[1]
            ]
        );
    }

    /**
     * SYNTAX FUNCTIONS
     * Used to check the syntax of the text
     */

    requestSyntax() {

        this.setState({ loadingSintax: true });
        fetch(API_URL + '/check-sintax', {
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

    updateText(newText, sectionIndex, lineIndex, wordIndex) {
        if (newText.trim() === this.state.currentContents[sectionIndex][lineIndex][wordIndex]["text"].trim()) {
            const newContents = this.state.currentContents.slice(0);
            const wordData = newContents[sectionIndex][lineIndex][wordIndex]
            delete wordData["input"];
            delete wordData["coordinates"];
            delete wordData["initial_text"];
            this.setState({
                contents: this.state.contents,
                currentContents: newContents,
            });
            return;  // Avoid registering uncommitted change when text does not change
        }

        const wordsList = this.state.words_list;

        const newContents = this.state.currentContents.slice(0);
        const lineData = newContents[sectionIndex][lineIndex];
        const wordData = lineData[wordIndex];

        const initial_text = wordData["initial_text"];
        const words = newText.trim().split(" ");

        const coordinates = wordData["coordinates"];
        const combination = this.splitWordsByLines(words, coordinates);

        delete wordData["coordinates"];

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

        combination.forEach((comb, i) => {
            const box = coordinates[i].slice(0, 4);
            const widthPerChar = (box[2] - box[0]) / (comb.reduce((a, b) => a + b.length, 0) + comb.length - 1);
            let charsPassed = 0;

            comb.forEach((word, j) => {
                //const cleanedWord = this.cleanWord(word.toLowerCase());
                newWords.push({
                    "b": wordData["b"],  // b -> key used in server for text Y offset
                    "box": [box[0] + charsPassed * widthPerChar, box[1], box[0] + (charsPassed + word.length) * widthPerChar, box[3]],
                    "text": word,
                    //"clean_text": cleanedWord,
                });
                charsPassed += word.length + 1;

                if (word === "") return;

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
            });
        });

        lineData.splice(wordIndex, 1, ...newWords);

        window.addEventListener('beforeunload', this.preventExit);
        this.setState({
            contents: this.state.contents,
            currentContents: newContents,
            words_list: this.orderWords(wordsList),
            uncommittedChanges: true,
        });
    }

    hoverWord(wordId) {
        if (this.state.editLinesMode) { // causes heavy re-render, avoid when not using this mode
            this.setState({hoveredId: wordId});
        }
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

            const newContents = this.state.currentContents.slice(0);
            const line = newContents[firstSpanInfo[4]][firstSpanInfo[5]];

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
            const textField = {"input": true, "text": text, "box": coordinates[0], "initial_text": text, "coordinates": coordinates, "b": avg_b};

            document.getSelection().removeAllRanges();

            line.splice(firstSpanInfo[6], elements.length, textField);
            this.state.contents[this.state.currentPage - 1]["content"] = newContents;
            this.setState({
                contents: this.state.contents,
                currentContents: newContents,
            });
        }
    }

    /**
     * LINE FUNCTIONS
     * Add and remove new lines (\n)
     */
    addLine(sectionIndex, lineIndex, wordIndex) {
        const currentContentCopy = this.state.currentContents.slice(0);
        const section = currentContentCopy[sectionIndex];
        const line = section[lineIndex];

        const secondPart = line.splice(wordIndex);
        const firstPart = line;

        section.splice(lineIndex, 1, firstPart, secondPart);
        currentContentCopy[sectionIndex] = section;
        this.state.contents[this.state.currentPage - 1]["content"] = currentContentCopy;

        this.setState({
            contents: this.state.contents,
            currentContents: currentContentCopy,
            uncommittedChanges: true,
        });
    }

    removeLine(sectionIndex, lineIndex) {

        const currentContentCopy = this.state.currentContents.slice(0);
        let section = currentContentCopy[sectionIndex];

        if (section.length -1 === lineIndex) {
            // Join sections
            const firstSection = section;
            const secondSection = currentContentCopy[sectionIndex + 1];

            section = [...firstSection, ...secondSection];
            const newLine = [...section[lineIndex], ...section[lineIndex + 1]];

            section.splice(lineIndex, 2, newLine);
            currentContentCopy.splice(sectionIndex, 2, section);

            this.state.contents[this.state.currentPage - 1]["content"] = currentContentCopy;
            this.setState({
                currentContents: currentContentCopy,
                uncommittedChanges: true,
            });

        } else {
            // Just join lines
            const newLine = [...section[lineIndex], ...section[lineIndex + 1]];

            section.splice(lineIndex, 2, newLine);

            this.state.contents[this.state.currentPage - 1]["content"] = currentContentCopy;
            this.setState({
                currentContents: currentContentCopy,
                uncommittedChanges: true,
            });
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
            this.imageContainerRef.current.clearWordBox(() => {
                this.setState({
                    selectedWordIndex: index,
                    currentPage: page,
                    currentContents: this.state.contents[page - 1]["content"],
                    editLinesMode: false,
                }, () => {
                    this.textWindow.current.scrollTop = this.getScrollValue(word, count);
                });
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

        fetch(API_URL + '/submit-text', {
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
                this.setState({uncommittedChanges: false, mustRecreate: !remakeFiles});
                window.removeEventListener('beforeunload', this.preventExit);

                this.successNot.current.openNotif("Texto submetido com sucesso");

                if (remakeFiles) {
                    this.leave();
                }
            } else {
                // this.errorNot.current.setMessage(data.error);
                // this.errorNot.current.open();
            }
        });
    }

    produceTextComponents() {
        return this.state.currentContents.map((section, sectionIndex) => {
            return <Box key={sectionIndex} className="editingSection">
                {
                    section.map((line, lineIndex) => {
                        return <Box key={lineIndex} className="editingLine">
                            {
                                line.map((word, wordIndex) => {
                                    if (word["text"] === "") return null;

                                    const id = `${word["box"][0]} ${word["box"][1]} ${word["box"][2]} ${word["box"][3]} ${sectionIndex} ${lineIndex} ${wordIndex}`;

                                    return (
                                        <Word
                                            key={wordIndex}
                                            id={id}
                                            text={word["text"]}
                                            box={word["box"]}
                                            confidence={word["confidence"]}
                                            showConfidence={this.state.showConfidence}
                                            sectionIndex={sectionIndex}
                                            lineIndex={lineIndex}
                                            wordIndex={wordIndex}
                                            lineEnd={
                                                wordIndex == line.length - 1
                                                && (lineIndex != section.length - 1
                                                    || sectionIndex != this.state.currentContents.length - 1)
                                            }
                                            editing={word["input"]}
                                            editLinesMode={this.state.editLinesMode}
                                            //cleanText={word["clean_text"]}
                                            hoverWord={this.hoverWord}
                                            highlightWord={this.showImageHighlight}
                                            removeHighlightWord={this.hideImageHighlight}
                                            updateText={this.updateText}
                                            addLine={this.addLine}
                                            removeLine={this.removeLine}
                                        />
                                    );
                                })
                            }
                        </Box>
                    })
                }
            </Box>;
        })
    }

    render() {
        const incorrectSyntax = (this.state.wordsMode
                                ? Object.keys(this.state.words_list).filter((item) => !this.state.words_list[item]["syntax"])
                                : "");
        return (
            <Box>
                <Notification message={""} severity={"success"} ref={this.successNot}/>
                <Notification message={""} severity={"error"} ref={this.errorNotifRef}/>
                <ConfirmLeave leaveFunc={this.leave} ref={this.confirmLeave} />
                {<>
                    <Box className="toolbar">
                        <Box className="noMarginRight" sx={{display: "flex"}}>
                            <ReturnButton
                                disabled={false}
                                returnFunction={this.goBack}
                            />

                            <Typography
                                variant="h5"
                                component="h2"
                                className="toolbarTitle"
                            >
                                Editar os resultados do documento
                            </Typography>
                        </Box>

                        <Box>
                            {
                            this.state.editLinesMode
                                ? <Button
                                    disabled={!this.state.loaded}
                                    color="error"
                                    variant="contained"
                                    className="menuFunctionButton"
                                    onClick={() => {this.setState({editLinesMode: false, hoveredId: null})}}
                                    startIcon={<CloseRoundedIcon />}
                                >
                                    Terminar
                                </Button>

                                : <Button
                                    disabled={!this.state.loaded}
                                    variant="contained"
                                    className="menuFunctionButton"
                                    onClick={() => {this.setState({editLinesMode: true})}}
                                    startIcon={<img style={{width: '1.2rem'}} alt="newLine" src={AddLineIcon} />}
                                >
                                    Adicionar/Remover Linhas
                                </Button>
                            }

                            {
                            this.state.wordsMode
                                ? <Button
                                    disabled={!this.state.loaded}
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
                                    disabled={!this.state.loaded}
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

                            {
                                this.state.showConfidence
                                    ? <Button
                                        disabled={!this.state.loaded}
                                        color="error"
                                        variant="contained"
                                        className="menuFunctionButton"
                                        onClick={() => {this.setState({showConfidence: false})}}
                                        startIcon={<CloseRoundedIcon />}
                                    >
                                        Mostrar Texto Simples
                                    </Button>

                                    : <Button
                                        disabled={!this.state.loaded}
                                        variant="contained"
                                        className="menuFunctionButton"
                                        onClick={() => {this.setState({showConfidence: true})}}
                                        startIcon={<ThumbUpAltIcon />}
                                    >
                                        Mostrar Grau de Confiança
                                    </Button>
                            }

                            <Button
                                disabled={!this.state.loaded || !this.state.uncommittedChanges}
                                color="success"
                                variant="contained"
                                className="menuFunctionButton"
                                onClick={() => this.saveChanges()}
                                startIcon={<SaveIcon />
                                }>
                                Guardar
                            </Button>

                            <Button
                                disabled={!this.state.loaded || (!this.state.mustRecreate && !this.state.uncommittedChanges)}
                                variant="contained"
                                color="success"
                                className="menuFunctionButton noMarginRight"
                                onClick={() => this.saveChanges(true)}
                                startIcon={<CheckRoundedIcon />
                                }>
                                Recriar Ficheiros
                            </Button>
                        </Box>
                    </Box>

                    {
                    this.state.loaded
                    ? <>
                    <Box
                        className="menuContent"
                        sx={{
                            display: "flex",
                            flexDirection: "row",
                        }}
                    >
                        <Box sx={{
                            display: "flex",
                            flexDirection: "column",
                            width: "50%"
                        }}>
                            <EditingImage
                                ref={this.imageContainerRef}
                                imageRef={this.imageRef}
                                imageURL={this.state.contents[this.state.currentPage - 1]["page_url"]}
                                currentPage={this.state.currentPage}
                            />

                            <Box sx={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mt: "5px"
                            }}>
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
                                        height: "69vh",
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
                                        this.state.textComponents
                                    }
                                </Box>

                                <Box sx={{
                                    display: this.state.wordsMode ? "block" : "none",
                                    overflowY: "scroll",
                                    overflowX: "wrap",
                                    marginLeft: "10px",
                                    width: "25vw",
                                    height: "69vh",
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

                    :<Box sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center"
                    }}>
                        <CircularProgress color="success" />
                    </Box>
                    }
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
    confidence: null,
    showConfidence: false,
    sectionIndex: null,
    lineIndex: null,
    wordIndex: null,
    lineEnd: false,
    editing: false,
    editLinesMode: false,
    // functions:
    hoverWord: null,
    highlightWord: null,
    removeHighlightWord: null,
    updateText: null,
    addLine: null,
    removeLine: null,
}

EditingMenu.defaultProps = {
    _private: false,
    spaceId: "",
    current_folder: null,
    filename: null,
    // functions:
    closeEditingMenu: null
}

export default EditingMenu;
