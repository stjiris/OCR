import React from 'react';
import Box from '@mui/material/Box';

import addLine from "../../../static/addLine.svg"
import removeLine from "../../../static/removeLine.svg"
import loadComponent from '../../../utils/loadComponents.js';

class WordItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            item: props.item,
            section: props.section,
            line: props.line,
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
        this.state.item.updateContents(this.state.section, this.state.line, this.state.order, this.getOcrStructure());
    }

    render() {
        return (
            <Box
                sx={{
                    display: "inline-block",
                    backgroundColor: this.state.hovered ? "#1976d248" : "transparent",
                    borderRadius: "7px",
                    cursor: "pointer"
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

            editorMode: true,

            components: [],
            refs: [],
        }
    }

    componentDidMount() {
        this.buildComponents();
    }

    separateSections(section, line) {
        var section1 = this.state.contents[section].slice(0, line + 1);
        var section2 = this.state.contents[section].slice(line + 1);
        this.state.contents.splice(section, 1, section1, section2);

        this.setState({contents: this.state.contents}, this.buildComponents);
    }

    joinSections(section) {
        var section1 = this.state.contents[section];
        var section2 = this.state.contents[section + 1];
        var newSection = [...section1, ...section2];

        this.state.contents.splice(section, 2, newSection);

        this.setState({contents: this.state.contents}, this.buildComponents);
    }

    buildComponents() {
        var TooltipIcon = loadComponent('TooltipIcon', 'TooltipIcon');

        var components = [];
        var refs = [];

        // Iterate all the sections
        for (let s = 0; s < this.state.contents.length; s++) {
            let section = this.state.contents[s];

            // Iterate all the lines
            for (let l = 0; l < section.length; l++) {
                var content = section[l];
                var row = [];
                var rowRefs = [];

                // Iterate all the words
                for (var w = 0; w < content.length; w++) {
                    var word = content[w];
                    var ref = React.createRef();
                    row.push(<WordItem key={word["text"] + s + l + w} section={s} line={l} order={w} item={this} text={word["text"]} box={word["box"]} b={word["b"]} />);
                    rowRefs.push(ref);
                }

                if (s + 1 !== this.state.contents.length || l + 1 !== section.length) {
                    row.push(
                        <TooltipIcon
                            key={s + " " + l + " " + (l + 1 === section.length)}
                            padding={0}
                            icon={
                                <img 
                                    style={{width: '1.2rem'}} src={l + 1 === section.length ? removeLine : addLine} alt="New Line"
                                />
                            }
                            message={
                                l + 1 === section.length ? "Remover parágrafo" : "Adicionar parágrafo"
                            }
                            clickFunction={
                                () => {
                                    if (l + 1 === section.length) {
                                        this.joinSections(s);
                                    } else {
                                        this.separateSections(s, l);
                                    }
                                }
                            }
                        />
                    )
                }

                components.push(row);
                refs.push(rowRefs);
            }
        }

        this.setState({components: components, refs: refs});
    }

    updateContents(section, line, order, contents) {
        var pageContents = [...this.state.contents];
        pageContents[section][line][order] = contents;
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

                <Box sx={{marginTop: "1rem", display: "flex", flexDirection: "column", width: '100%'}}>
                    <Box sx={{display: "flex", flexDirection: "row"}}>
                        <Box className="editorSelector" sx={{
                            backgroundColor: this.state.editorMode ? "#1976d248" : "transparent",
                        }} onClick={() => this.setState({editorMode: true})}>
                            <span style={{margin: "5px 10px"}}>Editor</span>
                        </Box>
                        <Box className="editorSelector" sx={{
                            backgroundColor: !this.state.editorMode ? "#1976d248" : "transparent",
                        }} onClick={() => this.setState({editorMode: false})}>
                            <span style={{margin: "5px 10px"}}>Pré-Visualização</span>
                        </Box>
                    </Box>

                    <Box sx={{display: 'flex', flexDirection: 'column', width: '100%', border: "1px solid black"}}>
                        {
                            this.state.editorMode
                            ? <Box>
                                {
                                    this.state.components.map((row, index) => {
                                        return (
                                            <Box key={index} sx={{display: 'flex', flexDirection: 'row', flexWrap: "wrap", mb: '5px'}}>
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
                            : <Box sx={{display: 'flex', flexDirection: 'column', width: '100%'}}>
                                {
                                    this.state.contents.map((section, index) => {
                                        return (
                                            <Box key={index} sx={{display: 'flex', flexDirection: 'row', flexWrap: "wrap", mb: '5px'}}>
                                                {
                                                    section.map((line, index) => {
                                                        return (
                                                            <>
                                                                {
                                                                    line.map((word, index) => {
                                                                        return (
                                                                            <span key={index} style={{padding: "0px 3px", fontSize: "13px"}}>
                                                                                {word["text"]}
                                                                            </span>
                                                                        )
                                                                    })
                                                                }
                                                            </>
                                                        )
                                                    })
                                                }
                                            </Box>
                                        )
                                    })
                                }
                            </Box>
                        }
                    </Box>
                </Box>
            </Box>
        )
    }
}
