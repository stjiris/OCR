import React, {useEffect, useRef, useState} from 'react';
import axios from "axios";
import { useNavigate } from "react-router";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import Typography from "@mui/material/Typography";

import TextField from "@mui/material/TextField";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

import { TimePicker } from "@mui/x-date-pickers/TimePicker";

import loadComponent from "../../../utils/loadComponents";
const ReturnButton = loadComponent('FileSystem', 'ReturnButton');
const Notification = loadComponent('Notifications', 'Notification');
const ConfirmActionPopup = loadComponent('Form', 'ConfirmActionPopup');
const TooltipIcon = loadComponent("TooltipIcon", "TooltipIcon");
const CheckboxList = loadComponent("Form", "CheckboxList");
const Footer = loadComponent('Footer', 'Footer');

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;
const ADMIN_HOME = (process.env.REACT_APP_BASENAME !== null && process.env.REACT_APP_BASENAME !== "")
                            ? `/${process.env.REACT_APP_BASENAME}/admin`
                            : '/admin';

const UPDATE_TIME = 30;  // period of fetching system info, in seconds

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

const StorageManager = (props) => {
    const navigate = useNavigate();

    const [freeSpace, setFreeSpace] = useState("");
    const [freeSpacePercent, setFreeSpacePercent] = useState("");
    const [privateSessions, setPrivateSessions] = useState([]);
    const [lastCleanup, setLastCleanup] = useState("nunca");
    const [maxPrivateSessionAge, setMaxPrivateSessionAge] = useState("5");

    const [scheduleType, setScheduleType] = useState("monthly");

    const [everyHours, setEveryHours] = useState('');

    const [monthTime, setMonthTime] = useState(null);
    const [monthDay, setMonthDay] = useState('');

    const [weekTime, setWeekTime] = useState(null);
    const [weekDays, setWeekDays] = useState([]);

    const [deleteSessionId, setDeleteSessionId] = useState(null);

    const [confirmPopupOpened, setConfirmPopupOpened] = useState(false);
    const [confirmPopupMessage, setConfirmPopupMessage] = useState("");
    const [confirmPopupSubmitCallback, setConfirmPopupSubmitCallback] = useState(null);

    const successNotif = useRef(null);
    const errorNotif = useRef(null);

    function getStorageInfo() {
        axios.get(API_URL + '/admin/storage-info')
            .then(({ data }) => {
                setFreeSpace(data["free_space"]);
                setFreeSpacePercent(data["free_space_percentage"]);
                setPrivateSessions(data["private_sessions"]);
                setLastCleanup(data["last_cleanup"]);
                setMaxPrivateSessionAge(data["max_age"]);
            });
    }

    useEffect(() => {
        getStorageInfo();
        const interval = setInterval(getStorageInfo, 1000 * UPDATE_TIME);
        return () => {
            clearInterval(interval);
        }
    }, []);

    // setup confirmation popup after deleteSessionId is set by openDeletePopup()
    useEffect(() => {
        if (deleteSessionId !== null) {
            console.log(`Before opening: ${deleteSessionId}`);
            setConfirmPopupOpened(true);
            setConfirmPopupMessage(`Tem a certeza que quer apagar a sessão ${deleteSessionId}?`);
            console.log(`Before callback: ${deleteSessionId}`);
            setConfirmPopupSubmitCallback(() => deletePrivateSession);  // set value as function deletePrivateSession
            console.log(`After callback: ${deleteSessionId}`);
        }
    }, [deleteSessionId])

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

    function openDeletePopup(e, privateSession) {
        e.stopPropagation();
        setDeleteSessionId(privateSession);
        // confirm popup is set up in useEffect
    }

    function openCleanupPopup(e) {
        e.stopPropagation();
        setConfirmPopupOpened(true);
        setConfirmPopupMessage(`Tem a certeza que quer remover as sessões com mais de ${maxPrivateSessionAge} dias?`);
        setConfirmPopupSubmitCallback(() => runPrivateSessionCleanup);  // set value as function runPrivateSessionCleanup
    }

    function closeConfirmationPopup() {
        setDeleteSessionId(null);  // needed when closing or cancelling popup for deletion of single private session
        setConfirmPopupOpened(false);
        setConfirmPopupMessage("");
        setConfirmPopupSubmitCallback(null);
    }

    const deletePrivateSession = () => {
        axios.post(API_URL + "/admin/delete-private-session",
            {
                "sessionId": deleteSessionId
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
                if (response.data["success"]) {
                    setPrivateSessions(response.data["private_sessions"]);
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

    const runPrivateSessionCleanup = () => {
        axios.post(API_URL + "/admin/cleanup-sessions")
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
                        || (scheduleType === "weekly" && weekTime !== null && weekDays !== []);
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
                <ReturnButton
                    disabled={false}
                    returnFunction={() => navigate('/admin')}
                />

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
                }}>
                    <Button
                        variant="contained"
                        onClick={(e) => openCleanupPopup(e)}
                        className="menuButton"
                        sx={{alignSelf: 'center'}}
                    >
                        Remover sessões com mais de {maxPrivateSessionAge} dias
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
                        <span>Sessões Privadas</span>
                        {
                            Object.entries(privateSessions).map(([privateSession, info], index) => {
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
                                            navigate(`/session/${privateSession}`);
                                        }}
                                    >
                                        <code>{privateSession}</code>
                                        <span>&nbsp;–&nbsp;{info["size"]}&nbsp;–&nbsp;{info["creation"]}</span>
                                        <TooltipIcon
                                            className="negActionButton"
                                            message="Apagar"
                                            clickFunction={(e) => openDeletePopup(e, privateSession)}
                                            icon={<DeleteForeverIcon />}
                                        />
                                    </Box>
                                )
                            })
                        }
                    </Box>
                </Box>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '15%',
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
                    width: '15%',
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
                    width: '15%',
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

            <Footer />
        </Box>
    );
}

export default StorageManager;
