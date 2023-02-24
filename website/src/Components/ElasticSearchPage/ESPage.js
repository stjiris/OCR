import * as React from 'react';

import Box from '@mui/material/Box';
import Icon from '@mui/material/Icon';
import TextField from '@mui/material/TextField';

import InboxIcon from '@mui/icons-material/Inbox';
import ChecklistDropdown from '../Dropdown/ChecklistDropdown';
import { Divider } from '@mui/material';
import PageDisplayer from '../Displayer/PageDisplayer';

class ESItem extends React.Component {
    // This component is used to display a single page from the ElasticSearch database
    constructor(props) {
        super(props);
        this.state = {
            page: props.page,
        }
    }

    render() {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'left',
                mb: '0.5rem',
            }}>
                <Divider color="success" orientation='vertical' flexItem sx={{mr: '0.5rem'}} />
                <Box>
                    <PageDisplayer
                        filename={this.state.page['_id'].split('/').slice(0, -1).join('/')}
                        page={this.state.page['_source']['Page']-1}
                    />
                </Box>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <span><b>File:</b> {this.state.page['_id']}</span>                
                    <span><b>Page:</b> {this.state.page['_source']['Page']}</span>                
                    <span><b>Page Text:</b> {this.state.page['_source']['Text']}</span>
                </Box>
            </Box>
        )
    }
}

class ESPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            pages: [],
            showing: [],
            freeText: "",

            app: props.app,
            loading: true
        }

        // Filters
        this.freeText = React.createRef();
        this.journal = React.createRef();
        this.fileType = React.createRef();
    }

    get_journal(data) {
        /**
         * Get the journal name from the file path
         * 
         * ! Needs to keep some of the path otherwise can get duplicates with other folders
         */
        var journal = data['_id'].split('/').slice(0,-1).join('/');
        return journal;
    }

    get_fileType(data) {
        /**
         * Get the file type from the file path
         */
        var splitted = data['_id'].split('/').slice(-2)[0].split('.')
        var fileType = splitted[splitted.length-1].toUpperCase();
        return fileType;
    }

    componentDidMount() {
        /**
         * When the component is mounted, get the data from the ElasticSearch database
         */
        fetch(process.env.REACT_APP_API_URL + "get_elasticsearch", {
            method: 'GET'
        })
        .then(response => {return response.json()})
        .then(data => {
            var journals = [];
            var fileTypes = [];
            for (var i = 0; i < data.length; i++) {

                var journal = this.get_journal(data[i]);
                var names = journals.map(j => j.name);
                if (!names.includes(journal)) {
                    journals.push({
                        "name": journal,
                        "code": journal
                    });
                }

                var fileType = this.get_fileType(data[i]);
                names = fileTypes.map(j => j.name);
                if (!names.includes(fileType)) {
                    fileTypes.push({
                        "name": fileType,
                        "code": fileType
                    });
                }
            }

            if (this.journal.current !== null)
                this.journal.current.setState({options: journals, choice: this.state.app.state.filesChoice});
            if (this.fileType.current !== null)
                this.fileType.current.setState({options: fileTypes});
            this.setState({pages: data, showing: data, loading: false}, this.filterPages);
        });
    }

    changeText(event) {
        /**
         * Handle the change in the text field
         */
        this.setState({freeText: event.target.value}, this.filterPages);
    }

    filterPages() {
        /**
         * Filter the pages based on the filters
         */
        var current_showing = [];

        var freeText = this.state.freeText;
        var journal = this.journal.current.getChoiceList();
        var fileType = this.fileType.current.getChoiceList();

        const containsFreeText = (element) => element.toString().toLowerCase().includes(freeText.toLowerCase());

        this.state.pages.forEach(page => {
            var values = Object.keys(page["_source"]).map(function(key){
                return page["_source"][key];
            });
            values.push(page["_id"]);
            
            if (
                values.some(containsFreeText) && 
                (journal.length === 0 || journal.includes(this.get_journal(page))) &&
                (fileType.length === 0 || fileType.includes(this.get_fileType(page)))
            ) {
                current_showing.push(page);
            }
        });

        this.setState({showing: current_showing});
    }

    render() {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
            }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '15%',
                    ml: '1.5rem'
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'left',
                        alignItems: 'center',
                    }}>
                        <Icon aria-label="download_txt" sx={{mr: '5px'}}>
                            <InboxIcon />
                        </Icon>
                        <p style={{fontSize: '15px'}}><b>{this.state.showing.length} Pages</b></p>
                    </Box>
                    <TextField onChange={(e) => this.changeText(e)} ref={this.freeText} label="Free Text" variant='outlined' size="small" sx={{width: '100%', mb: '0.3rem'}}/>
                    <ChecklistDropdown parentfunc={() => this.filterPages()} ref={this.journal} label={"Journal"} options={[]} choice={[]} />
                    <ChecklistDropdown parentfunc={() => this.filterPages()} ref={this.fileType} label={"File Type"} options={[]} choice={[]} />
                </Box>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '80%',
                    mr: '1.5rem',
                    ml: '1rem',
                }}>
                    {   
                        this.state.loading
                        ? <p style={{fontSize: '20px'}}><b>Loading...</b></p>

                        :   this.state.showing.length === 0
                            ? <p style={{fontSize: '20px'}}><b>No pages found</b></p>
                            : this.state.showing.sort((a, b) => (a['_id'] > b['_id'] ? 1 : -1)).map((page, index) => {
                                return(
                                    <Box key={page['_id']} sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}>
                                        {
                                            index > 0 ? <Divider sx={{mb: '10px'}}/> : null
                                        }
                                        <ESItem page={page} />
                                    </Box>
                                )
                            })
                    }
                </Box>
            </Box>
        )
    }
}

export default ESPage;