import React from 'react';
import Box from '@mui/material/Box';

import loadComponent from '../../../utils/loadComponents.js';

class WordItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            item: props.item,
            row: props.row,
            order: props.order,

            text: props.text,
            box: props.box,
            b: props.b,

            hovered: false,
            changingMode: false,
        }
    }

    getOcrStructure() {
        return {
            "b": this.state.b,
            "box": this.state.box,
            "text": this.state.text,
        }
    }

    afterUpdate() {
        this.setState({ changingMode: false, hovered: false });
        this.state.item.updateContents(this.state.row, this.state.order, this.getOcrStructure());
    }

    render() {
        return (
            <Box
                sx={{
                    display: "inline-block",
                    backgroundColor: this.state.hovered ? "#a6a6a6a6" : "transparent",
                    borderRadius: "5px",
                }}
                onMouseEnter={() => this.setState({hovered: true})}
                onMouseLeave={() => this.setState({hovered: false})}
                onClick={() => this.setState({changingMode: true})}
            >
                {
                    this.state.changingMode
                    ? <input 
                        style={{
                            width: `${this.state.text.length}ch`
                        }}
                        type="text"
                        value={this.state.text}
                        onChange={(event) => this.setState({text: event.target.value})}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                this.afterUpdate();
                            }
                        }}
                        onBlur={() => this.afterUpdate()}
                        autoFocus
                    />
                    : <span 
                        style={{
                            padding: "0px 3px",
                            fontSize: "13px"
                        }}
                    >
                        {this.state.text}
                    </span>
                }
            </Box>
        )
    }
}

export default class PageItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            page: props.page,
            image: props.image,
            index: props.index,
            contents: props.contents,

            components: [],
            refs: [],
        }
    }

    componentDidMount() {
        this.buildComponents();
    }

    buildComponents() {
        var components = [];
        var refs = [];

        for (var i = 0; i < this.state.contents.length; i++) {
            var content = this.state.contents[i];
            var row = [];
            var rowRefs = [];

            for (var j = 0; j < content.length; j++) {
                var component = content[j];
                var ref = React.createRef();
                row.push(<WordItem key={component["text"] + i + j} row={i} order={j} item={this} text={component["text"]} box={component["box"]} b={component["b"]} />);
                rowRefs.push(ref);
            }

            components.push(row);
            refs.push(rowRefs);
        }

        this.setState({components: components, refs: refs});
    }

    updateContents(row, order, contents) {
        var pageContents = [...this.state.contents];
        pageContents[row][order] = contents;
        this.state.page.updateContents(this.state.index, pageContents);
    }

    render() {
        const PageDisplayer = loadComponent('Displayer', 'PageDisplayer')

        return (
            <Box sx={{display: 'flex', flexDirection: 'row', mb: '1rem'}}>
                <Box sx={{textAlign: 'center'}}>
                    <PageDisplayer path={this.state.image} />
                    <p>{'Page ' + (this.state.index + 1)}</p>
                </Box>

                <Box sx={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                    {
                        this.state.components.map((row, index) => {
                            return (
                                <Box key={index} sx={{display: 'flex', flexDirection: 'row', mb: '3px'}}>
                                    {
                                        row.map((component) => {
                                            return component;
                                        })
                                    }
                                </Box>
                            )
                        })
                    }
                </Box>
            </Box>
        )
    }
}
