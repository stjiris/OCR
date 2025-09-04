import React from 'react';
import axios from "axios";

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from "@mui/material/CircularProgress";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import RotateLeft from "@mui/icons-material/RotateLeft";
import SaveIcon from "@mui/icons-material/Save";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControl from "@mui/material/FormControl";

import {
    defaultConfig,
    emptyConfig,
    engineList,
    tesseractLangList,
    tesseractModeList,
    tesseractOutputsList,
    tesseractSegmentList,
    tesseractThreshList,
} from "defaultOcrConfigs";

import ReturnButton from 'Components/FileSystem/ReturnButton';
import ConfirmLeave from 'Components/Notifications/ConfirmLeave';
import Notification from 'Components/Notifications/Notification';
//const AlgoDropdown = loadComponent('Dropdown', 'AlgoDropdown');
import CheckboxList from 'Components/Form/CheckboxList';

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;


class OcrMenu extends React.Component {
    constructor(props) {
        super(props);
        const usingDefault = this.props.customConfig == null;  // null or undefined
        this.state = {
            ...emptyConfig,
            presetsList: [],
            presetName: "",
            defaultConfig: defaultConfig,
            // lists of options in state, to allow changing them dynamically depending on other choices
            // e.g. when choosing an OCR engine that has different parameter values
            engineOptions: engineList,
            engineModeOptions: tesseractModeList,
            segmentModeOptions: tesseractSegmentList,
            thresholdMethodOptions: tesseractThreshList,
            usingDefault: usingDefault,
            uncommittedChanges: false,
            loaded: false,  // true if default configuration has been fetched and page is ready
            fetchingPreset: false,  // true if selected preset has been fetched
        }

        // Disable options restricted to single-page if configuring for multi-page documents
        tesseractOutputsList[tesseractOutputsList.length-2]["disabled"] = !this.props.isSinglePage && !this.props.isFolder;  // hOCR output
        tesseractOutputsList[tesseractOutputsList.length-1]["disabled"] = !this.props.isSinglePage && !this.props.isFolder;  // ALTO output

        this.confirmLeave = React.createRef();
        this.successNot = React.createRef();
        this.errorNot = React.createRef();

        //this.algoDropdown = React.createRef();

        this.storageMenu = React.createRef();

        this.dpiField = React.createRef();
        this.moreParams = React.createRef();

        this.goBack = this.goBack.bind(this);
        this.leave = this.leave.bind(this);
        this.setLangList = this.setLangList.bind(this);
        this.setOutputList = this.setOutputList.bind(this);
    }

    preventExit(event) {
        event.preventDefault();
        event.returnValue = '';
    }

    fetchDefaultConfig() {
        axios.get(API_URL + '/default-config')
            .then(({ data }) => {
                if (!this.state.loaded) {
                    // entering config menu, set initial config
                    const initialConfig = Object.assign({...data}, this.props.customConfig);
                    this.setState({...initialConfig, defaultConfig: data, loaded: true});
                } else {
                    this.setState({defaultConfig: data});
                }
            })
            .catch(err => {
                this.errorNot.current.openNotif("Não foi possível obter a configuração por defeito mais atual");
                if (!this.state.loaded) {
                    // entering config, use hardcoded default for initial config
                    const initialConfig = Object.assign({...defaultConfig}, this.props.customConfig);
                    this.setState({...initialConfig, loaded: true});
                }
            });
    }

    fetchConfigPreset(name) {
        this.setState({fetchingPreset: true});
        axios.get(API_URL + '/config-preset', {
            params: {
                name: name,
            }
        })
            .then(({ data }) => {
                this.setState({
                    ...data,
                    presetName: name,
                    usingDefault: false,
                    fetchingPreset: false,
                    uncommittedChanges: true
                });
            })
            .catch(err => {
                this.errorNot.current.openNotif("Não foi possível obter a configuração predefinida");
                this.setState({presetName: null, fetchingPreset: false});
            });
    }

    fetchPresetsList() {
        axios.get(API_URL + '/presets-list')
            .then(({ data }) => {
                this.setState({presetsList: data});
            })
            .catch(err => {
                this.errorNot.current.openNotif("Não foi possível atualizar a lista de configurações predefinidas");
            });
    }

    componentDidMount() {
        this.fetchDefaultConfig();
        this.fetchPresetsList();
        this.interval = setInterval(() => {
            this.fetchDefaultConfig();
            this.fetchPresetsList();
        }, 120000);  // getting an updated default configuration for every 2 minutes on this page is already generous
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (!prevState.uncommittedChanges && this.state.uncommittedChanges) {
            window.addEventListener('beforeunload', this.preventExit);
        } else if (prevState.uncommittedChanges && !this.state.uncommittedChanges) {
            window.removeEventListener('beforeunload', this.preventExit);
        }
    }

    componentWillUnmount() {
        if (this.interval)
            clearInterval(this.interval);
    }

