import React, {useCallback, useEffect, useRef, useState} from 'react';
import axios from "axios";
import { useNavigate } from "react-router";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import RotateLeft from "@mui/icons-material/RotateLeft";
import Typography from "@mui/material/Typography";

import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

import { TimePicker } from "@mui/x-date-pickers/TimePicker";

import ReturnButton from 'Components/FileSystem/Geral/ReturnButton';
import Notification from 'Components/Notifications/Geral/Notification';
import ConfirmActionPopup from 'Components/Form/Geral/ConfirmActionPopup';
import CheckboxList from 'Components/Form/Geral/CheckboxList';
import TooltipIcon from 'Components/TooltipIcon/Geral/TooltipIcon';
import Footer from 'Components/Footer/Geral/Footer';

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;
const ADMIN_HOME = (process.env.REACT_APP_BASENAME !== null && process.env.REACT_APP_BASENAME !== "")
                            ? `/${process.env.REACT_APP_BASENAME}/admin`
                            : '/admin';

const numberHoursRegex = /^[1-9][0-9]*$/;
const dayRegex = /^([1-9]|0[1-9]|[1-2][0-9]|3[0-1])$/;

const weekDaysOptions = [
    { value: "mon", description: "Segunda-feira"},
    { value: "tue", description: "Terça-feira"},
    { value: "wed", description: "Quarta-feira"},
    { value: "thu", description: "Quinta-feira"},
    { value: "fri", description: "Sexta-feira"},
    { value: "sat", description: "Sábado"},
    { value: "sun", description: "Domingo"},
]

const sizeRegex = /(\d+) ([A-Za-z]+)/;
const sizeMap = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
}

