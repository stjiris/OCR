import React from 'react';
import Box from '@mui/material/Box';

import EditImageDisplayer from '../Displayer/EditImageDisplayer.js';

export default class MultiplePageView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editPage: props.editPage,
            contents: props.contents,
        }
    }

    updateContents(contents) {
        this.setState({contents: contents});
    }

    render() {
        return (
            <Box sx={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly'}}>
                {this.state.contents.map((content, index) => {
                    return (
                        <EditImageDisplayer key={content["page_url"]} path={content["page_url"]} index={index} editPage={this.state.editPage}/>
                    );
                })}
            </Box>
        );
    }
}