    getConfig() {
        const config = {
            engine: this.state.engine,
            lang: this.state.lang,
            outputs: this.state.outputs,
            engineMode: this.state.engineMode,
            segmentMode: this.state.segmentMode,
            thresholdMethod: this.state.thresholdMethod,
        }
        if (this.state.dpiVal !== null && this.state.dpiVal !== "") {
            config.dpi = this.state.dpiVal;
        }
        if (this.state.otherParams !== null && this.state.otherParams !== "") {
            config.otherParams = this.state.otherParams;
        }
        return config;
    }

    selectPreset(name) {
        if (name === null || name === "") {  // cleared the preset box, not applying preset
            this.setState({presetName: null});
        } else {
            this.fetchConfigPreset(name);
        }
    }

    restoreDefault() {
        if (this.state.usingDefault) return;
        this.setState({
            ...this.state.defaultConfig,
            presetName: null,
            usingDefault: true,
            uncommittedChanges: this.props.customConfig != null,  // no changes if was already default
        });
    }

    setLangList(checked) {
        this.setState({ lang: checked, usingDefault: false, uncommittedChanges: true });
    }

    setOutputList(checked) {
        this.setState({ outputs: checked, usingDefault: false, uncommittedChanges: true });
    }

    changeDpi(value) {
        value = value.trim()
        if (!(/^[1-9][0-9]*$/.test(value))) {
            this.errorNot.current.openNotif("O valor de DPI deve ser um número inteiro!");
        }
        this.setState({ dpiVal: value, usingDefault: false, uncommittedChanges: true });
    }

    changeEngine(value) {
        this.setState({ engine: value, usingDefault: false, uncommittedChanges: true });
    }

    changeEngineMode(value) {
        this.setState({ engineMode: Number(value), usingDefault: false, uncommittedChanges: true });
    }

    changeSegmentationMode(value) {
        this.setState({ segmentMode: Number(value), usingDefault: false, uncommittedChanges: true });
    }

    changeThresholdingMethod(value) {
        this.setState({ thresholdMethod: Number(value), usingDefault: false, uncommittedChanges: true });
    }

    changeAdditionalParams(value) {
        this.setState({ otherParams: value, usingDefault: false, uncommittedChanges: true });
    }

    goBack() {
        if (this.state.uncommittedChanges) {
            this.confirmLeave.current.toggleOpen();
        } else {
            window.removeEventListener('beforeunload', this.preventExit);
            this.props.closeOCRMenu();
        }
    }

    leave() {
        window.removeEventListener('beforeunload', this.preventExit);
        this.props.closeOCRMenu();
        this.confirmLeave.current.toggleOpen();
    }

