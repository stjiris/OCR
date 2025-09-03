import React from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

class TooltipIcon extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showTooltip: false,
        }
    }

    render() {
        return (
            <Box className={this.props.className} sx={{...this.props.sx, position: "relative"}}>
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
                            border: "1px solid currentColor",
                            backgroundColor: '#f5f5f5',
                            padding: "2px 2px",

                        }}>
                            <span style={{fontSize: "smaller"}}>{this.props.message}</span>
                        </Box>
                        <Box sx={{
                            position: 'absolute',
                            top: "-3px",
                            left: "50%",
                            marginLeft: "-5px",
                            borderWidth: "5px",
                            borderStyle: "solid",
                            borderColor: "currentColor transparent transparent transparent",
                        }}></Box>
                    </>
                    : null
                }
                <IconButton disabled={this.props.disabled} sx={{
                    color: "inherit",
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
    icon: null,
    disabled: false,
    className: "",
    sx: {},
    // functions:
    clickFunction: null,
}

export default TooltipIcon;
