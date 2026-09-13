import { Checkbox as MuiCheckbox, FormControlLabel } from '@mui/material';

export default function Checkbox({ className = '', label, ...props }) {
    const control = (
        <MuiCheckbox
            {...props}
            className={className}
            color="primary"
            size="small"
        />
    );

    if (label) {
        return <FormControlLabel control={control} label={label} />;
    }

    return control;
}
