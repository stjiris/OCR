import React from 'react';

import { Box } from '@mui/material';
import { Link } from '@mui/material';
import CustomButton from '../../Components/CustomButton.js';
import CustomTextField from '../../Components/CustomTextField.js';
import AlgoDropdown from '../../Components/AlgoDropdown.js';
import './Home.css';

var BASE_URL = 'http://localhost:5000/'

function Home() {
    
    class Form extends React.Component {
        constructor(props) {
            super(props);
            this.state = {
                disabled: true,
            }
            
            this.uploadedFile = React.createRef();
            this.algoDropdown = React.createRef();
            this.saveButton = React.createRef();
            this.loadFile = this.loadFile.bind(this);
            this.sendChanges = this.sendChanges.bind(this);
        }
    
        loadFile = () => {
            var algorithm = this.algoDropdown.current.state.algorithm;

            if (algorithm === "") {
                alert("Please select an algorithm");
                return;
            }

            if (algorithm !== "Tesseract") {
                alert("This algorithm is not supported yet");
                return;
            }

            var el = window._protected_reference = document.createElement("INPUT");
            el.type = "file";
                
            el.addEventListener('change', () => {
        
                // test some async handling
                new Promise(() => {
                    setTimeout(() => {
                        let formData = new FormData();
                        formData.append('file', el.files[0]);
                        fetch(BASE_URL + 'submitFile/' + algorithm, {
                            method: 'POST',
                            body: formData
                        })
                        .then(response => {return response.json()})
                        .then(data => {
                            if (data.success) {
            
                            this.setState({disabled: false});
                            this.saveButton.current.changeDisabledState(false);
                            this.uploadedFile.current.innerHTML = el.files[0].name;
                            document.getElementById("docContents").value = data.text;

                            if (data.score !== -1) {
                                alert("File submitted with success! Score: " + data.score);
                            }
            
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
                "text": document.getElementById("docContents").value,
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
    
        render() {
            return (
                <div className="App">
                    <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', ml: '2rem', mr: '2rem'}}>
                        <h1>OCR Application</h1>
                        <Link href="/files" underline="hover">
                            <h1>My Files</h1>
                        </Link>
                    </Box>
                    <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'normal', ml:'2rem', mr: '2rem'}}>
                        <AlgoDropdown ref={this.algoDropdown}/>
                        <CustomButton marginTop='0.7rem' text="Insert File" disabled={false} clickFunction={this.loadFile} />
                        <p ref={this.uploadedFile} id="fileInfo">No file submitted</p>
                    </Box>
            
                    <CustomTextField id="docContents" rows={13} sx={{mt: '1rem', ml: '10px', mr: '10px'}} disabled={this.state.disabled} multiline />
            
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

export default Home;