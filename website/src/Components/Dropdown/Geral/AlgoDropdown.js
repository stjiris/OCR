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
      algorithm: 'Tesseract',
      menu: props.menu  // TODO: remove this reference and use strictly necessary props
    }
  }

  getChoice() {
    return this.state.algorithm;
  }

  changeAlgorithm = (event) => {
    /**
     * Update the page; language dropdown will be updated accordingly
     */
    this.state.menu.changeAlgorithm(event.target.value);
    this.setState({ algorithm: event.target.value });
  }

  render() {
    return (
      <Box sx={{ minWidth: 140, mt: '0.5rem', mb: '0.5rem'}}>
        <FormControl fullWidth size="small">
          <InputLabel id="demo-simple-select-label">Algoritmo</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={this.state.algorithm}
            label="Algoritmo"
            onChange={this.changeAlgorithm}
          >
            <MenuItem value={"Tesseract"}>Tesseract</MenuItem>
            <MenuItem value={"EasyOCR"}>EasyOCR</MenuItem>
          </Select>
        </FormControl>
      </Box>
    );
  }
}

export default AlgoDropdown;
