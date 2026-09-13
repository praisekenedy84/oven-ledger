import AccessMatrix from '@/Components/AccessMatrix';
import ConfirmButton from '@/Components/ConfirmButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import { roleLabel, sameIdList } from '@/lib/roles';
import { colors } from '@/theme/bakeryTheme';
import AddIcon from '@mui/icons-material/Add';
import {
    Box,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Paper,
    Stack,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

function permissionRows(groups) {
    return groups.flatMap((group) => [
        {
            id: `group:${group.key}`,
            label: group.label,
            depth: 0,
            isSection: true,
            childIds: group.items.map((item) => item.id),
        },
        ...group.items.map((item) => ({
            id: item.id,
            label: item.label,
            depth: 1,
            isSection: false,
        })),
    ]);
}

function menuRowsFromCatalog(menuRows) {
    return menuRows.map((row) => ({
        id: row.id,
        label: row.label,
        depth: row.depth,
        isSection: false,
        has_children: row.has_children,
    }));
}

export default function Index({ roles, permissionGroups, menuRows }) {
    const [tab, setTab] = useState('permissions');
    const [createOpen, setCreateOpen] = useState(false);
    const [renameRole, setRenameRole] = useState(null);
    const [matrix, setMatrix] = useState(() =>
        Object.fromEntries(
            roles.map((role) => [
                role.id,
                {
                    permission_ids: role.permission_ids,
                    visible_menu_ids: role.visible_menu_ids,
                },
            ]),
        ),
    );

    const createForm = useForm({ name: '' });
    const renameForm = useForm({ name: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setMatrix(
            Object.fromEntries(
                roles.map((role) => [
                    role.id,
                    {
                        permission_ids: role.permission_ids,
                        visible_menu_ids: role.visible_menu_ids,
                    },
                ]),
            ),
        );
    }, [roles]);

    const dirty = useMemo(
        () =>
            roles.some((role) => {
                const current = matrix[role.id];
                return (
                    !sameIdList(current?.permission_ids, role.permission_ids) ||
                    !sameIdList(current?.visible_menu_ids, role.visible_menu_ids)
                );
            }),
        [matrix, roles],
    );

    const rows = tab === 'permissions' ? permissionRows(permissionGroups) : menuRowsFromCatalog(menuRows);
    const value = Object.fromEntries(
        roles.map((role) => [
            role.id,
            tab === 'permissions'
                ? matrix[role.id]?.permission_ids ?? []
                : matrix[role.id]?.visible_menu_ids ?? [],
        ]),
    );

    const updateIds = (roleId, ids) => {
        setMatrix((current) => ({
            ...current,
            [roleId]: {
                ...current[roleId],
                [tab === 'permissions' ? 'permission_ids' : 'visible_menu_ids']: ids,
            },
        }));
    };

    const save = () => {
        router.put(
            route('tenant.roles.sync'),
            {
                roles: roles.map((role) => ({
                    id: role.id,
                    permission_ids: matrix[role.id]?.permission_ids ?? [],
                    visible_menu_ids: matrix[role.id]?.visible_menu_ids ?? [],
                })),
            },
            {
                preserveScroll: true,
                onStart: () => setSaving(true),
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <TenantLayout title="Roles & access">
            <Head title="Roles & access" />

            <PageHeader
                eyebrow="Access"
                title="Roles & permissions"
                description="A checklist per role: what they can do, and which stations they see."
                actions={
                    <PrimaryButton startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
                        New role
                    </PrimaryButton>
                }
            />

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
                {roles.map((role) => (
                    <Paper
                        key={role.id}
                        variant="outlined"
                        sx={{
                            px: 1.75,
                            py: 1.25,
                            borderRadius: 3,
                            minWidth: 160,
                            bgcolor: colors.surfaceRaised,
                        }}
                    >
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                            <Typography fontWeight={700}>{roleLabel(role.name)}</Typography>
                            {role.is_default && (
                                <Chip size="small" label="Default" sx={{ height: 22 }} />
                            )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                            {role.users_count} staff · {matrix[role.id]?.permission_ids.length ?? 0} permissions
                        </Typography>
                        <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
                            <SecondaryButton
                                size="small"
                                onClick={() => {
                                    setRenameRole(role);
                                    renameForm.setData('name', role.name);
                                }}
                            >
                                Rename
                            </SecondaryButton>
                            {role.name !== 'owner' && (
                                <ConfirmButton
                                    size="small"
                                    variant="danger"
                                    disabled={role.users_count > 0}
                                    confirmTitle="Delete role"
                                    confirmMessage={
                                        role.users_count > 0
                                            ? 'Reassign staff before deleting this role.'
                                            : `Delete ${roleLabel(role.name)}?`
                                    }
                                    onConfirm={() =>
                                        router.delete(route('tenant.roles.destroy', role.id), {
                                            preserveScroll: true,
                                        })
                                    }
                                >
                                    Delete
                                </ConfirmButton>
                            )}
                        </Stack>
                    </Paper>
                ))}
            </Stack>

            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box
                    sx={{
                        px: 2,
                        borderBottom: `1px solid ${colors.border}`,
                        bgcolor: colors.surface,
                    }}
                >
                    <Tabs value={tab} onChange={(_, next) => setTab(next)}>
                        <Tab value="permissions" label="Permissions" />
                        <Tab value="menus" label="Menu stations" />
                    </Tabs>
                </Box>
                <Box sx={{ p: { xs: 1.5, md: 2 } }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {tab === 'permissions'
                            ? 'Grant or revoke actions. Disabled modules stay hidden from this board.'
                            : 'Show or hide each menu item, including parent stations and their children.'}
                    </Typography>
                    <AccessMatrix columns={roles} rows={rows} value={value} onChange={updateIds} />
                </Box>
            </Paper>

            {dirty && (
                <Box
                    sx={{
                        position: 'sticky',
                        bottom: 16,
                        mt: 2,
                        px: 2,
                        py: 1.5,
                        borderRadius: 3,
                        bgcolor: colors.ink,
                        color: colors.cream,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        boxShadow: '0 12px 32px rgb(61 43 31 / 0.28)',
                    }}
                >
                    <Typography variant="body2" fontWeight={600}>
                        Unsaved access changes
                    </Typography>
                    <PrimaryButton
                        onClick={save}
                        disabled={saving}
                        sx={{ bgcolor: colors.butter, color: colors.ink, '&:hover': { bgcolor: '#C8901F' } }}
                    >
                        Save matrix
                    </PrimaryButton>
                </Box>
            )}

            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>New role</DialogTitle>
                <DialogContent>
                    <InputLabel value="Role name" />
                    <TextInput
                        value={createForm.data.name}
                        onChange={(e) => createForm.setData('name', e.target.value)}
                        placeholder="Night baker"
                    />
                    <InputError message={createForm.errors.name} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <SecondaryButton onClick={() => setCreateOpen(false)}>Cancel</SecondaryButton>
                    <PrimaryButton
                        onClick={() =>
                            createForm.post(route('tenant.roles.store'), {
                                onSuccess: () => {
                                    createForm.reset();
                                    setCreateOpen(false);
                                },
                            })
                        }
                        disabled={createForm.processing}
                    >
                        Create role
                    </PrimaryButton>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(renameRole)} onClose={() => setRenameRole(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Rename role</DialogTitle>
                <DialogContent>
                    <InputLabel value="Role name" />
                    <TextInput
                        value={renameForm.data.name}
                        onChange={(e) => renameForm.setData('name', e.target.value)}
                    />
                    <InputError message={renameForm.errors.name} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <SecondaryButton onClick={() => setRenameRole(null)}>Cancel</SecondaryButton>
                    <PrimaryButton
                        onClick={() =>
                            renameRole &&
                            renameForm.patch(route('tenant.roles.update', renameRole.id), {
                                onSuccess: () => setRenameRole(null),
                            })
                        }
                        disabled={renameForm.processing}
                    >
                        Save name
                    </PrimaryButton>
                </DialogActions>
            </Dialog>
        </TenantLayout>
    );
}
