import React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

class AlgoDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      algorithm: ''
    }
  }

  changeAlgorithm = (event) => {
    this.setState({ algorithm: event.target.value });
  }

  render() {
    return (
      <Box sx={{ minWidth: 140, mr: '1rem'}}>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">Algorithm</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={this.state.algorithm}
            label="Algorithm"
            onChange={this.changeAlgorithm}
          >
            <MenuItem value={"Tesseract"}>Tesseract</MenuItem>
            <MenuItem value={"Pero-OCR"}>Pero-OCR</MenuItem>
            <MenuItem value={"EasyOCR"}>EasyOCR</MenuItem>
          </Select>
        </FormControl>
      </Box>
    );
  }
}

export default AlgoDropdown;