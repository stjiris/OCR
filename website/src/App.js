import './App.css';
import React from 'react';

import { Box, Link, Button, IconButton } from '@mui/material';
import CustomButton from './Components/CustomButton.js';
import CustomTextField from './Components/CustomTextField.js';
import AlgoDropdown from './Components/AlgoDropdown.js';
import ProgressWheel from './Components/LoadingProgress.js';
// import io from 'socket.io-client';

import ArrowBackIosRoundedIcon from '@mui/icons-material/ArrowBackIosRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';

var BASE_URL = 'http://localhost:5001/'
// var socket = io(BASE_URL);

function App() {

  // let routes = (
  //   // UNPROTECTED ROUTES
  //   <Routes>
  //     <Route exact path='/' element={<Navigate to='/home' />}/>
  //     <Route exact path='/home' element={<Home/>}/>
  //   </Routes>
  // );

  // return <Router>{routes}</Router>;^
  class Form extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            disabled: true,
            backDisabled: true,
            frontDisabled: true,
            loadingVisible: false,
            page: 1,
            contents: []
        }
        
        this.fileButton = React.createRef();
        this.uploadedFile = React.createRef();
        this.algoDropdown = React.createRef();
        this.saveButton = React.createRef();

        this.arrowBackButton = React.createRef();
        this.pageText = React.createRef();
        this.arrowForwardButton = React.createRef();
        this.loadingWheel = React.createRef();

        this.loadFile = this.loadFile.bind(this);
        this.sendChanges = this.sendChanges.bind(this);
    }

    updatePage() {
        this.saveButton.current.changeDisabledState(this.state.disabled);
        document.getElementById("docContents").value = this.state.contents[0];
        this.setState({frontDisabled: false});
        this.updatePageText();
    }

    loadFile = () => {
        var algorithm = this.algoDropdown.current.state.algorithm;

        if (algorithm === "") {
            alert("Please select an algorithm");
            return;
        }

        if (algorithm === "Pero-OCR") {
            alert("This algorithm is not supported yet");
            return;
        }

        var el = window._protected_reference = document.createElement("INPUT");
        el.type = "file";
        el.accept = ".pdf";
            
        el.addEventListener('change', () => {
    
            // test some async handling
            new Promise(() => {
                setTimeout(() => {
                    // socket.emit('json', formData);

                    this.loadingWheel.current.show();
                    this.setState({disabled: true, backDisabled: true, frontDisabled: true});
                    this.saveButton.current.changeDisabledState(true);
                    this.fileButton.current.changeDisabledState(true);

                    let formData = new FormData();
                    formData.append('file', el.files[0]);
                    fetch(BASE_URL + 'submitFile/' + algorithm, {
                        method: 'POST',
                        mode: 'cors',
                        headers: {
                            'Access-Control-Allow-Origin': 'http://localhost:5001'
                        },
                        body: formData
                    })
                    .then(response => {return response.json()})
                    .then(data => {
                        if (data.success) {
        
                            this.uploadedFile.current.innerHTML = el.files[0].name;
                            this.setState({disabled: false, backDisabled: true, frontDisabled: false, contents: data.text, page: 1}, this.updatePage);
                            this.saveButton.current.changeDisabledState(false);
                            this.fileButton.current.changeDisabledState(false);

                            this.loadingWheel.current.hide();

                        // if (data.score !== -1) {
                        //     alert("File submitted with success! Score: " + data.score);
                        // }
        
                        } else {
                            alert(data.error);
                        }
                    });
                }, 1000);
            })
            .then(function() {
                // clear / free reference
                el = window._protected_reference = undefined;
                return null;
            });
        });
        el.click(); // open
    }

    sendChanges() {
        fetch(BASE_URL + 'submitText', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            "text": this.state.contents,
            "filename": this.uploadedFile.current.innerHTML
            })
        })
        .then(response => {return response.json()})
        .then(data => {
            if (data.success) {
            alert("Text submitted with success!");
            } else {
            alert(data.error);
            }
        });
    }

    updatePageText() {
        this.pageText.current.innerHTML = "Page " + this.state.page + " / " + this.state.contents.length;
        document.getElementById("docContents").value = this.state.contents[this.state.page - 1];
    }

    changePage(diff) {
        var newPage = this.state.page + diff;
        if (this.state.page < 1 || this.state.page > this.state.contents.length) {
            return;
        }
        if (newPage === 1) {
            this.setState({backDisabled: true});
        } else if (newPage === this.state.contents.length) {
            this.setState({frontDisabled: true});
        } else {
            this.setState({backDisabled: false});
            this.setState({frontDisabled: false});
        }
        this.setState({page: newPage}, this.updatePageText);
        
    }

    render() {
        return (
            <div className="App">
                <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', ml: '1.5rem', mr: '2rem', mb: '1rem'}}>
                    <img src="https://upload.net-empregos.com/uploads/91a0d52036ed4b2599c0aa85f272e93b/logo-net-empregos.png" className="App-logo" alt="Universidade Nova de Lisboa" />
                    <Box sx={{display: 'flex', flexDirection: 'row'}}>
                        <Link sx={{color: '#338141', mr: '2rem', mt: '0.25rem', fontSize: '0.75rem'}} to="/" href="http://localhost/" underline="hover">
                            <h1>Scan</h1>
                        </Link>
                        <Link sx={{color: '#48954f', mr: '0.05rem', mt: '0.25rem', fontSize: '0.75em'}} to="/files" href="http://localhost/files" underline="hover">
                            <h1>Files</h1>
                        </Link>
                    </Box>
                </Box>
                <Box sx={{display: 'flex', ml:'1.5rem', mr: '1.5rem'}}>
                    <AlgoDropdown ref={this.algoDropdown}/>
                    <CustomButton text="Insert File" ref={this.fileButton} disabled={false} clickFunction={this.loadFile} />
                    <ProgressWheel ref={this.loadingWheel}/>
                    <p hidden ref={this.uploadedFile} id="fileInfo">No file submitted</p>
                </Box>

                <Box sx={{ml: '1.5rem', mr: '1.5rem'}}>
                    <CustomTextField id="docContents" rows={14} fullWidth disabled={this.state.disabled} multiline />
                </Box>
        

                <div className="page-div">
                    <IconButton color="success" aria-label="back" disabled={this.state.backDisabled} onClick={() => this.changePage(-1)}><ArrowBackIosRoundedIcon /></IconButton>
                    <Button variant="text" sx={{color: '#000000'}} ref={this.pageText}>Page 0 / 0</Button>
                    <IconButton color="success" aria-label="back" disabled={this.state.frontDisabled} onClick={() => this.changePage(1)} sx={{mr: '1rem'}}><ArrowForwardIosRoundedIcon /></IconButton>
                </div>

                <div className="footer-div">
                    <CustomButton ref={this.saveButton} text="Save Text" disabled={this.state.disabled} clickFunction={this.sendChanges} />
                </div>
            </div>
        )
    }
}

return (
    <Form />
);
}

export default App;