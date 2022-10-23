import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';

const CustomTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
    '& fieldset': {
        borderColor: 'gray',
    },
    '&.Mui-focused fieldset': {
        borderColor: 'blue',
    },
    },
});

export default CustomTextField;