import { Box, IconButton } from '@mui/material';
import React from 'react';

class TooltipIcon extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showTooltip: false,
        }
    }

    render() {
        return (
            <Box sx={{position: "relative"}}>
                {
                    this.state.showTooltip && !this.props.disabled
                    ? <>
                        <Box sx={{
                            position: "absolute",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            top: "-2px",
                            left: "50%",
                            transform: "translate(-50%, -100%)",
                            borderRadius: "3px",
                            border: `1px solid ${this.props.color}`,
                            backgroundColor: '#f5f5f5',
                            padding: "2px 2px",

                        }}>
                            <span style={{fontSize: "9px"}}>{this.props.message}</span>
                        </Box>
                        <Box sx={{
                            position: 'absolute',
                            top: "-3px",
                            left: "50%",
                            marginLeft: "-5px",
                            borderWidth: "5px",
                            borderStyle: "solid",
                            borderColor: `${this.props.color} transparent transparent transparent`,
                        }}></Box>
                    </>
                    : null
                }
                <IconButton disabled={this.props.disabled} sx={{
                    color: this.props.color,
                }}
                    onClick={this.props.clickFunction}
                    onMouseEnter={() => this.setState({ showTooltip: true })}
                    onMouseLeave={() => this.setState({ showTooltip: false })}
                >
                    {this.props.icon}
                </IconButton>
            </Box>
        )
    }
}

TooltipIcon.defaultProps = {
    message: "",
    color: 'black',
    icon: null,
    disabled: false,
    // functions:
    clickFunction: null,
}

export default TooltipIcon;
