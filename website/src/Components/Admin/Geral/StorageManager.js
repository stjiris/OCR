import React, {useEffect, useRef, useState} from 'react';
import axios from "axios";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

import footerBanner from "../../../static/footerBanner.png";
import loadComponent from "../../../utils/loadComponents";
import UndoIcon from "@mui/icons-material/Undo";
import Typography from "@mui/material/Typography";
import {useNavigate} from "react-router";
const Notification = loadComponent('Notifications', 'Notification');
const DeleteSessionPopup = loadComponent('Form', 'DeleteSessionPopup');
const TooltipIcon = loadComponent("TooltipIcon", "TooltipIcon");

const API_URL = `${window.location.protocol}//${window.location.host}/${process.env.REACT_APP_API_URL}`;
const UPDATE_TIME = 30;  // period of fetching system info, in seconds

const StorageManager = (props) => {
    const navigate = useNavigate();

    const [freeSpace, setFreeSpace] = useState("");
    const [freeSpacePercent, setFreeSpacePercent] = useState("");
    const [privateSessions, setPrivateSessions] = useState([]);
    const [lastCleanup, setLastCleanup] = useState("nunca");

    const [deletePopupOpened, setDeletePopupOpened] = useState(null);
    const [deleteSessionId, setDeleteSessionId] = useState(null);

    const successNotif = useRef(null);
    const errorNotif = useRef(null);

    function getStorageInfo() {
        axios.get(API_URL + '/admin/storage-info')
            .then(({ data }) => {
                setFreeSpace(data["free_space"]);
                setFreeSpacePercent(data["free_space_percentage"]);
                setPrivateSessions(data["private_sessions"]);
                setLastCleanup(data["last_cleanup"]);
            });
    }

    useEffect(() => {
        getStorageInfo();
        const interval = setInterval(getStorageInfo, 1000 * UPDATE_TIME);
        return () => {
            clearInterval(interval);
        }
    }, []);

    function openDeletePopup(e, privateSession) {
        e.stopPropagation();
        setDeleteSessionId(privateSession);
        setDeletePopupOpened(true);
    }

    function deletePrivateSession() {
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

            <DeleteSessionPopup
                open={deletePopupOpened}
                sessionId={deleteSessionId}
                submitDelete={() => deletePrivateSession()}
                cancelDelete={() => { setDeletePopupOpened(false); setDeleteSessionId(null); }}
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

                <Typography id="modal-modal-title" variant="h4" component="h2">
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
            </Box>

            <Box sx={{
                ml: '0.5rem',
                mr: '0.5rem',
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                backgroundColor: '#fff',
                paddingBottom: '1rem',
                marginBottom: '0.5rem',
                borderBottom: '1px solid black',
            }}>
                <Button
                    variant="contained"
                    startIcon={<UndoIcon />}
                    onClick={() => navigate('/admin')}
                    sx={{
                        border: '1px solid black',
                        height: '2rem',
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        backgroundColor: '#ffffff',
                        color: '#000000',
                        ':hover': { bgcolor: '#ddd' }
                    }}
                >
                    Voltar
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
                <Box
                    sx = {{
                        display: "flex",
                        flexDirection: "column",
                        zIndex: "1",
                        backgroundColor: "#fff",
                        border: "1px solid black",
                        borderRadius: '0.5rem',
                        top: "5.5rem",
                        p: "0rem 1rem",
                        width: "fit-content",
                        height: "fit-content",
                    }}
                >
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
                                        height: "2rem",
                                        lineHeight: "2rem",
                                        borderTop: index !== 0 ? "1px solid black" : "0px solid black",
                                        cursor: "pointer"
                                    }}
                                    onClick={() => {
                                        navigate(`/session/${privateSession}`);
                                    }}
                                >
                                    <span>{privateSession} – {info["size"]} – {info["creation"]}</span>
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

            <Box sx={{display:"flex", alignItems:"center", marginTop: '1rem', justifyContent:"center"}}>
                <a href={footerBanner} target='_blank' rel="noreferrer">
                    <img src={footerBanner} alt="Footer com logo do COMPETE 2020, STJ e INESC-ID" style={{height: '4.5rem', width: 'auto'}}/>
                </a>
            </Box>
        </Box>
    );
}

export default StorageManager;
