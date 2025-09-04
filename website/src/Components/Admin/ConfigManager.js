import React, {useEffect, useRef, useState} from 'react';
import axios from "axios";
import { useNavigate } from "react-router";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import Autocomplete from "@mui/material/Autocomplete";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import EditIcon from "@mui/icons-material/Edit";

import {
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
import ConfirmActionPopup from 'Components/Form/ConfirmActionPopup';
import CheckboxList from 'Components/Form/CheckboxList';
import Footer from 'Components/Footer/Footer';

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;
const ADMIN_HOME = (process.env.REACT_APP_BASENAME !== null && process.env.REACT_APP_BASENAME !== "")
                            ? `/${process.env.REACT_APP_BASENAME}/admin`
                            : '/admin';

const UPDATE_TIME = 60;  // period of fetching default config, in seconds

// use to avoid triggering too many useEffect on re-renders if a dependency must have an object or array as default state
const _emptylist = [];
const _emptydict = {};

const ConfigManager = (props) => {
    const navigate = useNavigate();

    const [defaultConfig, setDefaultConfig] = useState(_emptydict);
    const [existingConfigNames, setExistingConfigNames] = useState(_emptylist);

    const [isEditingExistingConfig, setIsEditingExistingConfig] = useState(false);
    const [configName, setConfigName] = useState(null);
    const [uncommittedChanges, setUncommittedChanges] = useState(false);

    const [lang, setLang] = useState(_emptylist);
    const [outputs, setOutputs] = useState(_emptylist);
    const [dpiVal, setDpiVal] = useState(null);
    const [engine, setEngine] = useState("");
    const [engineMode, setEngineMode] = useState(-1);
    const [segmentMode, setSegmentMode] = useState(-1);
    const [thresholdMethod, setThresholdMethod] = useState(-1);
    const [otherParams, setOtherParams] = useState(null);

    // Lists can be dynamically changed if switching to engines with different options
    const [engineOptions, setEngineOptions] = useState(engineList);
    const [langOptions, setLangOptions] = useState(tesseractLangList);
    const [outputOptions, setOutputOptions] = useState(tesseractOutputsList);
    const [engineModeOptions, setEngineModeOptions] = useState(tesseractModeList);
    const [segmentModeOptions, setSegmentModeOptions] = useState(tesseractSegmentList);
    const [thresholdMethodOptions, setThresholdMethodOptions] = useState(tesseractThreshList);

    const [confirmPopupOpened, setConfirmPopupOpened] = useState(false);
    const [confirmPopupMessage, setConfirmPopupMessage] = useState("");
    // const [confirmPopupSubmitCallback, setConfirmPopupSubmitCallback] = useState(null);

    const successNotifRef = useRef(null);
    const errorNotifRef = useRef(null);
    const confirmLeaveRef = useRef(null);

    function fetchDefaultConfig() {
        axios.get(API_URL + '/default-config')
            .then(({ data }) => {
                setDefaultConfig(data);
            });
    }

    function fetchConfigPreset(name) {
       axios.get(API_URL + '/config-preset', {
           params: {
               name: name,
           }
       })
           .then(({ data }) => {
               setConfigName(name);
               setLang(data.hasOwnProperty("lang") ? [...data.lang] : _emptylist);
               setEngine(data.hasOwnProperty("engine") ? data.engine : "");
               setEngineMode(data.hasOwnProperty("engineMode") ? Number(data.engineMode) : -1);
               setSegmentMode(data.hasOwnProperty("segmentMode") ? Number(data.segmentMode) : -1);
               setThresholdMethod(data.hasOwnProperty("thresholdMethod") ? Number(data.thresholdMethod) : -1);
               setOutputs(data.hasOwnProperty("outputs") ? [...data.outputs] : _emptylist);
               setDpiVal(data.hasOwnProperty("dpiVal") ? data.dpiVal : null);
               setOtherParams(data.hasOwnProperty("otherParams") ? data.otherParams : null);
           });
    }

    function fetchExistingPresetNames() {
        axios.get(API_URL + '/presets-list')
            .then(({ data }) => {
                data.unshift("default");  // add "default" as first config in list
                setExistingConfigNames(data);
            });
    }

    // Fetch default configuration on open and in intervals
    useEffect(() => {
        fetchDefaultConfig();
        fetchExistingPresetNames();
        const getDefaultConfigInterval = setInterval(fetchDefaultConfig, 1000 * UPDATE_TIME);
        const getExistingConfigNamesInterval = setInterval(fetchExistingPresetNames, 1000 * UPDATE_TIME);
        return () => {
            clearInterval(getDefaultConfigInterval);
            clearInterval(getExistingConfigNamesInterval);
        }
    }, []);

    // Add and remove preventExit event listener
    useEffect(() => {
        const preventExit = (event) => {
            event.preventDefault();
            event.returnValue = '';
        }

        if (uncommittedChanges) {
            window.addEventListener('beforeunload', preventExit);
        } else {
            window.removeEventListener('beforeunload', preventExit);
        }

        return () => {
            window.removeEventListener('beforeunload', preventExit);
        }
    }, [uncommittedChanges])

    function goBack() {
        if (uncommittedChanges) {
            confirmLeaveRef.current.toggleOpen();
        } else {
            navigate('/admin');
        }
    }

    function leave() {
        confirmLeaveRef.current.toggleOpen();
        navigate('/admin');
    }

    function toggleEditingExistingConfig() {
        if (isEditingExistingConfig) {  // toggling off, clear config name
            setConfigName(null);
        } else {  // toggling on, clear all options
            setConfigName(null);
            setLang(_emptylist);
            setEngine("");
            setEngineMode(-1);
            setSegmentMode(-1);
            setThresholdMethod(-1);
            setOutputs(_emptylist);
            setDpiVal(null);
            setOtherParams(null);
            setUncommittedChanges(false);
        }
        setIsEditingExistingConfig(!isEditingExistingConfig);
    }

    function changeConfigName(value, fillExisting = false) {
        if (value !== null) {
            value = value.trimStart();
        }
        if (fillExisting) {
            showExistingConfig(value);
        } else {
            setConfigName(value);
            setUncommittedChanges(true);
        }
    }

    /**
     * Fill all fields with the values of the configuration with the given name
     */
    function showExistingConfig(name) {
        if (name === "default") {
            setConfigName(name);
            setLang([...defaultConfig.lang]);
            setEngine(defaultConfig.engine);
            setEngineMode(Number(defaultConfig.engineMode));
            setSegmentMode(Number(defaultConfig.segmentMode));
            setThresholdMethod(Number(defaultConfig.thresholdMethod));
            setOutputs([...defaultConfig.outputs]);
            setDpiVal(defaultConfig.dpiVal ?? null);
            setOtherParams(defaultConfig.otherParams ?? null);
        } else {
            fetchConfigPreset(name);
        }
        setUncommittedChanges(false);
    }

    /**
     * Remove values from all parameter fields
     */
    function resetParameters() {
        setLang(_emptylist);
        setEngine("");
        setEngineMode(-1);
        setSegmentMode(-1);
        setThresholdMethod(-1);
        setOutputs(_emptylist);
        setDpiVal(null);
        setOtherParams(null);
    }

    /**
     * Fill empty fields with default values
     */
    function autoFillWithDefault() {
        setLang(lang.length === 0 ? [...defaultConfig.lang] : lang);
        setEngine(engine === "" ? defaultConfig.engine : engine);
        setEngineMode(engineMode === -1 ? Number(defaultConfig.engineMode) : engineMode);
        setSegmentMode(segmentMode === -1 ? Number(defaultConfig.segmentMode) : segmentMode);
        setThresholdMethod(thresholdMethod === -1 ? Number(defaultConfig.thresholdMethod) : thresholdMethod);
        setOutputs(outputs.length === 0 ? [...defaultConfig.outputs] : outputs);
        setDpiVal(dpiVal === null ? (defaultConfig.dpiVal ?? null) : dpiVal);
        setOtherParams(otherParams === null ? (defaultConfig.otherParams ?? null) : otherParams);
        setUncommittedChanges(true);
    }

    function setLangList(checked) {
        setLang(checked);
        setUncommittedChanges(true);
    }

    function setOutputList(checked) {
        setOutputs(checked);
        setUncommittedChanges(true);
    }

    function changeDpi(value) {
        value = value.trim();
        if (!(/^[1-9][0-9]*$/.test(value))) {
            errorNotifRef.current.openNotif("O valor de DPI deve ser um número inteiro!");
        }
        setDpiVal(value);
        setUncommittedChanges(true);
    }

    function changeEngine(value) {
        if (value === undefined) return;
        if (value === engine) {
            setEngine("");  // second click on engine, unset choice
        } else {
            setEngine(value);  // click on engine, set choice
        }
        setUncommittedChanges(true);
    }

    function changeEngineMode(value) {
        if (value === undefined) return;
        if (Number(value) === engineMode) {
            setEngineMode(-1);  // second click on engine mode, unset choice
        } else {
            setEngineMode(Number(value));  // click on engine mode, set choice
        }
        setUncommittedChanges(true);
    }

    function changeSegmentationMode(value) {
        if (value === undefined) return;
        if (Number(value) === segmentMode) {
            setSegmentMode(-1);  // second click on segment mode, unset choice
        } else {
            setSegmentMode(Number(value));  // click on segment mode, set choice
        }
        setUncommittedChanges(true);
    }

    function changeThresholdingMethod(value) {
        if (value === undefined) return;
        if (Number(value) === thresholdMethod) {
            setThresholdMethod(-1);  // second click on threshold mode, unset choice
        } else {
            setThresholdMethod(Number(value));  // click on threshold mode, set choice
        }
        setUncommittedChanges(true);
    }

    function changeAdditionalParams(value) {
        setOtherParams(value);
        setUncommittedChanges(true);
    }

    function getConfig() {
        const config = {};
        if (engine !== "") {
            config.engine = engine;
        }
        if (lang != _emptylist) {
            config.lang = lang;
        }
        if (outputs != _emptylist) {
            config.outputs = outputs;
        }
        if (engineMode !== -1) {
            config.engineMode = engineMode;
        }
        if (segmentMode !== -1) {
            config.segmentMode = segmentMode;
        }
        if (thresholdMethod !== -1) {
            config.thresholdMethod = thresholdMethod;
        }
        if (dpiVal !== null && dpiVal !== "") {
            config.dpi = dpiVal;
        }
        if (otherParams !== null && otherParams !== "") {
            config.otherParams = otherParams;
        }
        return config;
    }

    const saveConfig = () => {
        const config = getConfig();
        axios.put(API_URL + `/admin/save-config`,
            {
                config_name: configName,
                config: config,
                edit: isEditingExistingConfig,
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error("Não foi possível concluir o pedido.");
                }
                if (response.data["success"]) {
                    successNotifRef.current.openNotif(response.data["message"]);
                    if (configName === "default") {
                        setDefaultConfig(config);
                    }
                } else {
                    throw new Error(response.data["message"])
                }
                closeConfirmationPopup();
            })
            .catch(err => {
                errorNotifRef.current.openNotif(err.message);
                closeConfirmationPopup();
            });
    }

    function openSaveConfigPopup(e) {
        e.stopPropagation();
        setConfirmPopupOpened(true);
        setConfirmPopupMessage(`Guardar a configuração "${configName}"`);
    }

    function closeConfirmationPopup() {
        setConfirmPopupOpened(false);
        setConfirmPopupMessage("");
    }

    const validConfigName = configName !== null && configName !== "";
    const validLang = lang.length === 0 || lang.every(chosenValue => langOptions.some(option => option.value === chosenValue));
    const validOutputs = outputs.length === 0 || outputs.every(chosenValue => outputOptions.some(option => option.value === chosenValue));
    const validEngine = engine === "" || engineOptions.some(option => option.value === engine);
    const validEngineMode = engineMode === -1 || engineModeOptions.some(option => option.value === engineMode);
    const validSegmentMode = segmentMode === -1 || segmentModeOptions.some(option => option.value === segmentMode);
    const validThresholdMethod = thresholdMethod === -1 || thresholdMethodOptions.some(option => option.value === thresholdMethod)
    const validDpiVal = !(
        isNaN(dpiVal)
        || (dpiVal !== null && dpiVal !== "" && !(/^[1-9][0-9]*$/.test(dpiVal)))
    );  // valid dpiVal is either null or fits the regex

    const atLeastOneParam = (
        lang.length !== 0
        || outputs.length !== 0
        || engine !== ""
        || engineMode !== -1
        || segmentMode !== -1
        || thresholdMethod !== -1
        || (otherParams !== null && otherParams !== "")
        || (!isNaN(dpiVal) && dpiVal !== null && dpiVal !== "" && /^[1-9][0-9]*$/.test(dpiVal))
    );
    const validConfig = (
        atLeastOneParam
        && validLang
        && validOutputs
        && validEngine
        && validEngineMode
        && validSegmentMode
        && validThresholdMethod
        && validDpiVal
    );
    return (
        <Box className="App" sx={{height: '100vh'}}>
            <Notification message={""} severity={"success"} ref={successNotifRef}/>
            <Notification message={""} severity={"error"} ref={errorNotifRef}/>
            <ConfirmLeave leaveFunc={() => leave()} ref={confirmLeaveRef} />

            <ConfirmActionPopup
                open={confirmPopupOpened}
                message={confirmPopupMessage}
                confirmButtonColor="info"
                submitCallback={saveConfig}
                cancelCallback={closeConfirmationPopup}
            />

            {/* <VersionsMenu ref={versionsMenu}/> */}
            {/* <LogsMenu ref={logsMenu}/> */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: "center",
                zIndex: '5',
                padding: '0.5rem',
                paddingRight: '2rem',
                paddingTop: '1rem',
            }}>
                <Typography variant="h4" component="h2" sx={{marginLeft: "auto"}}>
                    Gerir Configurações de OCR
                </Typography>

                <Button
                    variant="contained"
                    onClick={() => {
                        axios.post(API_URL + "/account/logout")
                            .then(() => window.location.href = ADMIN_HOME);
                    }}
                    className="menuButton"
                    sx={{marginLeft: "auto"}}
                >
                    <span>Sair</span>
                </Button>
            </Box>

            <Box className="toolbar">
                <Box sx={{display: "flex", flexDirection: "row"}}>
                    <ReturnButton
                        disabled={false}
                        returnFunction={() => goBack()}
                    />

                    {isEditingExistingConfig
                        ?  <span style={{marginLeft: "1rem", fontSize: "1.5rem", display: "flex", flexDirection: "row"}}>
                            A alterar configuração
                            &nbsp;
                            <Autocomplete
                                error={!validConfigName}
                                value={configName}
                                options={existingConfigNames}
                                getOptionLabel={(option) => option}
                                autoSelect
                                onChange={(e, newValue) => changeConfigName(newValue, true)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        required
                                        error={!validConfigName}
                                        placeholder="nome"
                                        variant="outlined"
                                        size="small"
                                        sx={{
                                            height: "2rem",
                                            width: "14rem",
                                            "& input:focus:invalid + fieldset": {borderColor: "red", borderWidth: 2}
                                        }}
                                    />
                                )}
                                slotProps={{
                                    paper: {  // dropdown popup props
                                        sx: {
                                            width: 'auto',
                                            maxHeight: '70%',
                                        }
                                    }
                                }}
                            />
                        </span>
                        : <span style={{marginLeft: "1rem", fontSize: "1.5rem"}}>
                            A criar nova configuração:
                            &nbsp;
                            <TextField
                                required
                                placeholder="nome"
                                error={!validConfigName}
                                value={configName}
                                onChange={(e) => changeConfigName(e.target.value)}
                                variant='outlined'
                                size="small"
                                sx={{
                                    height: "2rem",
                                    width: "14rem",
                                    "& input:focus:invalid + fieldset": {borderColor: "red", borderWidth: 2}
                                }}
                            />
                        </span>
                    }
                </Box>

                <Box>
                    <Button
                        variant="contained"
                        className="menuFunctionButton"
                        color={isEditingExistingConfig ? "error" : "primary"}
                        startIcon={<EditIcon />}
                        onClick={() => toggleEditingExistingConfig()}
                    >
                        {isEditingExistingConfig
                            ? "Terminar"
                            : "Alterar Configuração Existente"
                        }
                    </Button>

                    <Button
                        disabled={!atLeastOneParam}
                        variant="contained"
                        className="menuFunctionButton"
                        onClick={() => resetParameters()}
                    >
                        Limpar Tudo
                    </Button>

                    <Button
                        disabled={!validConfig || !validConfigName || !uncommittedChanges}
                        color="success"
                        variant="contained"
                        className="menuFunctionButton noMarginRight"
                        startIcon={<CheckRoundedIcon />}
                        onClick={(e) => openSaveConfigPopup(e)}
                    >
                        Confirmar
                    </Button>
                </Box>
            </Box>


            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                height: 'auto',
                width: 'auto',
                margin: 'auto',
                /*overflow: 'scroll'*/
            }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <CheckboxList title={"Língua"}
                                  options={langOptions}
                                  checked={lang}
                                  onChangeCallback={(checked) => setLangList(checked)}
                                  showOrder
                                  helperText="Para melhores resultados, selecione por ordem de relevância"
                    />
                </Box>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '30%',
                }}>
                    <TextField
                        label="DPI (Dots Per Inch)"
                        slotProps={{htmlInput: { inputMode: "numeric", pattern: "[1-9][0-9]*" }}}
                        error={!validDpiVal}
                        value={dpiVal}
                        onChange={(e) => changeDpi(e.target.value)}
                        variant='outlined'
                        size="small"
                        className="simpleInput"
                        sx={{
                            "& input:focus:invalid + fieldset": {borderColor: "red", borderWidth: 2}
                        }}
                    />

                    <FormControl
                        error={!validEngine}
                        className="simpleDropdown borderTop"
                    >
                        <FormLabel id="label-ocr-engine-select">Motor de OCR</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-ocr-engine-select"
                            value={engine}
                            onClick={(e) => changeEngine(e.target.value)}
                        >
                            {
                                engineOptions.map((option) =>
                                    <FormControlLabel
                                        value={option.value}
                                        control={<Radio disableRipple />}
                                        label={option.description}
                                    />
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <FormControl
                        error={!validEngineMode}
                        className="simpleDropdown borderTop"
                    >
                        <FormLabel id="label-engine-type-select">Modo do motor</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-engine-type-select"
                            value={engineMode}
                            onClick={(e) => changeEngineMode(e.target.value)}>
                            {
                                engineModeOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <FormControl
                        error={!validSegmentMode}
                        className="simpleDropdown borderTop"
                    >
                        <FormLabel id="label-segmentation-select">Segmentação</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-segmentation-select"
                            value={segmentMode}
                            onClick={(e) => changeSegmentationMode(e.target.value)}>
                            {
                                segmentModeOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <FormControl
                        error={!validThresholdMethod}
                        className="simpleDropdown borderTop"
                    >
                        <FormLabel id="label-thresholding-select">Thresholding</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-thresholding-select"
                            value={thresholdMethod}
                            onClick={(e) => changeThresholdingMethod(e.target.value)}>
                            {
                                thresholdMethodOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <TextField
                        label="Parâmetros adicionais"
                        value={otherParams}
                        onChange={(e) => changeAdditionalParams(e.target.value)}
                        variant='outlined'
                        className="simpleInput borderTop"
                        size="small"
                        slotProps={{
                            inputLabel: {sx: {top: "0.5rem"}}
                        }}
                    />
                </Box>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <CheckboxList title={"Formatos de resultado"}
                                  options={outputOptions}
                                  checked={outputs}
                                  onChangeCallback={(checked) => setOutputList(checked)}
                    />
                </Box>
            </Box>

            <Footer />
        </Box>
    );
}

export default ConfigManager;
