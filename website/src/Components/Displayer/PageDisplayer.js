import React from 'react';

class PageDisplayer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            journal: null,
            page: 1
        }
    }

    setJournal(journal) {
        this.setState({ journal: journal });
    }

    setPage(page) {
        this.setState({ page: page });
    }
    
    render() {

        if (this.state.journal === null) {
            return <img className="pageImage" alt="Journal not Submitted" src="http://localhost/images/DefaultPage.png"/>
        }

        let page_url = "http://localhost/images/" + this.state.journal.split(".")[0] + "_" + this.state.page + ".jpg";
        return <img className="pageImage" alt="Journal Submitted" src={page_url}/>
    }
}

export default PageDisplayer;