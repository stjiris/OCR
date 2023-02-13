import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';

import {ZoomImage, ImageModal} from './ImageModal';

class PageDisplayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filename: props.filename,
            page: props.page
        }

        this.modal = React.createRef();
    }

    expandImage() {
        this.modal.current.handleOpen();
    }
    
    render() {
        var path = this.state.filename.split("/");

        var pathString = (process.env.REACT_APP_IMAGES_PREFIX || ".") + "/images/" + (
            (path.length === 0)
            ? ""
            : path.slice(1).join("/") + "/"
        )
        
        var fileWithoutPath = path[path.length - 1];
        var basename = fileWithoutPath.split(".")[0];

        let page_url;
        if (isNaN(this.state.page)) {
            page_url = pathString + basename + "_1.jpg";
        } else {
            page_url = pathString + basename + "_" + (1 + this.state.page) + ".jpg";
        }

        return (
            <Box>
                <ImageModal image={page_url} />
                <ZoomImage image={page_url} ref={this.modal}/>
                <Card
                    sx={{
                        mr: '0.5rem',
                        ":hover": {
                            cursor: 'pointer',
                            boxShadow: 3,
                        },
                    }}
                    onClick={() => this.expandImage()}
                >
                    <CardMedia
                        component="img"
                        height="120"
                        sx={{objectFit: 'contain', padding: 0}}
                        image={page_url}
                    />
                </Card>
            </Box>
        );
    }
}

export default PageDisplayer;