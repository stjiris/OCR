import React from 'react';
import Box from '@mui/material/Box';

class PageDisplayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            path: props.path,
            maxWidth: '150px'
        }
    }
    
    render() {
        return (
            <Box
                sx={{maxWidth: `${this.state.maxWidth}`, border: '1px solid #d9d9d9', boxShadow: 1, mr: '0.5rem'}}
            >
                <a
                    href={this.state.path}
                    target="_blank"
                    rel="noreferrer"
                >
                    <img
                        src={this.state.path}
                        alt={`Page of ${this.state.path.split('/').slice(-1)}`}
                        style={{maxWidth: `${this.state.maxWidth}`}}
                    />
                </a>
            </Box>
        );
    }
}

export default PageDisplayer;