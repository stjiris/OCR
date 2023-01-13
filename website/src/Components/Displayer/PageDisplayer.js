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
        var fileWithoutPath = this.state.filename.split("/");
        fileWithoutPath = fileWithoutPath[fileWithoutPath.length - 1];
        var basename = fileWithoutPath.split(".")[0];
        let page_url = "http://localhost/images/" + this.state.filename + '/' + basename + "_" + (1 + this.state.page) + ".jpg";
        return <img className="pageImage" alt={page_url} src={page_url}/>
    }
}

export default PageDisplayer;