    saveConfig(exit = false) {
        const path = (this.props.spaceId + '/' + this.props.current_folder + '/' + this.props.filename).replace(/^\//, '');
        const config = this.state.usingDefault ? "default" : this.getConfig();
        axios.post(API_URL + '/save-config',
            {
                _private: this.props._private,
                path: path,
                config: config,
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(({ data }) => {
                if (data["success"]) {
                    this.setState({ uncommittedChanges: false });

                    this.successNot.current.openNotif("Configuração de OCR guardada com sucesso.");

                    if (exit) {
                        this.leave();
                    } else {
                        this.props.setCurrentCustomConfig(config);
                    }
                } else {
                    this.errorNot.current.openNotif("Erro inesperado ao guardar a configuração de OCR.")
                }
            })
            .catch(err => {
                this.errorNot.current.openNotif("Não foi possível guardar a configuração de OCR.");
            });
    }

    render() {
        const valid = (
            (this.state.dpiVal === null || this.state.dpiVal === "" || (/^[1-9][0-9]*$/.test(this.state.dpiVal)))
            && this.state.lang.length !== 0
            && this.state.outputs.length !== 0
        );
        return (
        <>
            <Notification message={""} severity={"success"} ref={this.successNot}/>
            <Notification message={""} severity={"error"} ref={this.errorNot}/>
            <ConfirmLeave leaveFunc={this.leave} ref={this.confirmLeave} />

            <Box className="toolbar">
                <Box className="noMarginRight" sx={{display: "flex"}}>
                    <ReturnButton
                        disabled={false}
                        returnFunction={this.goBack}
                    />

                    <Typography
                        variant="h5"
                        component="h2"
                        className="toolbarTitle"
                    >
                        Configurar OCR {this.props.isFolder ? 'da pasta' : 'do ficheiro'} <b>{this.props.filename}</b>
                    </Typography>
                </Box>

                <Box sx={{display: "flex", flexDirection: "row"}}>
                    <Autocomplete
                        value={this.state.presetName}
                        options={this.state.presetsList}
                        getOptionLabel={(option) => option}
                        autoHighlight
                        onChange={(e, newValue) => this.selectPreset(newValue)}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                required
                                placeholder="Escolher configuração predefinida"
                                variant="outlined"
                                size="small"
                                sx={{
                                    height: "2rem",
                                    width: "25rem",
                                }}
                            />
                        )}
                        sx={{marginRight: "1rem", marginTop: "0.5rem"}}
                        slotProps={{
                            paper: {  // dropdown popup props
                                sx: {
                                    width: 'auto',
                                    maxHeight: '70%',
                                }
                            }
                        }}
                    />
                    <Button
                        disabled={this.state.usingDefault}
                        variant="contained"
                        className="menuFunctionButton"
                        startIcon={<RotateLeft />}
                        onClick={() => this.restoreDefault()}
                    >
                        Valores Por Defeito
                    </Button>
                    <Button
                        disabled={!valid || !this.state.uncommittedChanges}
                        color="success"
                        variant="contained"
                        className="menuFunctionButton"
                        startIcon={<SaveIcon />}
                        onClick={() => this.saveConfig()}
                    >
                        Guardar
                    </Button>
                    <Button
                        disabled={!valid || !this.state.uncommittedChanges}
                        variant="contained"
                        color="success"
                        className="menuFunctionButton noMarginRight"
                        startIcon={<CheckRoundedIcon />}
                        onClick={() => this.saveConfig(true)}
                    >
                        Terminar
                    </Button>
                </Box>
            </Box>

            {
            this.state.loaded && !this.state.fetchingPreset
            ? <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                height: 'auto',
                width: 'auto',
                margin: 'auto',
                /*overflow: 'scroll'*/
            }}>
                {
                //<AlgoDropdown ref={this.algoDropdown} menu={this}/>
                }
                {/*
                <ChecklistDropdown className="simpleDropdown ocrDropdown"
                                   ref={this.langs}
                                   label={"Língua"}
                                   helperText={"Para melhores resultados, selecione por ordem de relevância"}
                                   options={tesseractLangList}
                                   defaultChoice={[tesseractLangList[defaultLangIndex]]}/>
                */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <CheckboxList title={"Língua"}
                                  options={tesseractLangList}
                                  checked={this.state.lang}
                                  onChangeCallback={this.setLangList}
                                  required
                                  showOrder
                                  helperText="Para melhores resultados, selecione por ordem de relevância"
                                  errorText="Deve selecionar pelo menos uma língua"/>
                </Box>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '30%',
                }}>
                    <TextField ref={this.dpiField}
                               label="DPI (Dots Per Inch)"
                               slotProps={{htmlInput: { inputMode: "numeric", pattern: "[1-9][0-9]*" }}}
                               error={isNaN(this.state.dpiVal)
                                   || (this.state.dpiVal !== null
                                   && this.state.dpiVal !== "" && !(/^[1-9][0-9]*$/.test(this.state.dpiVal)))}
                               value={this.state.dpiVal}
                               onChange={(e) => this.changeDpi(e.target.value)}
                               variant='outlined'
                               size="small"
                               className="simpleInput"
                               sx={{
                                   "& input:focus:invalid + fieldset": {borderColor: "red", borderWidth: 2}
                                }}
                    />

                    <FormControl className="simpleDropdown borderTop">
                        <FormLabel id="label-ocr-engine-select">Motor de OCR</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-ocr-engine-select"
                            value={this.state.engine}
                            onChange={(e) => this.changeEngine(e.target.value)}>
                            {
                                this.state.engineOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <FormControl className="simpleDropdown borderTop">
                        <FormLabel id="label-engine-type-select">Modo do motor</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-engine-type-select"
                            value={this.state.engineMode}
                            onChange={(e) => this.changeEngineMode(e.target.value)}>
                            {
                                this.state.engineModeOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <FormControl className="simpleDropdown borderTop">
                        <FormLabel id="label-segmentation-select">Segmentação</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-segmentation-select"
                            value={this.state.segmentMode}
                            onChange={(e) => this.changeSegmentationMode(e.target.value)}>
                            {
                                this.state.segmentModeOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <FormControl className="simpleDropdown borderTop">
                        <FormLabel id="label-thresholding-select">Thresholding</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-thresholding-select"
                            value={this.state.thresholdMethod}
                            onChange={(e) => this.changeThresholdingMethod(e.target.value)}>
                            {
                                this.state.thresholdMethodOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <TextField ref={this.moreParams}
                               label="Parâmetros adicionais"
                               value={this.state.otherParams}
                               onChange={(e) => this.changeAdditionalParams(e.target.value)}
                               variant='outlined'
                               className="simpleInput borderTop"
                               size="small"
                               slotProps={{inputLabel: {sx: {top: "0.5rem"}}}}
                    />
                </Box>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <CheckboxList title={"Formatos de resultado"}
                                  options={tesseractOutputsList}
                                  checked={this.state.outputs}
                                  onChangeCallback={this.setOutputList}
                                  required
                                  errorText="Deve selecionar pelo menos um formato de resultado"/>
                </Box>

                {/*
                <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                    <Button variant="contained" onClick={() => this.performOCR()}>
                        Começar
                    </Button>
                </Box>
                */}
            </Box>

            :<Box sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center"
            }}>
                <CircularProgress color="success" />
            </Box>
            }
        </>
        );
    }
}

OcrMenu.defaultProps = {
    _private: false,
    spaceId: "",
    current_folder: null,
    filename: null,
    isFolder: false,
    isSinglePage: false,
    customConfig: null,
    // functions:
    setCurrentCustomConfig: null,
    closeOCRMenu: null,
    showStorageForm: null,
}

export default OcrMenu;
