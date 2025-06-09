import React from 'react';

import Checkbox from '@mui/material/Checkbox';
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";

function CheckboxList({ options, defaultChoice, title, required, helperText, errorText }) {
    const [checked, setChecked] = React.useState(defaultChoice);

    const handleChange = (event) => {
        const { target : { value } } = event;

        const currentIndex = checked.indexOf(value);
        const newChecked = [...checked];

        if (currentIndex === -1) {
            newChecked.push(value);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setChecked(newChecked);
    };

    function getSelected() {
        return [...checked];
    }

    const error = required && checked.filter(v => v).length === 0;

    return (
        <FormControl
            required={required}
            error={error}
            component="fieldset"
            variant="standard"
        >
            <FormLabel component="legend">{title}</FormLabel>
            <FormGroup>
            {/*<List sx={{ width: '100%', maxWidth: 360, bgcolor: 'background.paper' }}>*/}
                {options.map(({ value, description }, index) => {
                    return (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    edge="start"
                                    checked={checked.includes(value)}
                                    value={value}
                                    onChange={handleChange}
                                    tabIndex={-1}
                                    disableRipple
                                />
                            }
                            label={description}
                        />
                    );
                })}
            </FormGroup>
            {helperText && <FormHelperText>{helperText}</FormHelperText>}
            {errorText && error && <FormHelperText>{errorText}</FormHelperText>}
        </FormControl>
    );
}

CheckboxList.defaultProps = {
    options: [],
    defaultChoice: [],
    title: "",
    required: false,
    helperText: null,
    errorText: null,
}

export default CheckboxList;
