import { colors } from '@/theme/bakeryTheme';
import { Link } from '@inertiajs/react';
import { Box, Button, Stack, Typography } from '@mui/material';

export default function PageHeader({ eyebrow, title, description, actions, backHref }) {
    return (
        <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            sx={{ mb: 3 }}
        >
            <Box sx={{ minWidth: 0, flex: 1 }}>
                {backHref && (
                    <Button
                        component={Link}
                        href={backHref}
                        size="small"
                        sx={{ mb: 1, px: 0, minWidth: 0, minHeight: 0, height: 'auto', color: colors.muted }}
                    >
                        ← Back
                    </Button>
                )}
                {eyebrow && (
                    <Typography variant="overline" sx={{ display: 'block', color: colors.jam, mb: 1 }}>
                        {eyebrow}
                    </Typography>
                )}
                <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' }, lineHeight: 1.2 }}>
                    {title}
                </Typography>
                {description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
                        {description}
                    </Typography>
                )}
            </Box>
            {actions && (
                <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    alignItems="center"
                    justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                    sx={{ flexShrink: 0 }}
                >
                    {actions}
                </Stack>
            )}
        </Stack>
    );
}
