import React from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import HelpIcon from '@mui/icons-material/Help';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import logoSTJ from '../../../static/logoSTJ.png';
import loadComponent from '../../../utils/loadComponents';

export default class Header extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            app: props.app,
            privateSession: props.privateSession,
            version: props.version,
            freeSpace: props.freeSpace || 0,
            freeSpacePercentage: props.freeSpacePercentage || 0,

            privateSessions: props.privateSessions || [],
            privateSessionsOpen: false,
        }
    }

    setFreeSpace(freeSpace, freeSpacePercentage) {
        this.setState({freeSpace: freeSpace, freeSpacePercentage: freeSpacePercentage})
    }

    setPrivateSessions(privateSessions) {
        this.setState({privateSessions: privateSessions})
    }

    deletePrivateSession(e, privateSession) {
        e.stopPropagation();
        fetch(process.env.REACT_APP_API_URL + "/delete-private-session", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "sessionId": privateSession
            })
        })
        .then(response => {return response.json()})
        .then(data => {
            if (data.success) {
                this.setState({privateSessions: data["private_sessions"]})
            }
        });
    }

    render() {        
        const TooltipIcon = loadComponent('TooltipIcon', 'TooltipIcon');

        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                ml: '1.5rem',
                mr: '1.5rem',
                mb: '1rem',
                mt: '1rem',
                zIndex: '100'
            }}>
                <Box sx={{display: 'flex', flexDirection: 'row'}}>
                    <>
                        <img src={logoSTJ} alt="logoSTJ" style={{paddingTop:'0.5rem', height: '4.5rem', width: 'auto'}}/>
                        <Button
                            className="link"
                            sx={{
                                color: '#BA1514',
                                ml: '2rem', mr: '2rem',  fontSize: '0.75rem'
                            }}
                            style={{textDecoration: 'none'}}
                            onClick={() => {
                                    this.state.app.setState({fileSystemMode: true, editFileMode: false, filesChoice: [], algorithmChoice: [], configChoice: []});
                                    this.state.app.redirectHome();
                                }
                            }
                            underline="hover"
                        >
                            <h1 className='fancy-font'>OCR</h1>
                        </Button>                                
                    </>
                </Box>

                <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
                    {
                        window.location.href.includes(process.env.REACT_APP_ADMIN)
                        ? <Box sx={{display: 'flex', flexDirection: 'row', alignItems: 'center', mr: '1.5rem'}}>
                            <Button
                                sx={{mr: '1.5rem', color: '#BA1514', alignItems: 'center'}}
                                onClick={() => this.setState({privateSessionsOpen: !this.state.privateSessionsOpen})}
                            >
                                Private Sessions
                                {
                                    this.state.privateSessionsOpen
                                    ? <KeyboardArrowUpRoundedIcon sx={{ml: '0.3rem'}} />
                                    : <KeyboardArrowDownRoundedIcon sx={{ml: '0.3rem'}} />
                                }
                            </Button>

                            {
                                this.state.privateSessionsOpen
                                ? <Box sx={{display: 'flex', flexDirection: 'column', position: 'absolute', zIndex: '100', backgroundColor: '#FFFFFF', border: '1px solid #000000', borderRadius: '0.5rem', top: '5rem', p: '0rem 1rem', width: '9rem'}}>
                                    {
                                        this.state.privateSessions.map((privateSession, index) => {
                                            return (
                                                <Box
                                                    key={index}
                                                    sx={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', height: '2rem', lineHeight: '2rem', borderTop: index !== 0 ? '1px solid black' : '0px solid black', cursor: 'pointer'}}
                                                    onClick={() => {
                                                        window.location.href += "/" + privateSession;
                                                    }}
                                                >
                                                    <span>
                                                        {privateSession}
                                                    </span>
                                                    <TooltipIcon
                                                        color="#f00"
                                                        message="Apagar"
                                                        clickFunction={(e) => this.deletePrivateSession(e, privateSession)}
                                                        icon={<DeleteForeverIcon/>}
                                                    />
                                                </Box>
                                            )
                                        })
                                    }
                                </Box>
                                : null
                            }

                            <Button sx={{mr: '1.5rem', padding: '0rem', color: '#BA1514'}} 
                                onClick={() => this.state.app.openLogsMenu()}
                            >
                                <AssignmentRoundedIcon sx={{mr: '0.3rem'}} />
                                Logs
                            </Button>
                            <span>Free Space: {this.state.freeSpace} ({this.state.freeSpacePercentage}%)</span>
                        </Box>
                        : null
                    }
                    <p>{`Versão: ${this.state.version}`}</p>
                    <Button sx={{ml: '1.5rem', padding: '0rem', color: '#BA1514'}} 
                            onClick={() => window.open("https://docs.google.com/document/d/e/2PACX-1vR7BhM0haXd5CIyQatS22NrM44woFjChYCAaUAlqOjGAslLuF0TRPaMhjNW-dX8cxuaL86O5N_3mQMv/pub", '_blank')}
                    >
                        <HelpIcon sx={{mr: '0.3rem'}}>
                        </HelpIcon>
                        Ajuda
                    </Button>
                </Box>
            </Box>
        )
    }
}