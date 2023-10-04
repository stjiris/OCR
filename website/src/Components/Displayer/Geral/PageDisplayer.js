import React from 'react';
import Box from '@mui/material/Box';
import { Slider } from '@mui/material';

class PageDisplayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            path: props.path,
            maxWidth: props.width || '150px',
            width: props.width || '150px',
            sliderOn: props.sliderOn || false
        }
    }

    updatePath(path) {
        this.setState({path: path});
    }

    handleChange(value) {
        var newWidth = 150 + 450 * (value/100);
        this.setState({width: newWidth + 'px'});
    }

    render() {
        return (
            <Box sx={{
                maxWidth: `${this.state.width}`,
                mr: '1rem',
                pt: '1rem'
            }}>
                <Box sx={{maxWidth: `${this.state.maxWidth}`}}>
                    <Slider
                        size="small"
                        defaultValue={0}
                        aria-label="Small"
                        valueLabelDisplay="auto"
                        onChange={(_, value) => this.handleChange(value)}
                    />
                </Box>
                <Box
                    sx={{maxWidth: `${this.state.width}`, border: '1px solid #d9d9d9', boxShadow: 1}}
                >

                    <a
                        href={this.state.path}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <img
                            src={this.state.path}
                            alt={`Página de ${this.state.path}`}
                            style={{maxWidth: `${this.state.width}`}}
                        />
                    </a>
                </Box>
            </Box>
        );
    }
}

export default PageDisplayer;
