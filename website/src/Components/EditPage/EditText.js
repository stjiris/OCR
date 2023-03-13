import React from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';

import EditImageDisplayer from '../Displayer/EditImageDisplayer.js';
import PageDisplayer from '../Displayer/PageDisplayer.js';
import CustomTextField from '../TextField/CustomTextField.js'

export default class EditText extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            contents: props.contents,
            editPage: props.editPage,
            pageContents: '',
            pages: []
        }

        this.textEditor = React.createRef();
        this.pageDisplayer = React.createRef();

        this.pagesRefs = [];
    }

    componentDidMount() {
        this.setState(
            {
                pageContents: this.state.contents[this.state.editPage.state.pageOpened]["content"]
            }
        );

        
        this.pageDisplayer.current.updatePath(this.state.contents[this.state.editPage.state.pageOpened]["page_url"]);
        
        this.generatePages(this.state.editPage.state.pageOpened);
    }

    onTextChanged(e) {
        this.setState({pageContents: e.target.value});
    }

    changePage(page) {
        var contents = this.state.contents;
        contents[this.state.editPage.state.pageOpened]["content"] = this.state.pageContents;    
        this.pagesRefs[this.state.editPage.state.pageOpened].current.unselect();
        this.pagesRefs[page].current.select();

        this.pageDisplayer.current.updatePath(this.state.contents[page]["page_url"]);
        this.setState({contents: contents, pageContents: this.state.contents[page]["content"]});
    }

    generatePages(page) {
        var pages = [];
        this.pagesRefs = [];

        for (var i = 0; i < this.state.contents.length; i++) {
            var ref = React.createRef();
            this.pagesRefs.push(ref);

            pages.push(
                <EditImageDisplayer
                    className="imageDisplayer"
                    ref={ref}
                    key={i}
                    path={this.state.contents[i]["page_url"]}
                    index={i}
                    editPage={this.state.editPage}
                    maxWidth={'100%'}
                    selected={page === i}
                />
            );
        }

        this.setState({pages: pages});
    }

    render() {
        this.refs = [];
        return (
            <Box
                sx={{
                    ml: '-1.5rem',
                    mr: '-1.5rem',
                    display: 'flex',
                    flexDirection: 'row',

                    height: '100%',
                }}
            >
                <Box sx={{
                    backgroundColor: '#d9d9d9',
                    
                    width: '15%',
                    
                    height: '100%',
                    maxHeight: '100%',
                    overflowY: 'scroll',

                }}>
                    <List>
                        {
                            this.state.pages
                        }
                    </List>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',

                        ml: '1%',
                        mr: '1%',
                        // width: '68%',
                        width: '100%',
                        height: '100%',
                    }}
                >
                    <Box>
                        <PageDisplayer
                            ref={this.pageDisplayer}
                            path={this.state.pageUrl}
                        />
                    </Box>
                    <Box sx={{width: '100%'}}>
                        <CustomTextField value={this.state.pageContents} sx={{"& .MuiInputBase-root": {height: '100%'}}} ref={this.textEditor} rows={20} onChange={(e) => this.onTextChanged(e)} fullWidth multiline />
                    </Box>
                </Box>

                {/* <Box
                    sx={{
                        backgroundColor: '#d9d9d9',
                    
                        width: '15%',
                        
                        height: '100%',
                        maxHeight: '100%',
                        overflowY: 'scroll',

                        textAlign: 'center',
                    }}
                >
                    <p><b>Palavras Incorretas</b></p>
                </Box> */}
            </Box>
        )
    }
}