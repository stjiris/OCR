import React from 'react';
import Box from '@mui/material/Box';

import PageDisplayer from '../Displayer/PageDisplayer.js';
import CustomTextField from '../TextField/CustomTextField.js';

export default class PageItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            page: props.page,
            image: props.image,
            index: props.index,
            contents: props.contents,
        }
    }

    onTextChanged(event) {
        this.setState({contents: event.target.value});
        this.state.page.updateContents(this.state.index, event.target.value);
    }

    render() {
        return (
            <Box sx={{display: 'flex', flexDirection: 'row', mb: '1rem'}}>
                <Box sx={{textAlign: 'center'}}>
                    <PageDisplayer path={this.state.image} />
                    <p>{'Page ' + (this.state.index + 1)}</p>
                </Box>

                <Box sx={{width: '100%'}}>
                    <CustomTextField value={this.state.contents} sx={{"& .MuiInputBase-root": {height: '100%'}}} ref={this.textEditor} rows={18} onChange={(e) => this.onTextChanged(e)} fullWidth multiline />
                </Box>
            </Box>
        )
    }
}