import AccessMatrix from '@/Components/AccessMatrix';
import ConfirmButton from '@/Components/ConfirmButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import PlatformLayout from '@/Layouts/PlatformLayout';
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

export default function Index({ roles, permissionGroups }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [renameRole, setRenameRole] = useState(null);
    const [saving, setSaving] = useState(false);
    const [matrix, setMatrix] = useState(() =>
        Object.fromEntries(roles.map((role) => [role.id, role.permission_ids])),
    );

    const createForm = useForm({ name: '' });
    const renameForm = useForm({ name: '' });

    useEffect(() => {
        setMatrix(Object.fromEntries(roles.map((role) => [role.id, role.permission_ids])));
    }, [roles]);

    const dirty = useMemo(
        () => roles.some((role) => !sameIdList(matrix[role.id], role.permission_ids)),
        [matrix, roles],
    );

    const save = () => {
        router.put(
            route('platform.roles.sync'),
            {
                roles: roles.map((role) => ({
                    id: role.id,
                    permission_ids: matrix[role.id] ?? [],
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
        <PlatformLayout title="Roles">
            <Head title="Platform roles" />

            <PageHeader
                eyebrow="Access"
                title="Platform roles"
                description="Granular permission checklist for each platform admin role."
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
                        sx={{ px: 1.75, py: 1.25, borderRadius: 1, minWidth: 160 }}
                    >
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                            <Typography fontWeight={700}>{roleLabel(role.name)}</Typography>
                            {role.is_default && <Chip size="small" label="Default" sx={{ height: 22 }} />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                            {role.users_count} admins · {matrix[role.id]?.length ?? 0} permissions
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
                            {!role.is_default && (
                                <ConfirmButton
                                    size="small"
                                    variant="danger"
                                    disabled={role.users_count > 0}
                                    confirmTitle="Delete role"
                                    confirmMessage={`Delete ${roleLabel(role.name)}?`}
                                    onConfirm={() =>
                                        router.delete(route('platform.roles.destroy', role.id), {
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

            <Paper variant="outlined" sx={{ borderRadius: 1, p: { xs: 1.5, md: 2 } }}>
                <AccessMatrix
                    columns={roles}
                    rows={permissionRows(permissionGroups)}
                    value={matrix}
                    onChange={(roleId, ids) =>
                        setMatrix((current) => ({
                            ...current,
                            [roleId]: ids,
                        }))
                    }
                />
            </Paper>

            {dirty && (
                <Box
                    sx={{
                        position: 'sticky',
                        bottom: 16,
                        mt: 2,
                        px: 2,
                        py: 1.5,
                        borderRadius: 1,
                        bgcolor: colors.ink,
                        color: colors.cream,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                    }}
                >
                    <Typography variant="body2" fontWeight={600}>
                        Unsaved permission changes
                    </Typography>
                    <PrimaryButton
                        onClick={save}
                        disabled={saving}
                        sx={{ bgcolor: colors.butter, color: colors.ink }}
                    >
                        Save matrix
                    </PrimaryButton>
                </Box>
            )}

            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>New platform role</DialogTitle>
                <DialogContent>
                    <InputLabel value="Role name" />
                    <TextInput
                        value={createForm.data.name}
                        onChange={(e) => createForm.setData('name', e.target.value)}
                    />
                    <InputError message={createForm.errors.name} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <SecondaryButton onClick={() => setCreateOpen(false)}>Cancel</SecondaryButton>
                    <PrimaryButton
                        disabled={createForm.processing}
                        onClick={() =>
                            createForm.post(route('platform.roles.store'), {
                                onSuccess: () => {
                                    createForm.reset();
                                    setCreateOpen(false);
                                },
                            })
                        }
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
                        disabled={renameForm.processing}
                        onClick={() =>
                            renameRole &&
                            renameForm.patch(route('platform.roles.update', renameRole.id), {
                                onSuccess: () => setRenameRole(null),
                            })
                        }
                    >
                        Save name
                    </PrimaryButton>
                </DialogActions>
            </Dialog>
        </PlatformLayout>
    );
}
