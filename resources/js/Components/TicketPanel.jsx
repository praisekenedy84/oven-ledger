import { colors, shadow } from '@/theme/bakeryTheme';
import { Box } from '@mui/material';

export default function TicketPanel({ children, sx, ...props }) {
    const scallop = `radial-gradient(circle at 8px 0, ${colors.kraft} 6px, transparent 6.5px)`;

    return (
        <Box
            {...props}
            sx={{
                position: 'relative',
                bgcolor: colors.cream,
                border: `1px solid ${colors.border}`,
                boxShadow: shadow,
                overflow: 'hidden',
                '&::before, &::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 10,
                    backgroundImage: scallop,
                    backgroundSize: '16px 10px',
                    backgroundRepeat: 'repeat-x',
                    zIndex: 1,
                    pointerEvents: 'none',
                },
                '&::before': { top: 0, transform: 'translateY(-5px)' },
                '&::after': {
                    bottom: 0,
                    transform: 'translateY(5px) rotate(180deg)',
                },
                ...sx,
            }}
        >
            {children}
        </Box>
    );
}
