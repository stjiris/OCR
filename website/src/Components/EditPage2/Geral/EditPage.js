import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import UndoIcon from '@mui/icons-material/Undo';
import SaveIcon from '@mui/icons-material/Save';

import loadComponent from '../../../utils/loadComponents';
import { CircularProgress } from '@mui/material';

export default class EditPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            app: props.app,
            file: props.app.state.fileOpened,
            contents: [],
            words_list: {},
            uncommittedChanges: false,

            selectedWord: "",

            loading: true,

            corpusOptions: [],
            corpusChoice: [{"name": "Português", "code": "Português"}],
            loadingSintax: false,
        }

        this.successNot = React.createRef();
        this.errorNot = React.createRef();
        this.confirmLeave = React.createRef();

        this.multiplePage = React.createRef();
        this.editText = React.createRef();

        this.dictMenu = React.createRef();
        this.corpusSelect = React.createRef();
    }

    preventExit(event) {
        event.preventDefault();
        event.returnValue = '';
    }

    setFile(file) { this.setState({file: file}); }

    editPage(index) {
        if (this.state.pageOpened !== -1) {
            this.editText.current.changePage(index);
        }

        this.setState({pageMode: false, pageOpened: index});
    }

    updateContents(index, contents, previousStruct, newStruct) {
        var newContents = this.state.contents;
        newContents[index]["content"] = contents;
        
        var words = this.state.words_list;
        var previousWords = previousStruct["text"].split(" ");
        var newWords = newStruct["text"].split(" ");

        previousWords.forEach(word => {
            // Remove index from the list of pages that contain the word
            let text = word.toLowerCase();
            Array.from('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~').forEach(element => {
                text = text.replaceAll(element, "");
            });

            var wordsList = words[text] || [];
            wordsList["pages"].splice(wordsList["pages"].indexOf(index), 1);

            if (wordsList["pages"].length === 0)
                delete words[text];
            else
                words[text] = wordsList;

            if (text === this.state.selectedWord) {
                this.setState({selectedWord: ""});
            }
        });

        newWords.forEach(word => {
            // Add index to the list of pages that contain the word
            let text = word.toLowerCase();
            Array.from('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~').forEach(element => {
                text = text.replaceAll(element, "");
            });

            var wordsList = words[text] || {"pages": [], "sintax": true};
            wordsList["pages"].push(index);
            wordsList["pages"].sort((a, b) => (a > b) ? 1 : -1);
            words[text] = wordsList;
        });

        var sortedWords = this.orderWords(words);

        this.setState({contents: newContents, uncommittedChanges: true, words_list: sortedWords});
        window.addEventListener('beforeunload', this.preventExit);
    }

    componentDidMount() {
        fetch(process.env.REACT_APP_API_URL + 'get-file?path=' + this.state.file, {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            var contents = data["doc"].sort((a, b) =>
                (a["page_url"] > b["page_url"]) ? 1 : -1
            )
            
            var sortedWords = this.orderWords(data["words"]);

            var newCorpusList = [];
            data["corpus"].forEach((item) => {
                newCorpusList.push({"name": item, "code": item});
            });

            const date = new Date();
            const size = new TextEncoder().encode(JSON.stringify(contents)).length;
            const megabytes = size / (1024 * 1024);
            console.log("SetState " + date.getTime() + " Size: " + megabytes + "MB");
            this.setState({loading: false, contents: contents, words_list: sortedWords, corpusOptions: newCorpusList});
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

    goBack() {
        if (this.state.uncommittedChanges) {
            this.confirmLeave.current.toggleOpen();
        } else {
            window.removeEventListener('beforeunload', this.preventExit);
            this.state.app.setState({fileSystemMode: true, editFileMode: false});
        }
    }

    leave() {
        window.removeEventListener('beforeunload', this.preventExit);
        this.state.app.setState({fileSystemMode: true, editFileMode: false});
        this.confirmLeave.current.toggleOpen();
    }

    saveText() {
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
                this.successNot.current.setMessage("Texto submetido com sucesso");
                this.successNot.current.open();
                this.setState({uncommittedChanges: false});
                window.removeEventListener('beforeunload', this.preventExit);
            } else {
                this.errorNot.current.setMessage(data.error);
                this.errorNot.current.open();
            }
        });
    }

    requestSintax() {
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
                this.updateSintax(data.result);
                this.setState({ loadingSintax: false });
            }
        });
    }

    updateSintax(words) {
        var words_list = this.state.words_list;
        Object.entries(words).forEach(([key, value]) => {
            words_list[key]["sintax"] = value;
        });

        this.setState({words_list: words_list});
    }


    render() {
        const Notification = loadComponent('Notification', 'Notifications');
        const ConfirmLeave = loadComponent('EditPage2', 'ConfirmLeave');
        const PageItem = loadComponent('EditPage2', 'PageItem');
        const CorpusDropdown = loadComponent('Dropdown', 'CorpusDropdown');

        const date = new Date();
        console.log(date.getTime());

        return (
            <Box sx={{height: '100%'}}>
                <Notification message={""} severity={"success"} ref={this.successNot}/>
                <Notification message={""} severity={"error"} ref={this.errorNot}/>


                <ConfirmLeave ref={this.confirmLeave} page={this} />

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: '#fff',
                    paddingTop: '1rem',
                    paddingBottom: '1rem',
                    marginBottom: '1rem',
                    borderBottom: '1px solid black',
                    ml: '1rem',
                    mr: '1rem'
                }}>
                    <Button
                        disabled={this.state.buttonsDisabled}
                        variant="contained"
                        startIcon={<UndoIcon />}
                        sx={{backgroundColor: '#ffffff', color: '#000000', border: '1px solid black', ml: '0.5rem', mr: '1rem', mb: '0.5rem', ':hover': {bgcolor: '#ddd'}}}
                        onClick={() => this.goBack()}
                    >
                        Voltar atrás
                    </Button>

                    <Button
                        disabled={this.state.buttonsDisabled}
                        variant="contained"
                        color="success"
                        startIcon={<SaveIcon />}
                        sx={{border: '1px solid black', mb: '0.5rem', mr: '0.5rem'}}
                        onClick={() => this.saveText()}
                    >
                        Guardar
                    </Button>
                </Box>
                
                <Box sx={{ml: '1.5rem', mr: '1.5rem', display: 'flex', flexDirection: 'row'}}>
                    <Box sx={{width: '80vw'}}>
                        {
                            this.state.loading
                            ? <p>Loading...</p>
                            : <Box>
                                {
                                    this.state.contents.map((page, index) =>
                                        <PageItem key={index + this.state.selectedWord} selectedWord={this.state.selectedWord} page={this} contents={page["content"]} image={page["page_url"]} index={index} />
                                    )
                                }
                            </Box>
                        }
                    </Box>
                    <Box sx={{
                        ml: '0.5rem',
                        paddingLeft: '0.5rem',
                        paddingTop: '0.5rem',
                        paddingRight: '0.5rem',
                        width: '20vw',
                        backgroundColor: '#eee'
                    }}>
                        <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: "center"}}>
                            <span style={{fontSize: '18px', fontWeight: 'bold'}}>Palavras</span>
                        </Box>
                        {
                            this.state.loading
                            ? <><span>Loading...</span></>
                            : <Box>
                                <Box sx={{display: "flex", flexDirection: "column"}}>
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
                                            onClick={() => this.requestSintax()}
                                        >
                                            Verificar ortografia
                                        </Button>

                                        {
                                            this.state.loadingSintax
                                            ? <CircularProgress sx={{ml: "1rem"}} color="success" size="1rem" />
                                            : null
                                        }

                                    </Box>
                                </Box>
                                {
                                    Object.entries(this.state.words_list).map(([key, value]) => {
                                        return <Box
                                            key={key}
                                            sx={{
                                                display: 'block',
                                                width: 'max-content',
                                                ':hover': {borderBottom: '1px solid black', cursor: 'pointer'}
                                            }}
                                            onClick={() => {
                                                if (this.state.selectedWord === key)
                                                    this.setState({selectedWord: ""});
                                                else
                                                    this.setState({selectedWord: key})
                                            }}
                                        >
                                            <span
                                                key={key + " " + value["pages"].length + " " + value["sintax"]}
                                                style={{
                                                    fontWeight: (key === this.state.selectedWord) ? 'bold' : 'normal'
                                                }}
                                            >
                                                {key} ({value["pages"].length})
                                                    <span style={{marginLeft: '5px'}}>
                                                        {
                                                            !value["sintax"]
                                                            ? "⚠️"
                                                            : ""
                                                        }
                                                    </span>
                                            </span>
                                        </Box>
                                    })
                                }
                            </Box>
                        }
                    </Box>
                </Box>
            </Box>
        )
    }
}
