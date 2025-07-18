import React from 'react';
import SvgIcon from '@mui/material/SvgIcon';

export default function ZipIcon(props) {
    return (
    <div className="fileIcon">
        <SvgIcon
            {...props}
            viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M14 17h-2v-2h-2v-2h2v2h2m0-6h-2v2h2v2h-2v-2h-2V9h2V7h-2V5h2v2h2m5-4H5c-1.11 0-2 .89-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" fill="#afb42b"/>
        </SvgIcon>
    </div>
    )
}
