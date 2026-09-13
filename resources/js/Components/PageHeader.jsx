import { colors } from '@/theme/bakeryTheme';
import { Link } from '@inertiajs/react';
import { Box, Button, Stack, Typography } from '@mui/material';

export default function PageHeader({ eyebrow, title, description, actions, backHref }) {
    return (
        <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ sm: 'flex-start' }}
            justifyContent="space-between"
            sx={{ mb: 3 }}
        >
            <Box sx={{ minWidth: 0 }}>
                {backHref && (
                    <Button
                        component={Link}
                        href={backHref}
                        size="small"
                        sx={{ mb: 1, px: 0, minWidth: 0, minHeight: 0, color: colors.muted }}
                    >
                        ← Back
                    </Button>
                )}
                {eyebrow && (
                    <Typography variant="overline" sx={{ display: 'block', color: colors.jam, mb: 0.75 }}>
                        {eyebrow}
                    </Typography>
                )}
                <Typography variant="h4">{title}</Typography>
                {description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
                        {description}
                    </Typography>
                )}
            </Box>
            {actions && (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {actions}
                </Stack>
            )}
        </Stack>
    );
}
