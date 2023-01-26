import React from 'react';

class PageDisplayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filename: props.filename,
            page: props.page
        }
    }
    
    render() {
        var path = this.state.filename.split("/");

        var pathString = "./images/" + (
            (path.length === 0)
            ? ""
            : path.slice(1).join("/") + "/"
        )
        
        var fileWithoutPath = path[path.length - 1];
        var basename = fileWithoutPath.split(".")[0];

        let page_url = pathString + basename + "_" + (1 + this.state.page) + ".jpg";
        return <img className="pageImage" alt={page_url} src={page_url}/>
    }
}

export default PageDisplayer;