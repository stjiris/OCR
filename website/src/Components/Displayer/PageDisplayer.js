import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';

class PageDisplayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filename: props.filename,
            page: props.page,
            maxWidth: '150px'
        }
    }
    
    render() {
        var path = this.state.filename.split("/");

        var pathString = (process.env.REACT_APP_IMAGES_PREFIX || ".") + "/images/" + (
            (path.length === 0)
            ? ""
            : path.slice(1).join("/") + "/"
        )
        
        var fileWithoutPath = path[path.length - 1];
        var basename = fileWithoutPath.split(".").slice(0, -1).join(".");

        let page_url;
        if (isNaN(this.state.page)) {
            page_url = pathString + basename + "_1.jpg";
        } else {
            page_url = pathString + basename + "_" + (1 + this.state.page) + ".jpg";
        }

        return (
            <Box
                sx={{maxWidth: `${this.state.maxWidth}`, border: '1px solid #d9d9d9', boxShadow: 1, mr: '0.5rem'}}
            >
                <a
                    href={page_url}
                    target="_blank"
                    rel="noreferrer"
                >
                    <img 
                        src={page_url}
                        alt={page_url}
                        style={{maxWidth: `${this.state.maxWidth}`}}
                    />
                </a>
            </Box>
        );
    }
}

export default PageDisplayer;