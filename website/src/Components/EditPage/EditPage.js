import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import UndoIcon from '@mui/icons-material/Undo';
import SaveIcon from '@mui/icons-material/Save';

import Notification from '../Notification/Notifications.js';

import ConfirmLeave from './ConfirmLeave.js';
import PageItem from './PageItem.js';

export default class EditPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            app: props.app,
            file: props.app.state.fileOpened,
            contents: [],

            loading: true
        }

        this.successNot = React.createRef();
        this.errorNot = React.createRef();
        this.confirmLeave = React.createRef();

        this.multiplePage = React.createRef();
        this.editText = React.createRef();
    }

    setFile(file) { this.setState({file: file}); }

    editPage(index) {
        if (this.state.pageOpened !== -1) {
            this.editText.current.changePage(index);
        }

        this.setState({pageMode: false, pageOpened: index});
    }

    updateContents(index, contents) {
        var newContents = this.state.contents;
        newContents[index]["content"] = contents;
        this.setState({contents: newContents});
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
            this.setState({loading: false, contents: contents});
        });
    }

    goBack() {
        if (!this.state.pageMode) {
            this.confirmLeave.current.toggleOpen();
        } else {
            this.state.app.setState({fileSystemMode: true, editFileMode: false});
        }
    }

    leave() {
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

                var info = data["info"];
                this.state.app.setState({fileSystemMode: true, editFileMode: false, info: info})

            } else {
                this.errorNot.current.setMessage(data.error);
                this.errorNot.current.open();
            }
        });
    }

    render() {
        return (
            <Box sx={{ml: '1.5rem', mr: '1.5rem', height: '100%'}}>
                <Notification message={""} severity={"success"} ref={this.successNot}/>
                <Notification message={""} severity={"error"} ref={this.errorNot}/>

                <ConfirmLeave ref={this.confirmLeave} page={this} />

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                }}>
                    <Button
                        disabled={this.state.buttonsDisabled}
                        variant="contained"
                        startIcon={<UndoIcon />} 
                        sx={{backgroundColor: '#ffffff', color: '#000000', border: '1px solid black', mr: '1rem', mb: '0.5rem', ':hover': {bgcolor: '#ddd'}}}
                        onClick={() => this.goBack()}
                    >
                        Voltar atrás
                    </Button>

                    <Button
                        disabled={this.state.buttonsDisabled}
                        variant="contained"
                        color="success"
                        startIcon={<SaveIcon />} 
                        sx={{border: '1px solid black', mr: '1rem', mb: '0.5rem'}}
                        onClick={() => this.saveText()}
                    >
                        Guardar
                    </Button>
                </Box>
                {
                    this.state.loading
                    ? <p>Loading...</p>
                    : <Box>
                        {
                            this.state.contents.map((page, index) =>
                                <PageItem key={index} page={this} contents={page["content"]} image={page["page_url"]} index={index} />
                            )
                        }
                    </Box>
                }
            </Box>
        )
    }
}