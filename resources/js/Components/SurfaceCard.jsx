import { colors, layout, radius, shadow } from '@/theme/bakeryTheme';
import { Paper } from '@mui/material';

export default function SurfaceCard({ children, sx, ...props }) {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: layout.cardPad,
                borderRadius: `${radius}px`,
                bgcolor: colors.cream,
                borderColor: colors.border,
                boxShadow: shadow,
                ...sx,
            }}
            {...props}
        >
            {children}
        </Paper>
    );
}
