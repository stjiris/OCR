import React from 'react';
import Box from '@mui/material/Box';
import { Button } from '@mui/material';

import VisibilityIcon from '@mui/icons-material/Visibility';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

class EditImageDisplayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            path: props.path,
            maxWidth: '200px',
            hovering: false,
            index: props.index,
            editPage: props.editPage,
        }
    }
    
    render() {
        return (
            <Box
                onMouseEnter={() => this.setState({hovering: true})}
                onMouseLeave={() => this.setState({hovering: false})}
                sx={{
                    maxWidth: `${this.state.maxWidth}`,
                    border: '1px solid #d9d9d9',
                    boxShadow: 1,
                    mb: '1rem',
                    mr: '0.5rem',
                    ml: '0.5rem',

                    position: 'relative',
                    ':before': {
                        content: '""',
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        right: 0,
                    },
                    ':hover:before': {
                    }
                }}
            >
                <img
                    src={this.state.path}
                    alt={`Página de ${this.state.path.split('/').slice(-1)}`}
                    style={{
                        display: 'block',
                        maxWidth: `${this.state.maxWidth}`,
                        opacity: `${this.state.hovering ? '0.5' : '1'}`,
                    }}
                />

                <Button
                    onClick={() => window.open(this.state.path, '_blank')}
                    sx={{
                        p: '6px',
                        position: 'absolute',
                        top: '50%',
                        right: '50%',
                        transform: 'translate(-10%, -50%)',
                        opacity: `${this.state.hovering ? '1' : '0'}`,
                    }}
                    variant="contained"
                >
                    <VisibilityIcon />
                </Button>

                <Button
                    onClick={() => this.state.editPage.editPage(this.state.index)}
                    sx={{
                        p: '6px',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(10%, -50%)',
                        opacity: `${this.state.hovering ? '1' : '0'}`,
                    }}
                    variant="contained"
                >
                    <EditRoundedIcon />
                </Button>
            </Box>
        );
    }
}

export default EditImageDisplayer;