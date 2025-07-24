import React from 'react';

import Button from "@mui/material/Button";
import UndoIcon from "@mui/icons-material/Undo";


const ReturnButton = ({ disabled = false, returnFunction = null }) => {
    return (
        <Button
            disabled={disabled}
            variant="contained"
            startIcon={<UndoIcon />}
            onClick={() => returnFunction()}
            className="menuFunctionButton noMarginRight"
            sx={{
                backgroundColor: '#ffffff',
                color: '#000000',
                ':hover': { bgcolor: '#ddd' }
            }}
        >
            Voltar
        </Button>
    );
}

export default ReturnButton;
