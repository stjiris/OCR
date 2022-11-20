import React from 'react';
import IconButton from '@mui/material/IconButton';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';

class ForwardsPageArrow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            disabled: props.disabled,
            clickFunction: props.clickFunction
        };
    }

    changeDisabledState(currentState) {
        this.setState({ disabled: currentState });
    }
    
    render() {
        return (
          <IconButton color="success" aria-label="back" disabled={this.state.disabled} onClick={() => this.state.clickFunction(1)} sx={{mr: '1rem'}}><ArrowForwardIosRoundedIcon /></IconButton>
        );
    }
}

export default ForwardsPageArrow;