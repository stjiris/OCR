import React from 'react';

import Checkbox from '@mui/material/Checkbox';
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";

function CheckboxList(
    {
        options = [],
        checked = [],
        title = "",
        required = false,
        disabled = false,
        helperText = null,
        errorText = null,
        // functions:
        onChangeCallback = null,  // required
    }) {

    const handleChange = (event) => {
        const { target : { value } } = event;

        const currentIndex = checked.indexOf(value);
        const newChecked = [...checked];

        if (currentIndex === -1) {
            newChecked.push(value);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        onChangeCallback(newChecked);
    };

    const error = required && checked.filter(v => v).length === 0;
    return (
        <FormControl
            required={required}
            disabled={disabled}
            error={error}
            component="fieldset"
            variant="standard"
        >
            <FormLabel component="legend">{title}</FormLabel>
            <FormGroup>
            {/*<List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>*/}
                {options.map((option, index) => {
                    return (
                        <FormControlLabel
                            disabled={option.disabled}
                            control={
                                <Checkbox
                                    edge="start"
                                    checked={checked.includes(option.value)}
                                    value={option.value}
                                    onChange={handleChange}
                                    tabIndex={-1}
                                    disableRipple
                                />
                            }
                            label={option.description}
                        />
                    );
                })}
            </FormGroup>
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
            {errorText && error && <FormHelperText>{errorText}</FormHelperText>}
        </FormControl>
    );
}

export default CheckboxList;
