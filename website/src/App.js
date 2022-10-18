import './App.css';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';

function FileButton() {
  return (
    <Button onClick={
      () => {
        console.log("Button Clicked");
      }
    } variant="contained">Load File</Button>
  );
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

function App() {
  return (
    <div className="App">
      <h1>OCR Application</h1>

      <div id="header-div">
        <FileButton />
        <p id="fileInfo">No file submitted</p>
      </div>

      <CustomTextField rows={13} sx={{ml: '10px', mr: '10px'}} disabled multiline id="custom-css-outlined-input" />

      <div id="footer-div">
        <Button disabled variant="contained">Save Text</Button>
      </div>
    </div>
  );
}

export default App;
