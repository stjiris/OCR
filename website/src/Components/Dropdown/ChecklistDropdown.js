import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';

import * as React from 'react';

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

export default class ChecklistDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: true,
            options: props.options,
            choice: props.choice,
            default: props.choice,
            label: props.label,
            parentfunc: props.parentfunc
        }

        this.getChoice = this.getChoice.bind(this);
    }

    // Setters
    setOptions(options) {
        this.setState({ options: options });
    }

    setChoice(choice) {
        this.setState({ choice: choice });
    }

    getChoice() {
        /**
         * Return the choice as a string
         */
        return this.state.choice.map((x) => x.code).join('+');
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
        const { target : { value } } = event;

        // When disabling an option, the value will appear twice in the list
        // This code removes the duplicates
        let duplicateRemoved = [];
        value.forEach((item) => {
            if (duplicateRemoved.findIndex((o) => o.name === item.name) >= 0) {
                duplicateRemoved = duplicateRemoved.filter((x) => x.name !== item.name);
            } else {
                duplicateRemoved.push(item);
            }
        });

        // If all options are disabled, reset the choice list to the default
        if (duplicateRemoved.length === 0) {
            duplicateRemoved = this.state.default
        }

        if (this.state.parentfunc !== undefined) {
            this.setState({ choice: duplicateRemoved }, this.state.parentfunc);
        } else {
            this.setState({ choice: duplicateRemoved });
        }
    }

    render() {
        return (
            <div>
                {
                    this.state.visible && <FormControl open={this.state.visible} sx={{mb: '0.3rem', mt: '0.5rem', width: '100%'}}>
                        <InputLabel sx={{mt: '-0.45rem'}}>{this.state.label}</InputLabel>
                        <Select
                            multiple
                            value={this.state.choice}
                            onChange={(e) => this.handleChange(e)}
                            input={<OutlinedInput label={this.state.label} />}
                            renderValue={(selected) => selected.map((x) => x.code).join(', ')}
                            MenuProps={MenuProps}
                            sx={{height: '2.5rem'}}
                        >
                            {
                                this.state.options.map((variant) => (
                                    <MenuItem key={variant.name} value={variant} sx={{height: '2.5rem'}}>
                                        <Checkbox checked={this.state.choice.findIndex((item) => item.name === variant.name) >= 0} />
                                        <ListItemText primary={variant.name} />
                                    </MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>
                }
            </div>
        );
    }
}
