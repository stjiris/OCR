import { Box, IconButton } from '@mui/material';
import React from 'react';

export default class DraggableTooltipIcon extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showTooltip: false,
            dragging: false,

            color: props.color || 'black',
            padding: props.padding || '0px',
            disabled: props.disabled || false,
            icon: props.icon,
            message: props.message || "",
            clickFunction: props.clickFunction,
            dragStartFunction: props.dragStartFunction,
            dragFunction: props.dragFunction,
            dragEndFunction: props.dragEndFunction
        }
    }

    render() {
        return (
            <Box sx={{position: "relative"}}>
                {
                    this.state.showTooltip && !this.state.dragging && !this.state.disabled
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
                            border: `1px solid ${this.state.color}`,
                            backgroundColor: '#f5f5f5',
                            padding: "2px 2px",

                        }}>
                            <span style={{fontSize: "9px"}}>{this.state.message}</span>
                        </Box>
                        <Box sx={{
                            position: 'absolute',
                            top: "-3px",
                            left: "50%",
                            marginLeft: "-5px",
                            borderWidth: "5px",
                            borderStyle: "solid",
                            borderColor: `${this.state.color} transparent transparent transparent`,
                        }}></Box>
                    </>
                    : null
                }
                <IconButton disabled={this.state.disabled} draggable sx={{
                    color: this.state.color,
                    padding: this.state.padding
                }}
                    onClick={this.state.clickFunction}
                    onMouseEnter={() => this.setState({ showTooltip: true })}
                    onMouseLeave={() => this.setState({ showTooltip: false })}
                    onDragStart={(e) => {
                        this.setState({ dragging: true });
                        this.state.dragStartFunction(e);
                    }}
                    onDrag={this.state.dragFunction}
                    onDragEnd={(e) => {
                        this.setState({ dragging: false })
                        this.state.dragEndFunction(e);
                    }}
                >
                    {this.state.icon}
                </IconButton>
            </Box>
        )
    }
}
