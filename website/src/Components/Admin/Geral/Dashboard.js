import React, {useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from "react-router";
import axios from "axios";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

import footerBanner from "../../../static/footerBanner.png";
import loadComponent from "../../../utils/loadComponents";
// const VersionsMenu = loadComponent('Form', 'VersionsMenu');
// const LogsMenu = loadComponent('Form', 'LogsMenu');
const Notification = loadComponent('Notifications', 'Notification');
const TooltipIcon = loadComponent("TooltipIcon", "TooltipIcon");

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;
const UPDATE_TIME = 30;  // period of fetching system info, in seconds

const Dashboard = (props) => {
    const navigate = useNavigate();

    const [privateSessionsOpen, setPrivateSessionsOpen] = useState(false);
    const [freeSpace, setFreeSpace] = useState("");
    const [freeSpacePercent, setFreeSpacePercent] = useState("");
    const [privateSessions, setPrivateSessions] = useState([]);

    // const versionsMenu = useRef(null);
    // const logsMenu = useRef(null);
    const successNotif = useRef(null);
    const errorNotif = useRef(null);

    function getSystemInfo() {
        axios.get(API_URL + '/admin/system-info')
            .then(({ data }) => {
                // if (this.logsMenu.current !== null) this.logsMenu.current.setLogs(data["logs"]);
                setFreeSpace(data["free_space"]);
                setFreeSpacePercent(data["free_space_percentage"]);
                setPrivateSessions(data["private_sessions"]);
            });
    }

    useEffect(() => {
        getSystemInfo();
        const interval = setInterval(getSystemInfo, 1000 * UPDATE_TIME);
        return () => {
            clearInterval(interval);
        }
    }, []);

    function deletePrivateSession(e, privateSession) {
        e.stopPropagation();
        axios.post(API_URL + "/admin/delete-private-session", {
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "sessionId": privateSession
            })
        })
            .then(response => {
                if (response.status !== 200) {
                  throw new Error("Não foi possível concluir o pedido.");
                }
                if (response.data["success"]) {
                    setPrivateSessions(response.data["private_sessions"]);
                } else {
                  throw new Error(response.data["message"])
                }
            })
            .catch(err => {
                errorNotif.current.openNotif(err.message);
            });
    }

    return (
        <Box className="App" sx={{height: '100vh'}}>
            <Notification message={""} severity={"success"} ref={successNotif}/>
            <Notification message={""} severity={"error"} ref={errorNotif}/>

            {/* <VersionsMenu ref={versionsMenu}/> */}
            {/* <LogsMenu ref={logsMenu}/> */}
            <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
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
                    }}>
                        <Box sx={{display: "flex", flexDirection: "column"}}>
                            <Button
                                sx={{
                                    alignItems: "center",
                                    textTransform: "none",
                                    height: "2rem",
                                    mr: "1.5rem"
                                }}
                                onClick={() => setPrivateSessionsOpen(!privateSessionsOpen)}
                            >
                                Sessões Privadas
                                {
                                    privateSessionsOpen
                                        ? <KeyboardArrowUpRoundedIcon sx={{ml: '0.3rem'}} />
                                        : <KeyboardArrowDownRoundedIcon sx={{ml: '0.3rem'}} />
                                }
                            </Button>

                            {
                                privateSessionsOpen
                                    ? <Box
                                        sx = {{
                                            display: "flex",
                                            flexDirection: "column",
                                            position: 'absolute',
                                            zIndex: "1",
                                            backgroundColor: "#fff",
                                            border: "1px solid black",
                                            borderRadius: '0.5rem',
                                            top: "5.5rem",
                                            p: "0rem 1rem",
                                            width: "8rem",
                                        }}
                                    >
                                        {
                                            privateSessions.map((privateSession, index) => {
                                                return (
                                                    <Box
                                                        key={index}
                                                        sx={{
                                                            display: "flex",
                                                            flexDirection: "row",
                                                            justifyContent: "space-between",
                                                            height: "2rem",
                                                            lineHeight: "2rem",
                                                            borderTop: index !== 0 ? "1px solid black" : "0px solid black",
                                                            cursor: "pointer"
                                                        }}
                                                        onClick={() => {
                                                            navigate(`/session/${privateSession}`);
                                                        }}
                                                    >
                                                        <span>{privateSession}</span>
                                                        <TooltipIcon
                                                            className="negActionButton"
                                                            message="Apagar"
                                                            clickFunction={(e) => deletePrivateSession(e, privateSession)}
                                                            icon={<DeleteForeverIcon />}
                                                        />
                                                    </Box>
                                                )
                                            })
                                        }
                                    </Box>
                                    : null
                            }
                        </Box>

                        {/* <Button
                                sx={{
                                    p: 0,
                                    mr: "1.5rem",
                                    textTransform: "none",
                                }}
                                onClick={() => this.openLogsMenu()}
                            >
                                <AssignmentRoundedIcon sx={{mr: "0.3rem"}} />
                                Logs
                            </Button> */}

                        <span>Armazenamento livre: {freeSpace} ({freeSpacePercent}%)</span>
                    </Box>

                    <Button
                        variant="contained"
                        onClick={() => {
                            axios.post(API_URL + "/account/logout")
                                .then(() => window.location.href = '/admin');
                        }}
                        sx={{
                            border: '1px solid black',
                            height: '2rem',
                            textTransform: 'none',
                            ml: '0.5rem',
                        }}
                    >
                        <span>Sair</span>
                    </Button>
            </Box>

            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                margin: 'auto',
                width: '30vw',
                height: '80vh',
                justifyContent: 'space-evenly',
            }}>
                <Button
                    variant="contained"
                    className="adminMenuButton"
                    onClick={() => navigate('/admin/storage')}
                >
                    Gerir Armazenamento
                </Button>

                <Button
                    variant="contained"
                    className="adminMenuButton"
                >
                    Configurar Predefinições OCR
                </Button>

                <Link to="/admin/flower" target="_blank" rel="noreferrer">
                    <Button
                        variant="contained"
                        className="adminMenuButton"
                        sx={{width: '100%'}}
                    >
                        Gerir Workers e Processos
                    </Button>
                </Link>
            </Box>

            <Box sx={{display:"flex", alignItems:"center", marginTop: '1rem', justifyContent:"center"}}>
                <a href={footerBanner} target='_blank' rel="noreferrer">
                    <img src={footerBanner} alt="Footer com logo do COMPETE 2020, STJ e INESC-ID" style={{height: '4.5rem', width: 'auto'}}/>
                </a>
            </Box>
        </Box>
    );
}

export default Dashboard;
