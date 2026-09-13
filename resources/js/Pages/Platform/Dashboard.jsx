import PageHeader from '@/Components/PageHeader';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { colors } from '@/theme/bakeryTheme';
import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats }) {
    return (
        <PlatformLayout title="Dashboard">
            <Head title="Platform Dashboard" />

            <PageHeader
                eyebrow="Console"
                title="Platform overview"
                description="Tenant health across Oven Ledger."
            />

            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                }}
            >
                <StatCard label="Total Tenants" value={stats.tenants_total} />
                <StatCard label="Active" value={stats.tenants_active} accent="success" />
                <StatCard label="Suspended" value={stats.tenants_suspended} accent="danger" />
            </Box>

            <Box
                sx={{
                    mt: 3,
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                }}
            >
                <Card sx={{ borderRadius: 3 }}>
                    <CardActionArea component={Link} href={route('platform.tenants.index')}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                Manage Tenants
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                View, provision, and configure bakery tenants.
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>
                <Card sx={{ borderRadius: 3 }}>
                    <CardActionArea component={Link} href={route('platform.audit.index')}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                Audit Log
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Review platform admin actions across tenants.
                            </Typography>
                        </CardContent>
                    </CardActionArea>
                </Card>
            </Box>
        </PlatformLayout>
    );
}

function StatCard({ label, value, accent }) {
    const color =
        accent === 'success'
            ? colors.success
            : accent === 'danger'
              ? colors.danger
              : colors.ink;

    return (
        <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
                <Typography variant="body2" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 1, color }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );
}
