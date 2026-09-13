import AccessMatrix from '@/Components/AccessMatrix';
import ConfirmButton from '@/Components/ConfirmButton';
import FeatureBadge from '@/Components/FeatureBadge';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import UsageBar from '@/Components/UsageBar';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { featureLabel } from '@/lib/features';
import { sameIdList } from '@/lib/roles';
import { colors } from '@/theme/bakeryTheme';
import {
    Box,
    List,
    ListItem,
    ListItemText,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Show({
    tenant,
    branchCount,
    featureKeys,
    branchSuspensions,
    menuRows = [],
    availableMenuIds = [],
    enabledFeatures = {},
}) {
    const flagsByKey = Object.fromEntries(
        (tenant.feature_flags ?? tenant.featureFlags ?? []).map((f) => [
            f.feature_key,
            f.enabled,
        ]),
    );

    const branchesForm = useForm({ max_branches: tenant.max_branches });
    const [menuIds, setMenuIds] = useState(availableMenuIds);
    const [savingMenus, setSavingMenus] = useState(false);
    const visibleMenuRows = menuRows.filter(
        (row) => !row.feature_key || enabledFeatures[row.feature_key],
    );
    const menusDirty = !sameIdList(menuIds, availableMenuIds);

    const suspend = () => router.post(route('platform.tenants.suspend', tenant.id));
    const reactivate = () => router.post(route('platform.tenants.reactivate', tenant.id));

    return (
        <PlatformLayout title={tenant.name}>
            <Head title={tenant.name} />

            <PageHeader
                eyebrow="Tenant"
                title={tenant.name}
                description={tenant.owner_email}
                backHref={route('platform.tenants.index')}
                actions={
                    tenant.status === 'active' ? (
                        <ConfirmButton onConfirm={suspend} confirmMessage="Suspend this tenant?">
                            Suspend tenant
                        </ConfirmButton>
                    ) : (
                        <ConfirmButton
                            onConfirm={reactivate}
                            variant="primary"
                            confirmMessage="Reactivate?"
                        >
                            Reactivate tenant
                        </ConfirmButton>
                    )
                }
            />

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                }}
            >
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        Overview
                    </Typography>
                    <Stack spacing={1.5} sx={{ mt: 2 }}>
                        <Row label="Status">
                            <StatusBadge status={tenant.status} />
                        </Row>
                        <Row label="Owner">
                            {tenant.owner_name} ({tenant.owner_email})
                        </Row>
                        <Row label="Phone">{tenant.owner_phone || 'â€”'}</Row>
                        <Row label="Branches">
                            <UsageBar value={branchCount} max={tenant.max_branches} />
                        </Row>
                    </Stack>
                </Paper>

                <Paper
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        branchesForm.patch(route('platform.tenants.max-branches', tenant.id));
                    }}
                    variant="outlined"
                    sx={{ p: 3, borderRadius: 1 }}
                >
                    <Typography variant="subtitle1" fontWeight={700}>
                        Branch limit
                    </Typography>
                    <Stack direction="row" spacing={1.5} alignItems="flex-end" sx={{ mt: 2 }}>
                        <Box sx={{ flex: 1 }}>
                            <InputLabel value="Max branches" />
                            <TextInput
                                type="number"
                                inputProps={{ min: 1 }}
                                value={branchesForm.data.max_branches}
                                onChange={(e) =>
                                    branchesForm.setData('max_branches', Number(e.target.value))
                                }
                            />
                            <InputError message={branchesForm.errors.max_branches} />
                        </Box>
                        <PrimaryButton type="submit" disabled={branchesForm.processing}>
                            Update
                        </PrimaryButton>
                    </Stack>
                </Paper>

                <Paper
                    variant="outlined"
                    sx={{ p: 3, borderRadius: 1, gridColumn: { lg: '1 / -1' } }}
                >
                    <Typography variant="subtitle1" fontWeight={700}>
                        Feature flags
                    </Typography>
                    <Box
                        sx={{
                            mt: 2,
                            display: 'grid',
                            gap: 1.5,
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: '1fr 1fr',
                                lg: 'repeat(3, 1fr)',
                            },
                        }}
                    >
                        {featureKeys.map((key) => {
                            const enabled = flagsByKey[key] ?? false;
                            return (
                                <Box
                                    key={key}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 1.5,
                                        border: `1px solid ${colors.border}`,
                                        borderRadius: 2,
                                        p: 1.5,
                                    }}
                                >
                                    <Box>
                                        <FeatureBadge featureKey={key} enabled={enabled} />
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            display="block"
                                            sx={{ mt: 0.5 }}
                                        >
                                            {featureLabel(key)}
                                        </Typography>
                                    </Box>
                                    <SecondaryButton
                                        size="small"
                                        onClick={() =>
                                            router.patch(
                                                route('platform.tenants.features', tenant.id),
                                                { feature_key: key, enabled: !enabled },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        {enabled ? 'Disable' : 'Enable'}
                                    </SecondaryButton>
                                </Box>
                            );
                        })}
                    </Box>
                </Paper>

                <Paper
                    variant="outlined"
                    sx={{ p: 3, borderRadius: 1, gridColumn: { lg: '1 / -1' } }}
                >
                    <Typography variant="subtitle1" fontWeight={700}>
                        Menu availability
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                        Control which stations this bakery can see at every menu level. Feature-flagged
                        items stay hidden until that module is enabled.
                    </Typography>
                    <AccessMatrix
                        columns={[{ id: 'available', name: 'Available' }]}
                        rows={visibleMenuRows.map((row) => ({
                            id: row.id,
                            label: row.label,
                            depth: row.depth,
                            isSection: false,
                            has_children: row.has_children,
                        }))}
                        value={{ available: menuIds }}
                        onChange={(_, ids) => setMenuIds(ids)}
                    />
                    {menusDirty && (
                        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                            <PrimaryButton
                                disabled={savingMenus}
                                onClick={() =>
                                    router.put(
                                        route('platform.tenants.menus', tenant.id),
                                        { menu_item_ids: menuIds },
                                        {
                                            preserveScroll: true,
                                            onStart: () => setSavingMenus(true),
                                            onFinish: () => setSavingMenus(false),
                                        },
                                    )
                                }
                            >
                                Save menu availability
                            </PrimaryButton>
                        </Stack>
                    )}
                </Paper>

                {branchSuspensions?.length > 0 && (
                    <Paper
                        variant="outlined"
                        sx={{ p: 3, borderRadius: 1, gridColumn: { lg: '1 / -1' } }}
                    >
                        <Typography variant="subtitle1" fontWeight={700}>
                            Branch suspensions
                        </Typography>
                        <List sx={{ mt: 1 }}>
                            {branchSuspensions.map((s) => (
                                <ListItem
                                    key={s.id}
                                    sx={{
                                        bgcolor: colors.surface,
                                        borderRadius: 2,
                                        mb: 1,
                                    }}
                                    secondaryAction={<StatusBadge status="suspended" />}
                                >
                                    <ListItemText primary={`Branch ID ${s.branch_id}`} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                )}
            </Box>
        </PlatformLayout>
    );
}

function Row({ label, children }) {
    return (
        <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={600} textAlign="right">
                {children}
            </Typography>
        </Stack>
    );
}
