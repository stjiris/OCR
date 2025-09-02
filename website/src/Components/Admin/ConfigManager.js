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
import ConfirmLeave from 'Components/Notifications/Geral/ConfirmLeave';
import Notification from 'Components/Notifications/Geral/Notification';
import ConfirmActionPopup from 'Components/Form/Geral/ConfirmActionPopup';
import CheckboxList from 'Components/Form/Geral/CheckboxList';
import Footer from 'Components/Footer/Geral/Footer';

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
               setLang([...data.lang]);
               setEngine(data.engine);
               setEngineMode(Number(data.engineMode));
               setSegmentMode(Number(data.segmentMode));
               setThresholdMethod(Number(data.thresholdMethod));
               setOutputs([...data.outputs]);
               setDpiVal(data.dpiVal ?? null);
               setOtherParams(data.otherParams ?? null);
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
        setEngine(value);
        setUncommittedChanges(true);
    }

    function changeEngineMode(value) {
        setEngineMode(Number(value));
        setUncommittedChanges(true);
    }

    function changeSegmentationMode(value) {
        setSegmentMode(Number(value));
        setUncommittedChanges(true);
    }

    function changeThresholdingMethod(value) {
        setThresholdMethod(Number(value));
        setUncommittedChanges(true);
    }

    function changeAdditionalParams(value) {
        setOtherParams(value);
        setUncommittedChanges(true);
    }

    function getConfig() {
        const config = {
            engine: engine,
            lang: lang,
            outputs: outputs,
            engineMode: engineMode,
            segmentMode: segmentMode,
            thresholdMethod: thresholdMethod,
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
        let endpoint = "save-config";
        if (isEditingExistingConfig) {
            endpoint = "edit-config";
        }
        axios.put(API_URL + `/admin/${endpoint}`,
            {
                config_name: configName,
                config: config,
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
    const validLang = lang.length !== 0 && lang.every(chosenValue => langOptions.some(option => option.value === chosenValue));
    const validOutputs = outputs.length !== 0 && outputs.every(chosenValue => outputOptions.some(option => option.value === chosenValue));
    const validEngine = engineOptions.some(option => option.value === engine);
    const validEngineMode = engineModeOptions.some(option => option.value === engineMode);
    const validSegmentMode = segmentModeOptions.some(option => option.value === segmentMode);
    const validThresholdMethod = thresholdMethodOptions.some(option => option.value === thresholdMethod)
    const validDpiVal = !(
        isNaN(dpiVal)
        || (dpiVal !== null && dpiVal !== "" && !(/^[1-9][0-9]*$/.test(dpiVal)))
    );
    const validFields = (
        validLang
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
                        disabled={validFields}
                        variant="contained"
                        className="menuFunctionButton"
                        onClick={() => autoFillWithDefault()}
                    >
                        Preencher campos restantes
                    </Button>

                    <Button
                        disabled={!validFields || !validConfigName || !uncommittedChanges}
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
                        required
                        error={!validEngine}
                        className="simpleDropdown borderTop"
                    >
                        <FormLabel id="label-ocr-engine-select">Motor de OCR</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-ocr-engine-select"
                            value={engine}
                            onChange={(e) => changeEngine(e.target.value)}>
                            {
                                engineOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <FormControl
                        required
                        error={!validEngineMode}
                        className="simpleDropdown borderTop"
                    >
                        <FormLabel id="label-engine-type-select">Modo do motor</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-engine-type-select"
                            value={engineMode}
                            onChange={(e) => changeEngineMode(e.target.value)}>
                            {
                                engineModeOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <FormControl
                        required
                        error={!validSegmentMode}
                        className="simpleDropdown borderTop"
                    >
                        <FormLabel id="label-segmentation-select">Segmentação</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-segmentation-select"
                            value={segmentMode}
                            onChange={(e) => changeSegmentationMode(e.target.value)}>
                            {
                                segmentModeOptions.map((option) =>
                                    <FormControlLabel value={option.value} control={<Radio disableRipple />} label={option.description}/>
                                )
                            }
                        </RadioGroup>
                    </FormControl>

                    <FormControl
                        required
                        error={!validThresholdMethod}
                        className="simpleDropdown borderTop"
                    >
                        <FormLabel id="label-thresholding-select">Thresholding</FormLabel>
                        <RadioGroup
                            aria-labelledby="label-thresholding-select"
                            value={thresholdMethod}
                            onChange={(e) => changeThresholdingMethod(e.target.value)}>
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
                                  required
                                  errorText="Deve selecionar pelo menos um formato de resultado"/>
                </Box>
            </Box>

            <Footer />
        </Box>
    );
}

export default ConfigManager;
