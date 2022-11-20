import React from 'react';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';

class BackwardsPageArrow extends React.Component {
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
          <IconButton color="success" aria-label="back" disabled={this.state.disabled} onClick={() => this.state.clickFunction(-1)}><ArrowBackIosRoundedIcon /></IconButton>
        );
    }
}

export default BackwardsPageArrow;