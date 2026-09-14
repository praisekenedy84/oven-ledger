import PageHeader from '@/Components/PageHeader';
import SurfaceCard from '@/Components/SurfaceCard';
import TenantLayout from '@/Layouts/TenantLayout';
import { colors } from '@/theme/bakeryTheme';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Head, Link } from '@inertiajs/react';

const KIND_COLOR = {
    alert: colors.jam,
    reminder: '#8A6410',
    update: colors.sage,
};

function kindLabel(kind) {
    if (kind === 'alert') {
        return 'Alert';
    }
    if (kind === 'reminder') {
        return 'Reminder';
    }
    return 'Update';
}

export default function Index({ notifications = [], unreadCount = 0 }) {
    return (
        <TenantLayout title="Notifications">
            <Head title="Notifications" />

            <PageHeader
                title="Notifications"
                description="Updates, reminders, and alerts — tap one to jump straight to the place you can act."
            />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {unreadCount === 0
                    ? 'Nothing waiting right now.'
                    : `${unreadCount} item${unreadCount === 1 ? '' : 's'} need attention.`}
            </Typography>

            <Stack spacing={1.5}>
                {notifications.length === 0 && (
                    <SurfaceCard>
                        <Typography variant="body2" color="text.secondary">
                            When pre-orders are due, stock runs low, or a batch is ready, it will show up here.
                        </Typography>
                    </SurfaceCard>
                )}

                {notifications.map((item) => (
                    <SurfaceCard
                        key={item.id}
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { sm: 'center' },
                            justifyContent: 'space-between',
                            gap: 2,
                        }}
                    >
                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: KIND_COLOR[item.kind] ?? colors.muted,
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                }}
                            >
                                {kindLabel(item.kind)}
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.25 }}>
                                {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {item.body}
                            </Typography>
                        </Box>
                        {item.href && (
                            <Button
                                component={Link}
                                href={item.href}
                                variant="contained"
                                size="small"
                                sx={{ flexShrink: 0 }}
                            >
                                {item.action_label || 'Open'}
                            </Button>
                        )}
                    </SurfaceCard>
                ))}
            </Stack>
        </TenantLayout>
    );
}
