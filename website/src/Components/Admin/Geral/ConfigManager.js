import React, {useEffect, useRef, useState} from 'react';
import axios from "axios";
import { useNavigate } from "react-router";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import TextField from "@mui/material/TextField";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import RotateLeft from "@mui/icons-material/RotateLeft";

import {
    engineList,
    tesseractLangList,
    tesseractModeList,
    tesseractOutputsList,
    tesseractSegmentList,
    tesseractThreshList,
} from "../../../defaultOcrConfigs";

import loadComponent from "../../../utils/loadComponents";
const ReturnButton = loadComponent('FileSystem', 'ReturnButton');
const ConfirmLeave = loadComponent('Notifications', 'ConfirmLeave');
const Notification = loadComponent('Notifications', 'Notification');
const ConfirmActionPopup = loadComponent('Form', 'ConfirmActionPopup');
const CheckboxList = loadComponent('Form', 'CheckboxList');
const Footer = loadComponent('Footer', 'Footer');

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

    const [isConfiguringPreset, setIsConfiguringPreset] = useState(false);
    const [isEditingConfig, setIsEditingConfig] = useState(false);
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
    const [confirmPopupSubmitCallback, setConfirmPopupSubmitCallback] = useState(null);

    const successNotifRef = useRef(null);
    const errorNotifRef = useRef(null);
    const confirmLeaveRef = useRef(null);

    function getDefaultConfig() {
        axios.get(API_URL + '/get-default-config')
            .then(({ data }) => {
                console.log(data)
                setDefaultConfig(data);
            });
    }

    // Fetch default configuration on open and in intervals
    useEffect(() => {
        getDefaultConfig();
        const interval = setInterval(getDefaultConfig, 1000 * UPDATE_TIME);
        return () => {
            clearInterval(interval);
        }
    }, []);

    // Set options from default when altering default config
    useEffect(() => {
        if (isConfiguringPreset) {
            setLang(defaultConfig.lang);
            setEngine(defaultConfig.engine);
            setEngineMode(defaultConfig.engineMode);
            setSegmentMode(defaultConfig.segmentMode);
            setThresholdMethod(defaultConfig.thresholdMethod);
            setOutputs(defaultConfig.outputs);
            setDpiVal(defaultConfig.dpiVal ?? null);
            setOtherParams(defaultConfig.otherParams ?? null);
        }
    }, [isConfiguringPreset])

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

    function temp() {
        successNotifRef.current.openNotif("Testing - a configuração seria guardada");
    }

    function closeConfirmationPopup() {
        setConfirmPopupOpened(false);
        setConfirmPopupMessage("");
        setConfirmPopupSubmitCallback(null);
    }

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

    function setLangList(checked) {
        setLang(checked);
        setUncommittedChanges(true);
    }

    function setOutputList(checked) {
        setOutputs(checked);
        setUncommittedChanges(true);
    }

    function changeDpi(value) {
        value = value.trim()
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

    const validLang = lang.every(chosenValue => langOptions.some(option => option.value === chosenValue));
    const validOutputs = outputs.every(chosenValue => outputOptions.some(option => option.value === chosenValue));
    const validEngine = engineOptions.some(option => option.value === engine);
    const validEngineMode = engineModeOptions.some(option => option.value === engineMode);
    const validSegmentMode = segmentModeOptions.some(option => option.value === segmentMode);
    const validThresholdMethod = thresholdMethodOptions.some(option => option.value === thresholdMethod)
    const validDpiVal = !(
        isNaN(dpiVal)
        || (dpiVal !== null && dpiVal !== "" && !(/^[1-9][0-9]*$/.test(dpiVal)))
    );
    console.log(`L  ${lang} ${validLang}`)
    console.log(`O  ${outputs} ${validOutputs}`)
    console.log(`E  ${engine} ${validEngine}`)
    console.log(`EM ${engineMode} ${validEngineMode}`)
    console.log(`S  ${segmentMode} ${validSegmentMode}`)
    console.log(`T  ${thresholdMethod} ${validThresholdMethod}`)
    console.log(`T  ${dpiVal} ${validDpiVal}`)
    const valid = (validLang && validOutputs && validEngine && validEngineMode && validSegmentMode && validThresholdMethod && validDpiVal);
    return (
        <Box className="App" sx={{height: '100vh'}}>
            <Notification message={""} severity={"success"} ref={successNotifRef}/>
            <Notification message={""} severity={"error"} ref={errorNotifRef}/>
            <ConfirmLeave leaveFunc={() => leave()} ref={confirmLeaveRef} />

            <ConfirmActionPopup
                open={confirmPopupOpened}
                message={confirmPopupMessage}
                confirmButtonColor="error"
                submitCallback={confirmPopupSubmitCallback}
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
                <Box>
                    <ReturnButton
                        disabled={false}
                        returnFunction={() => goBack()}
                    />

                    <span style={{marginLeft: "1rem", fontSize: "1.5rem"}}>
                        {isConfiguringPreset
                            ? "A alterar configuração predefinida"
                            : isEditingConfig
                                ? `A alterar configuração <b>${configName}<b />>`
                                : "A criar nova configuração"
                        }
                    </span>
                </Box>

                <Box>
                    <Button
                        variant="contained"
                        className="menuFunctionButton"
                        color={isConfiguringPreset ? "error" : "primary"}
                        startIcon={<RotateLeft />}
                        onClick={() => setIsConfiguringPreset(!isConfiguringPreset)}
                    >
                        {isConfiguringPreset
                            ? "Cancelar"
                            : "Alterar Configuração Predefinida"
                        }
                    </Button>

                    <Button
                        disabled={!valid}
                        color="success"
                        variant="contained"
                        className="menuFunctionButton noMarginRight"
                        startIcon={<CheckRoundedIcon />}
                        onClick={(e) => temp(e)}
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
