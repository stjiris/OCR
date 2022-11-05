import React from 'react';
import Button from '@mui/material/Button';

class CustomButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            marginTop: props.marginTop,
            text: props.text,
            disabled: props.disabled,
            clickFunction: props.clickFunction
        };
    }

    changeDisabledState(currentState) {
        this.setState({ disabled: currentState });
    }

    render() {
        return (
            <Button sx={{border: '1px solid black', mr: '1rem', mt: this.state.marginTop, maxHeight: '2rem'}} onClick={() => this.state.clickFunction()} disabled={this.state.disabled} variant="contained">{this.state.text}</Button>
        );
    }
}

export default CustomButton;