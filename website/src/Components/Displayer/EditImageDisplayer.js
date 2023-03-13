import React from 'react';
import Box from '@mui/material/Box';

class EditImageDisplayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            path: props.path,
            maxWidth: props.maxWidth || '200px',
            borderColor: props.borderColor || '#d9d9d9',
            hovering: false,
            index: props.index,
            editPage: props.editPage,

            selected: props.selected || false,
        }
    }

    select() { this.setState({selected: true}); }
    unselect() { this.setState({selected: false}); }
    
    render() {
        var borderColor = this.state.borderColor;
        if (this.state.selected) {
            borderColor = '#000000';
        }
        return (
            <Box
                onMouseEnter={() => this.setState({hovering: true})}
                onMouseLeave={() => this.setState({hovering: false})}
                onClick={() => this.state.editPage.editPage(this.state.index)}
                sx={{
                    maxWidth: `${this.state.maxWidth}`,
                    border: `1px solid ${borderColor}`,
                    boxShadow: 5,
                    mb: '1rem',
                    ml: '0.5rem',
                    mr: '0.5rem',
                    textAlign: 'center',

                    ':hover': {
                        cursor: 'pointer',
                    }
                }}
            >
                <img
                    src={this.state.path}
                    alt={`Página de ${this.state.path.split('/').slice(-1)}`}
                    style={{
                        display: 'block',
                        maxWidth: `100%`,
                    }}
                />
                <span>Página {this.state.index + 1}</span>
            </Box>
        );
    }
}

export default EditImageDisplayer;