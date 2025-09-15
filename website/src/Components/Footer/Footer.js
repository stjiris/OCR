import React from 'react';

import Box from "@mui/material/Box";

import footerBanner from "static/footerBanner.png";

const Footer = (props) => {
    return(
        <Box sx={{display:"flex", alignItems:"center", marginTop: "auto", justifyContent:"center"}}>
            <a href={footerBanner} target='_blank' rel="noreferrer">
                <img src={footerBanner} alt="Footer com logo do COMPETE 2020, STJ e INESC-ID" style={{height: '4.5rem', width: 'auto'}}/>
            </a>
        </Box>
    );
}

export default Footer;
