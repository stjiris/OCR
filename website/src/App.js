import './App.css';
import React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';

var BASE_URL = 'http://localhost:5000/'

class CustomButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      text: props.text,
      disabled: props.disabled,
      clickFunction: props.clickFunction
    };
  }

  changeDisabledState(currentState) {
    this.setState({ disabled: currentState });
  }

  render() {
    return (
      <Button onClick={() => this.state.clickFunction()} disabled={this.state.disabled} variant="contained">{this.state.text}</Button>
    );
  }
}

const CustomTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'gray',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'blue',
    },
  },
});

class Form extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      disabled: true,
    }
    
    this.uploadedFile = React.createRef();
    this.saveButton = React.createRef();
    this.loadFile = this.loadFile.bind(this);
    this.sendChanges = this.sendChanges.bind(this);
  }

  loadFile = () => {
    var el = window._protected_reference = document.createElement("INPUT");
    el.type = "file";
      
    el.addEventListener('change', () => {

      // test some async handling
      new Promise(() => {
        setTimeout(() => {
          let formData = new FormData();
          formData.append('file', el.files[0]);
          fetch(BASE_URL + 'submitFile', {
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
        <h1>OCR Application</h1>
        <div id="header-div">
          <CustomButton text="Insert File" disabled={false} clickFunction={this.loadFile} />
          <p ref={this.uploadedFile} id="fileInfo">No file submitted</p>
        </div>

        <CustomTextField id="docContents" rows={13} sx={{ml: '10px', mr: '10px'}} disabled={this.state.disabled} multiline />

        <div id="footer-div">
          <CustomButton ref={this.saveButton} text="Save Text" disabled={this.state.disabled} clickFunction={this.sendChanges} />
        </div>
      </div>
    )
  }
}

function App() {
  return (
    <Form />
  );
}

export default App;