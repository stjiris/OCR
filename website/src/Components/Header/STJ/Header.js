import React from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import HelpIcon from '@mui/icons-material/Help';

import logoSTJ from '../../../static/logoSTJ.png';

export default class Header extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            app: props.app,
            privateSession: props.privateSession,
            version: props.version
        }
    }

    render() {        
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