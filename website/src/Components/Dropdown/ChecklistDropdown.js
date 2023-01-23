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

    setVisible() {
        this.setState({ visible: true });
    }
    
    setInvisible() {
        this.setState({ visible: false });
    }

    getChoice() {
        return this.state.choice.map((x) => x.code).join('+');
    }

    getChoiceList() {
        return this.state.choice.map((x) => x.code);
    }

    handleChange(event) {

        const { target : { value } } = event;

        let duplicateRemoved = [];
        value.forEach((item) => {
            if (duplicateRemoved.findIndex((o) => o.id === item.id) >= 0) {
                duplicateRemoved = duplicateRemoved.filter((x) => x.id !== item.id);
            } else {
                duplicateRemoved.push(item);
            }
        });

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
                                    <MenuItem key={variant.id} value={variant} sx={{height: '2.5rem'}}>
                                        <Checkbox checked={this.state.choice.findIndex((item) => item.id === variant.id) >= 0} />
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