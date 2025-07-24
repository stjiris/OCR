import React, {useEffect, useRef, useState} from 'react';
import {Link, useNavigate} from "react-router";
import axios from "axios";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import footerBanner from "../../../static/footerBanner.png";
// import loadComponent from "../../../utils/loadComponents";
// const VersionsMenu = loadComponent('Form', 'VersionsMenu');
// const LogsMenu = loadComponent('Form', 'LogsMenu');
// const Notification = loadComponent('Notifications', 'Notification');

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;
const ADMIN_HOME = (process.env.REACT_APP_BASENAME !== null && process.env.REACT_APP_BASENAME !== "")
    ? `/${process.env.REACT_APP_BASENAME}/admin`
    : '/admin';

const UPDATE_TIME = 30;  // period of fetching system info, in seconds

const Dashboard = (props) => {
    const navigate = useNavigate();

    const [freeSpace, setFreeSpace] = useState("");
    const [freeSpacePercent, setFreeSpacePercent] = useState("");

    // const versionsMenu = useRef(null);
    // const logsMenu = useRef(null);
    // const successNotif = useRef(null);
    // const errorNotif = useRef(null);

    function getSystemInfo() {
        axios.get(API_URL + '/admin/system-info')
            .then(({ data }) => {
                // if (this.logsMenu.current !== null) this.logsMenu.current.setLogs(data["logs"]);
                setFreeSpace(data["free_space"]);
                setFreeSpacePercent(data["free_space_percentage"]);
            });
    }

    useEffect(() => {
        getSystemInfo();
        const interval = setInterval(getSystemInfo, 1000 * UPDATE_TIME);
        return () => {
            clearInterval(interval);
        }
    }, []);

    return (
        <Box className="App" sx={{height: '100vh'}}>
            {/* <Notification message={""} severity={"success"} ref={successNotif}/> */}
            {/* <Notification message={""} severity={"error"} ref={errorNotif}/> */}

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
                        <span>Armazenamento livre: {freeSpace} ({freeSpacePercent}%)</span>
                    </Box>

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
                    disabled
                    variant="contained"
                    className="adminMenuButton"
                >
                    Configurar Predefinições OCR
                </Button>

                <Link to="/admin/flower/" target="_blank" rel="noreferrer">
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
