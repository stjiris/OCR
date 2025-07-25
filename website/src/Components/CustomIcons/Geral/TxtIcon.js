import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

export default function TxtIcon(props) {
    return (
    <div className="fileIcon">
        <SvgIcon
            {...props}
            width="800px" height="800px" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"
        >
            <rect x="0" fill="none" width="20" height="20"/>

            {/* <g> */}

                <path d="M18 3v2H2V3h16zm-6 4v2H2V7h10zm6 0v2h-4V7h4zM8 11v2H2v-2h6zm10 0v2h-8v-2h8zm-4 4v2H2v-2h12z"/>

            {/* </g> */}
        </SvgIcon>
    </div>
    )
}
