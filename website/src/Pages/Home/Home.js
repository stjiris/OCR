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

            if (algorithm === "Pero-OCR") {
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
                    <Box sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', ml: '1.5rem', mr: '2rem', mb: '1rem'}}>
                        <img src="https://upload.net-empregos.com/uploads/91a0d52036ed4b2599c0aa85f272e93b/logo-net-empregos.png" className="App-logo" alt="Universidade Nova de Lisboa" />
                        <Link sx={{color: '#2e7d32'}} href="/files" underline="hover">
                            <h1>My Files</h1>
                        </Link>
                    </Box>
                    <Box sx={{display: 'flex', ml:'1.5rem', mr: '1.5rem'}}>
                        <AlgoDropdown ref={this.algoDropdown}/>
                        <CustomButton text="Insert File" disabled={false} clickFunction={this.loadFile} />
                        <p hidden ref={this.uploadedFile} id="fileInfo">No file submitted</p>
                    </Box>
            
                    <CustomTextField id="docContents" rows={15} sx={{ml: '1.5rem', mr: '1.5rem'}} disabled={this.state.disabled} multiline />
            
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