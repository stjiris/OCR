import React from 'react';
import Button from '@mui/material/Button';

class CustomButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            marginBottom: props.marginBottom,
            text: props.text,
            disabled: props.disabled,
            clickFunction: props.clickFunction
        };
    }

    changeDisabledState(currentState) {
        this.setState({ disabled: currentState });
    }
    // #48954f
    render() {
        return (
            <Button color="success" sx={{border: '1px solid black', mr: '1rem', mb: '0.5rem'}} onClick={() => this.state.clickFunction()} disabled={this.state.disabled} variant="contained">{this.state.text}</Button>
        );
    }
}

export default CustomButton;