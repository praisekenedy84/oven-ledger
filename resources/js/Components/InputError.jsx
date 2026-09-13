import { FormHelperText } from '@mui/material';

export default function InputError({ message, className = '', ...props }) {
    if (!message) {
        return null;
    }

    return (
        <FormHelperText error className={className} {...props} sx={{ mx: 0, mt: 0.75 }}>
            {message}
        </FormHelperText>
    );
}
