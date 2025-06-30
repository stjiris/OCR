import React from 'react';

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import {Checkbox, FormHelperText} from "@mui/material";
import ListItemText from "@mui/material/ListItemText";

const MenuProps = {
  PaperProps: {
    style: {
      //maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 'auto',
      maxHeight: '70%',
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

    getSelectedNames() {
        return this.state.choice.map((x) => x.name);
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

        // Handle "select all" option
        if (value[value.length - 1] === "all") {
            if (this.state.choice.length === this.props.options.length) {
                // If all are selected, revert to default
                value = this.props.defaultChoice;
            } else {
                // If not all are selected, select all
                value = [...this.props.options];
            }
        }

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
                    <FormControl open={this.state.visible} className={this.props.className}>
                        <InputLabel>{this.props.label}</InputLabel>
                        <Select
                            multiple
                            label={this.props.label}
                            value={this.state.choice}
                            onChange={(e) => this.handleChange(e)}
                            input={<OutlinedInput label={this.props.label} />}
                            onClose={this.props.onCloseFunc}
                            renderValue={(selected) => selected.map((x) => x.code).join(', ')}
                            MenuProps={MenuProps}
                            sx={{height: '2.5rem'}}
                        >
                            {
                                this.props.allowCheckAll
                                ?
                                <MenuItem key="all" value="all" sx={{height: '2.5rem'}}>
                                    <Checkbox
                                        checked={this.state.choice.length > 0 && this.state.choice.length === this.props.options.length}
                                        //indeterminate={this.state.choice.length > 0 && this.state.choice.length < this.props.options.length}
                                    />
                                    <ListItemText primary={"Selecionar tudo"} />
                                </MenuItem>
                                : null
                            }
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
    options: [],
    defaultChoice: [],
    label: null,
    helperText: null,
    allowCheckAll: false,
    className: "simpleDropdown",
    // functions:
    onCloseFunc: null,
    parentfunc: null
}

export default ChecklistDropdown;
