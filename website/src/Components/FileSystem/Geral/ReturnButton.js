import React from 'react';

import Button from "@mui/material/Button";
import UndoIcon from "@mui/icons-material/Undo";


const ReturnButton = ({ disabled = false, returnFunction = null, sx = {} }) => {
    return (
        <Button
            disabled={disabled}
            variant="contained"
            startIcon={<UndoIcon />}
            onClick={() => returnFunction()}
            className="menuFunctionButton"
            sx={Object.assign({
                marginLeft: "0.5rem",
                backgroundColor: '#ffffff',
                color: '#000000',
                ':hover': { bgcolor: '#ddd' },
            }, sx)}
        >
            Voltar
        </Button>
    );
}

export default ReturnButton;
