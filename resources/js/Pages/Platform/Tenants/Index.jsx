import ConfirmButton from '@/Components/ConfirmButton';
import FeatureBadge from '@/Components/FeatureBadge';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import UsageBar from '@/Components/UsageBar';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { colors } from '@/theme/bakeryTheme';
import { Box, Button, Stack, Switch, Typography } from '@mui/material';
import { Head, Link, router } from '@inertiajs/react';

export default function Index({ tenants, featureKeys = [] }) {
    const toggleFeature = (tenant, key, enabled) => {
        router.patch(
            route('platform.tenants.features', tenant.id),
            { feature_key: key, enabled },
            { preserveScroll: true },
        );
    };

    return (
        <PlatformLayout title="Tenants">
            <Head title="Tenants" />

            <PageHeader
                eyebrow="Console"
                title="Tenant ledger"
                description="Usage, flags, and suspend controls for every bakery on the platform."
                actions={
                    <Button
                        component={Link}
                        href={route('platform.tenants.create')}
                        variant="contained"
                    >
                        New tenant
                    </Button>
                }
            />

            <Stack spacing={2}>
                {tenants.data.map((tenant) => {
                    const flags = Object.fromEntries(
                        (tenant.feature_flags ?? tenant.featureFlags ?? []).map((f) => [
                            f.feature_key,
                            f.enabled,
                        ]),
                    );

                    return (
                        <SurfaceCard key={tenant.id} sx={{ p: 2.5 }}>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 2,
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        lg: 'minmax(0, 1.3fr) 180px minmax(0, 1.4fr) auto',
                                    },
                                    alignItems: 'center',
                                }}
                            >
                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="h6">{tenant.name}</Typography>
                                        <StatusBadge status={tenant.status} />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                        {tenant.owner_name} · {tenant.owner_email}
                                    </Typography>
                                </Box>

                                <UsageBar
                                    value={tenant.branch_count ?? 0}
                                    max={tenant.max_branches}
                                    label="Branch usage"
                                />

                                <Box
                                    sx={{
                                        display: 'grid',
                                        gap: 0.75,
                                        gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
                                    }}
                                >
                                    {featureKeys.map((key) => {
                                        const enabled = Boolean(flags[key]);
                                        return (
                                            <Stack
                                                key={key}
                                                direction="row"
                                                alignItems="center"
                                                justifyContent="space-between"
                                                spacing={0.5}
                                                sx={{
                                                    px: 1,
                                                    py: 0.5,
                                                    borderRadius: '10px',
                                                    border: `1px solid ${colors.border}`,
                                                    bgcolor: colors.wheatLight,
                                                }}
                                            >
                                                <FeatureBadge featureKey={key} enabled={enabled} />
                                                <Switch
                                                    size="small"
                                                    checked={enabled}
                                                    onChange={(_, next) =>
                                                        toggleFeature(tenant, key, next)
                                                    }
                                                />
                                            </Stack>
                                        );
                                    })}
                                </Box>

                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                    <Button
                                        component={Link}
                                        href={route('platform.tenants.show', tenant.id)}
                                        size="small"
                                    >
                                        Open
                                    </Button>
                                    {tenant.status === 'active' ? (
                                        <ConfirmButton
                                            size="small"
                                            onConfirm={() =>
                                                router.post(route('platform.tenants.suspend', tenant.id))
                                            }
                                            confirmMessage={`Suspend ${tenant.name}?`}
                                        >
                                            Suspend
                                        </ConfirmButton>
                                    ) : (
                                        <ConfirmButton
                                            size="small"
                                            variant="primary"
                                            onConfirm={() =>
                                                router.post(
                                                    route('platform.tenants.reactivate', tenant.id),
                                                )
                                            }
                                            confirmMessage={`Reactivate ${tenant.name}?`}
                                        >
                                            Reactivate
                                        </ConfirmButton>
                                    )}
                                </Stack>
                            </Box>
                        </SurfaceCard>
                    );
                })}
            </Stack>

            <Pagination links={tenants.links} />
        </PlatformLayout>
    );
}
