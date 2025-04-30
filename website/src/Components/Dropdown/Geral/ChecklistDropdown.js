import React from 'react';

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import {Checkbox, FormHelperText} from "@mui/material";
import ListItemText from "@mui/material/ListItemText";


const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

class ChecklistDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: true,
            choice: props.defaultChoice,
            parentfunc: props.parentfunc
        }
    }

    getChoiceList() {
        /**
         * Return the choice as a list
         */
        return this.state.choice.map((x) => x.code);
    }

    handleChange(event) {
        /**
         * If an option is selected or disabled, update the choice list
         */
        let { target : { value } } = event;

        // When disabling an option, the value will appear twice in the list
        // This code removes the duplicates
        /*
        let duplicateRemoved = [];
        value.forEach((item) => {
            if (duplicateRemoved.findIndex((o) => o.name === item.name) >= 0) {
                duplicateRemoved = duplicateRemoved.filter((x) => x.name !== item.name);
            } else {
                duplicateRemoved.push(item);
            }
        });
        */

        // If all options are disabled, reset the choice list to the default
        if (value.length === 0) {
            value = this.props.defaultChoice
        }

        if (this.props.parentfunc !== undefined) {
            this.setState({ choice: value }, this.props.parentfunc);
        } else {
            this.setState({ choice: value });
        }
    }

    render() {
        return (
            <div>
                {
                    this.state.visible
                    &&
                    <FormControl open={this.state.visible} className="simpleDropdown">
                        <InputLabel>{this.props.label}</InputLabel>
                        <Select
                            multiple
                            label={this.props.label}
                            value={this.state.choice}
                            onChange={(e) => this.handleChange(e)}
                            input={<OutlinedInput label={this.props.label} />}
                            renderValue={(selected) => selected.map((x) => x.code).join(', ')}
                            MenuProps={MenuProps}
                            sx={{height: '2.5rem'}}
                        >
                            {
                                this.props.options.map((option) => (
                                    <MenuItem key={option.name} value={option} sx={{height: '2.5rem'}}>
                                        <Checkbox checked={this.state.choice.includes(option)} />
                                        <ListItemText primary={option.name} />
                                    </MenuItem>
                                ))
                            }
                        </Select>
                        <FormHelperText>{this.props.helperText}</FormHelperText>
                    </FormControl>
                }
            </div>
        );
    }
}

ChecklistDropdown.defaultProps = {
    options: null,
    defaultChoice: null,
    label: null,
    helperText: null,
    // functions:
    parentfunc: null
}

export default ChecklistDropdown;
