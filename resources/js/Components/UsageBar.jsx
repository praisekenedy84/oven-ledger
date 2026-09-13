import { colors } from '@/theme/bakeryTheme';
import { Box, Typography } from '@mui/material';

export default function UsageBar({ value = 0, max = 1, label }) {
    const safeMax = Math.max(Number(max) || 1, 1);
    const used = Number(value) || 0;
    const ratio = Math.min(used / safeMax, 1);
    const tone = ratio >= 1 ? colors.jam : ratio >= 0.75 ? colors.butter : colors.sage;

    return (
        <Box sx={{ minWidth: 120 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography variant="caption" color="text.secondary">
                    {label ?? 'Branches'}
                </Typography>
                <Typography variant="caption" fontWeight={700}>
                    {used}/{safeMax}
                </Typography>
            </Box>
            <Box
                sx={{
                    height: 8,
                    borderRadius: 999,
                    bgcolor: colors.wheatLight,
                    overflow: 'hidden',
                }}
            >
                <Box
                    sx={{
                        width: `${Math.max(ratio * 100, used > 0 ? 6 : 0)}%`,
                        height: '100%',
                        bgcolor: tone,
                        borderRadius: 999,
                    }}
                />
            </Box>
        </Box>
    );
}
