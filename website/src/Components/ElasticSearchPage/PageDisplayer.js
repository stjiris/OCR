import React from 'react';
import Box from '@mui/material/Box';
import { Slider } from '@mui/material';

class PageDisplayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            width: props.maxWidth  || '150px',
            sliderOn: props.sliderOn || false  // not used
        }
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
                <Box sx={{maxWidth: `${this.props.maxWidth}`}}>
                    <Slider
                        size="small"
                        defaultValue={0}
                        aria-label="Small"
                        valueLabelDisplay="auto"
                        onChange={(_, value) => this.handleChange(value)}
                    />
                </Box>
                <Box
                    sx={{maxWidth: `${this.state.width}`, border: '1px solid #aaa', boxShadow: 1}}
                >

                    <a
                        href={this.props.imgPath}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <img
                            src={this.props.imgPath}
                            alt={`Página de ${this.props.imgPath}`}
                            style={{maxWidth: `${this.state.width}`}}
                        />
                    </a>
                </Box>
            </Box>
        );
    }
}

PageDisplayer.defaultProps = {
    imgPath: null,
    maxWidth: '150px',
    sliderOn: false,  // not used
}

export default PageDisplayer;
