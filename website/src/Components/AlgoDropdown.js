import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function BasicSelect() {
  const [algorithm, setAlgorithm] = React.useState('');

  const handleChange = (event) => {
    setAlgorithm(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 140, mr: '1rem'}}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Algorithm</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={algorithm}
          label="Algorithm"
          onChange={handleChange}
        >
          <MenuItem value={"Tesseract"}>Tesseract</MenuItem>
          <MenuItem value={"Pero-OCR"}>Pero-OCR</MenuItem>
          <MenuItem value={"EasyOCR"}>EasyOCR</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}