const StorageManager = (props) => {
    const navigate = useNavigate();

    const [freeSpace, setFreeSpace] = useState("");
    const [freeSpacePercent, setFreeSpacePercent] = useState("");
    const [privateSpaces, setPrivateSpaces] = useState([]);
    const [apiFiles, setApiFiles] = useState([]);
    const [lastCleanup, setLastCleanup] = useState("nunca");
    const [maxPrivateSpaceAge, setMaxPrivateSpaceAge] = useState("5");

    const [refreshing, setRefreshing] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    const [scheduleType, setScheduleType] = useState("monthly");

    const [everyHours, setEveryHours] = useState('');

    const [monthTime, setMonthTime] = useState(null);
    const [monthDay, setMonthDay] = useState('');

    const [weekTime, setWeekTime] = useState(null);
    const [weekDays, setWeekDays] = useState([]);

    const [deleteSpaceId, setDeleteSpaceId] = useState(null);
    const [deleteApiDocumentId, setDeleteApiDocumentId] = useState(null);

    const [confirmPopupOpened, setConfirmPopupOpened] = useState(false);
    const [confirmPopupMessage, setConfirmPopupMessage] = useState("");
    const [confirmPopupSubmitCallback, setConfirmPopupSubmitCallback] = useState(null);

    const successNotif = useRef(null);
    const errorNotif = useRef(null);

    function parseSize(sizeStr) {
        const match = sizeStr.match(sizeRegex);
        if (!match) return 0;
        const value = parseInt(match[1], 10);
        const unit = match[2].toUpperCase();
        return value * (sizeMap[unit] || 1);
    }

    function getStorageInfo() {
        setRefreshing(true);
        axios.get(API_URL + '/admin/storage-info')
            .then(({ data }) => {
                const privateSpaces = Object.entries(data["private_spaces"]);
                const apiFiles = Object.entries(data["api_files"]);
                privateSpaces.sort((a, b) => parseSize(b[1].size) - parseSize(a[1].size));
                apiFiles.sort((a, b) => parseSize(b[1].size) - parseSize(a[1].size));

                setFreeSpace(data["free_space"]);
                setFreeSpacePercent(data["free_space_percentage"]);
                setPrivateSpaces(privateSpaces);
                setApiFiles(apiFiles);
                setLastCleanup(data["last_cleanup"]);
                setMaxPrivateSpaceAge(data["max_age"]);
                setLastUpdate(new Date());
                setRefreshing(false);
            });
    }

    useEffect(() => {
        getStorageInfo();
    }, []);

    const deleteApiDocument = useCallback(() => {
        axios.post(API_URL + "/delete-results",
            {
                "doc_id": deleteApiDocumentId
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error(response.data["message"] || "Não foi possível concluir o pedido.");
                }
                if (!response.data["success"]) {
                    throw new Error(response.data["message"]);
                }
                closeConfirmationPopup();
                getStorageInfo();
            })
            .catch(err => {
                errorNotif.current.openNotif(err.message);
                closeConfirmationPopup();
            });
    }, [deleteApiDocumentId]);

    const deletePrivateSpace = useCallback(() => {
        axios.post(API_URL + "/admin/delete-private-space",
            {
                "space_id": deleteSpaceId
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(response => {
                if (response.status !== 200) {
                    throw new Error(response.data["message"] || "Não foi possível concluir o pedido.");
                }
                if (!response.data["success"]) {
                    throw new Error(response.data["message"]);
                }
                closeConfirmationPopup();
                getStorageInfo();
            })
            .catch(err => {
                errorNotif.current.openNotif(err.message);
                closeConfirmationPopup();
            });
    }, [deleteSpaceId]);

    // setup confirmation popup after deleteSpaceId is set by openDeletePopup()
    useEffect(() => {
        if (deleteSpaceId !== null) {
            setConfirmPopupOpened(true);
            setConfirmPopupMessage(`Tem a certeza que quer apagar o espaço ${deleteSpaceId}?`);
            setConfirmPopupSubmitCallback(() => deletePrivateSpace);  // set value as function deletePrivateSpace
        } else if (deleteApiDocumentId !== null) {
            setConfirmPopupOpened(true);
            setConfirmPopupMessage(`Tem a certeza que quer apagar o documento com ID ${deleteApiDocumentId}?`);
            setConfirmPopupSubmitCallback(() => deleteApiDocument);  // set value as function deleteApiDocument
        }
    }, [deleteSpaceId, deleteApiDocumentId, deletePrivateSpace, deleteApiDocument])

    function handleScheduleTypeChange(newType) {
        switch (newType) {
            case "interval":
                setWeekTime(null); setWeekDays([]);  // disable weekly
                setMonthTime(null); setMonthDay('');  // disable monthly
                setScheduleType(newType);
                break;
            case "monthly":
                console.log("set monthly")
                setEveryHours('');  // disable interval
                setWeekTime(null); setWeekDays([]);  // disable weekly
                setScheduleType(newType);
                break;
            case "weekly":
                setEveryHours('');  // disable interval
                setMonthTime(null); setMonthDay('');  // disable monthly
                setScheduleType(newType);
                break;
        }
    }

    function handleEveryHoursChange(value) {
        value = value.trim();
        if (!(numberHoursRegex.test(value)) && value !== '') {
            errorNotif.current.openNotif("O número de horas deve ser um valor inteiro positivo!");
        }
        setEveryHours(value);
    }

    function handleMonthDayChange(value) {
        value = value.trim();
        if (!(dayRegex.test(value)) && value !== "0" && value !== '') {
            errorNotif.current.openNotif("O dia deve ser um número entre 1 e 31!");
        }
        setMonthDay(value);
    }

    function handleWeekDaysChange(choices) {
        setWeekDays(choices);
    }

    function openDeleteApiDocumentPopup(e, documentId) {
        e.stopPropagation();
        setDeleteApiDocumentId(documentId);
        // confirm popup is set up in useEffect
    }

    function openDeleteSpacePopup(e, privateSpace) {
        e.stopPropagation();
        setDeleteSpaceId(privateSpace);
        // confirm popup is set up in useEffect
    }

    function openCleanupPopup(e) {
        e.stopPropagation();
        setConfirmPopupOpened(true);
        setConfirmPopupMessage(`Tem a certeza que quer remover as sessões com mais de ${maxPrivateSpaceAge} dias?`);
        setConfirmPopupSubmitCallback(() => runPrivateSpaceCleanup);  // set value as function runPrivateSpaceCleanup
    }

    function closeConfirmationPopup() {
        setDeleteSpaceId(null);  // needed when closing or cancelling popup for deletion of single private space
        setDeleteApiDocumentId(null);
        setConfirmPopupOpened(false);
        setConfirmPopupMessage("");
        setConfirmPopupSubmitCallback(null);
    }

    const runPrivateSpaceCleanup = () => {
        axios.post(API_URL + "/admin/cleanup-private-spaces")
            .then(response => {
                if (response.status !== 200) {
                    throw new Error("Não foi possível concluir o pedido.");
                }
                if (response.data["success"]) {
                    successNotif.current.openNotif(response.data["message"]);
                } else {
                    throw new Error(response.data["message"]);
                }
                closeConfirmationPopup();
            })
            .catch(err => {
                errorNotif.current.openNotif(err.message);
                closeConfirmationPopup();
            });
    }

    function updateSchedule(e) {
        e.stopPropagation();
        let body;
        if (scheduleType === "interval") {
            body = {
                type: scheduleType,
                run_every: Number(everyHours),
            };
        } else if (scheduleType === "monthly") {
            body = {
                type: scheduleType,
                day_of_month: monthDay,
                hour: monthTime["$H"],
                minute: monthTime["$m"],
            };
        } else if (scheduleType === "weekly") {
            body = {
                type: scheduleType,
                day_of_week: weekDays.join(','),
                hour: weekTime["$H"],
                minute: weekTime["$m"],
            };
        }
        axios.post(API_URL + "/admin/schedule-cleanup",
            body,
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
                    successNotif.current.openNotif(response.data["message"]);
                } else {
                    throw new Error(response.data["message"])
                }
            })
            .catch(err => {
                errorNotif.current.openNotif(err.message);
            });
    }

    const valid = (scheduleType === "interval" && numberHoursRegex.test(everyHours))
                        || (scheduleType === "monthly" && monthTime !== null && dayRegex.test(monthDay))
                        || (scheduleType === "weekly" && weekTime !== null && weekDays.length !== 0);
    return (
        <Box className="App" sx={{height: '100vh'}}>
            <Notification message={""} severity={"success"} ref={successNotif}/>
            <Notification message={""} severity={"error"} ref={errorNotif}/>

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
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: "center",
                    flexGrow: '1',
                    flexBasis: '0',
                }}>
                    <Box>
                        <span>Armazenamento livre: {freeSpace} ({freeSpacePercent}%)</span>
                    </Box>

                    <Box sx={{marginLeft: '1rem'}}>
                        <span>Última limpeza: {lastCleanup}</span>
                    </Box>
                </Box>

                <Typography variant="h4" component="h2">
                    Gerir Armazenamento
                </Typography>

                <Box sx={{
                    display: 'flex',
                    justifyContent: 'right',
                    flexGrow: '1',
                    flexBasis: '0',
                }}>
                    <Button
                        variant="contained"
                        onClick={() => {
                            axios.post(API_URL + "/account/logout")
                                .then(() => window.location.href = ADMIN_HOME);
                        }}
                        className="menuButton"
                    >
                        <span>Sair</span>
                    </Button>
                </Box>
            </Box>

            <Box className="toolbar">
                <Box>
                    <ReturnButton
                        disabled={false}
                        returnFunction={() => navigate('/admin')}
                    />

                    <Button
                        disabled={refreshing}
                        variant="contained"
                        className="menuFunctionButton"
                        startIcon={<RotateLeft />}
                        onClick={() => getStorageInfo()}
                    >
                        Refresh
                    </Button>
                    <span>
                        Último update: {lastUpdate ? lastUpdate.toLocaleString("pt-PT") : "nunca"}
                    </span>
                </Box>
            </Box>

            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                height: 'auto',
                minHeight: '70vh',
                width: 'auto',
                margin: 'auto',
                /*overflow: 'scroll'*/
            }}>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '24%',
                    width: 'fit-content',
                }}>
                    <Box sx = {{
                        display: "flex",
                        flexDirection: "column",
                        zIndex: "1",
                        backgroundColor: "#fff",
                        border: "1px solid black",
                        borderRadius: '0.5rem',
                        position: 'relative',
                        top: "0.5rem",
                        p: "0.5rem 1rem",
                        width: "fit-content",
                        height: "fit-content",
                    }}>
                        <span>Documentos de API</span>
                        {
                            apiFiles.map(([apiFile, info], index) => {
                                return (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: "flex",
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            height: "2rem",
                                            lineHeight: "2rem",
                                            borderTop: index !== 0 ? "1px solid black" : "0px solid black",
                                        }}
                                    >
                                        <code>{apiFile}&nbsp;—&nbsp;</code>
                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                        }}>
                                            <span style={{alignContent: 'center'}}>
                                                {info["size"]}&nbsp;–&nbsp;{info["creation"]}
                                            </span>
                                            <TooltipIcon
                                                className="negActionButton"
                                                message="Apagar"
                                                clickFunction={(e) => openDeleteApiDocumentPopup(e, apiFile)}
                                                icon={<DeleteForeverIcon />}
                                            />
                                        </Box>
                                    </Box>
                                )
                            })
                        }
                    </Box>
                </Box>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: '24%',
                    width: 'fit-content',
                    alignItems: 'center',
                }}>
                    <Button
                        variant="contained"
                        onClick={(e) => openCleanupPopup(e)}
                        className="menuButton"
                        sx={{alignSelf: 'center'}}
                    >
                        Remover espaços privados com mais de {maxPrivateSpaceAge} dias
                    </Button>

                    <Box sx = {{
                            display: "flex",
                            flexDirection: "column",
                            zIndex: "1",
                            backgroundColor: "#fff",
                            border: "1px solid black",
                            borderRadius: '0.5rem',
                            position: 'relative',
                            top: "0.5rem",
                            p: "0.5rem 1rem",
                            width: "fit-content",
                            height: "fit-content",
                    }}>
                        <span>Espaços Privados</span>
                        {
                            privateSpaces.map(([privateSpace, info], index) => {
                                return (
                                    <Box
                                        key={index}
                                        sx={{
                                            display: "flex",
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            height: "2rem",
                                            lineHeight: "2rem",
                                            borderTop: index !== 0 ? "1px solid black" : "0px solid black",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => {
                                            navigate(`/space/${privateSpace}`);
                                        }}
                                    >
                                        <code>{privateSpace}&nbsp;—&nbsp;</code>
                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                        }}>
                                            <span style={{alignContent: 'center'}}>
                                                {info["size"]}&nbsp;–&nbsp;{info["creation"]}
                                            </span>
                                            <TooltipIcon
                                                className="negActionButton"
                                                message="Apagar"
                                                clickFunction={(e) => openDeleteSpacePopup(e, privateSpace)}
                                                icon={<DeleteForeverIcon />}
                                            />
                                        </Box>
                                    </Box>
                                )
                            })
                        }
                    </Box>
                </Box>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '45%',
                    paddingLeft: '10px',
                    borderLeft: '1px solid black',
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                    }}>
                        <Typography variant="h5" component="h2">
                            Definir horário de limpeza automática
                        </Typography>

                        <Button
                            disabled={!valid}
                            color="success"
                            variant="contained"
                            className="menuFunctionButton noMarginRight"
                            startIcon={<CheckRoundedIcon />}
                            onClick={(e) => updateSchedule(e)}
                        >
                            Confirmar
                        </Button>
                    </Box>

                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                    }}>

                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            <FormControlLabel
                                label="Por intervalo"
                                checked={scheduleType === "interval"}
                                control={<Radio size="small"/>}
                                onChange={() => handleScheduleTypeChange("interval")}
                            />

                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                                <span>A cada </span>
                                <TextField
                                    disabled={scheduleType !== "interval"}
                                    error={!(numberHoursRegex.test(everyHours))}
                                    value={everyHours}
                                    onChange={(e) => handleEveryHoursChange(e.target.value)}
                                    hiddenLabel
                                    size="small"
                                    variant="outlined"
                                    className="simpleInput"
                                    sx={{
                                        width: '4rem',
                                        marginLeft: '0.3rem',
                                        marginRight: '0.3rem',
                                        textAlign: "center",
                                    }}
                                />
                                <span> horas</span>
                            </Box>
                        </Box>


                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            <FormControlLabel
                                label="Mensalmente"
                                checked={scheduleType === "monthly"}
                                control={<Radio size="small"/>}
                                onChange={() => handleScheduleTypeChange("monthly")}
                            />

                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'row',
                            }}>
                                <TimePicker
                                    disabled={scheduleType !== "monthly"}
                                    required={scheduleType === "monthly"}
                                    label="Hora"
                                    views={['hours', 'minutes']}
                                    ampm={false}
                                    value={monthTime}
                                    onChange={(value, ctx) => setMonthTime(value)}
                                    className="simpleInput hourInput"
                                    slotProps={{ textField: { size: "small", error: scheduleType === "monthly" && monthTime === null } }}
                                />

                                <TextField
                                    disabled={scheduleType !== "monthly"}
                                    required={scheduleType === "monthly"}
                                    error={scheduleType === "monthly" && !(dayRegex.test(monthDay))}
                                    value={monthDay}
                                    onChange={(e) => handleMonthDayChange(e.target.value)}
                                    label="Dia"
                                    size="small"
                                    variant="outlined"
                                    className="simpleInput"
                                    sx={{
                                        width: '4rem',
                                        marginLeft: '0.3rem',
                                        marginRight: '0.3rem',
                                        textAlign: "center",
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            <FormControlLabel
                                label="Semanalmente"
                                checked={scheduleType === "weekly"}
                                control={<Radio size="small"/>}
                                onChange={() => handleScheduleTypeChange("weekly")}
                            />

                            <TimePicker
                                disabled={scheduleType !== "weekly"}
                                required={scheduleType === "weekly"}
                                label="Hora"
                                views={['hours', 'minutes']}
                                ampm={false}
                                value={weekTime}
                                onAccept={(value, ctx) => setWeekTime(value)}
                                className="simpleInput hourInput"
                                slotProps={{ textField: { size: "small", error: scheduleType === "weekly" && weekTime === null } }}
                            />
                            {/*
                        <FormControl>
                            <InputLabel>Dia da semana</InputLabel>
                            <Select
                                disabled={scheduleType !== "weekly"}
                                label="Dia da semana"
                                multiple
                                value={weekDays}
                                onChange={(e) => setWeekDays(e.target.value)}
                                input={<OutlinedInput label="Dia da semana" />}
                                variant="standard"
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((x) => (
                                            <Chip key={x.code} label={x.name} />
                                        ))}
                                    </Box>
                                )}>
                                {
                                    weekDaysOptions.map((day) => (
                                        <MenuItem key={day.code} value={day}>
                                            <ListItemText primary={day.name} />
                                        </MenuItem>
                                    ))
                                }
                            </Select>

                        </FormControl>


                        <FormControl>
                            <InputLabel>Dia da semana</InputLabel>
                            <Select
                                disabled={scheduleType !== "weekly"}
                                label="Dia da semana"
                                value={weekDays}
                                onChange={(e) => setWeekDays(e.target.value)}
                                input={<OutlinedInput label="Dia da semana" />}
                                variant="standard"
                            >
                                <MenuItem value={0}>Segunda-feira</MenuItem>
                                <MenuItem value={1}>Terça-feira</MenuItem>
                                <MenuItem value={2}>Quarta-feira</MenuItem>
                                <MenuItem value={3}>Quinta-feira</MenuItem>
                                <MenuItem value={4}>Sexta-feira</MenuItem>
                                <MenuItem value={5}>Sábado</MenuItem>
                                <MenuItem value={6}>Domingo</MenuItem>
                            </Select>
                        </FormControl>*/}

                            <CheckboxList
                                disabled={scheduleType !== "weekly"}
                                title="Dias da semana"
                                options={weekDaysOptions}
                                checked={weekDays}
                                required={scheduleType === "weekly"}
                                onChangeCallback={handleWeekDaysChange}
                                errorText="Deve selecionar pelo menos um dia"
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Footer />
        </Box>
    );
}

export default StorageManager;
