import AccessMatrix from '@/Components/AccessMatrix';
import ConfirmButton from '@/Components/ConfirmButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { roleLabel, sameIdList } from '@/lib/roles';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
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
                    <PrimaryButton onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4" />
                        New role
                    </PrimaryButton>
                }
            />

            <div className="mb-6 flex flex-row flex-wrap gap-2">
                {roles.map((role) => (
                    <SurfaceCard key={role.id} className="min-w-[160px] px-4 py-3">
                        <div className="flex flex-row items-center justify-between gap-2">
                            <span className="font-bold">{roleLabel(role.name)}</span>
                            {role.is_default && (
                                <Badge variant="secondary" className="h-[22px] px-2 text-xs">
                                    Default
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {role.users_count} admins · {matrix[role.id]?.length ?? 0} permissions
                        </p>
                        <div className="mt-2 flex flex-row gap-1.5">
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
                        </div>
                    </SurfaceCard>
                ))}
            </div>

            <SurfaceCard className="p-4 md:p-6">
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
            </SurfaceCard>

            {dirty && (
                <div className="sticky bottom-4 mt-4 flex items-center justify-between gap-4 rounded-md bg-ink px-4 py-3 text-cream">
                    <p className="text-sm font-semibold">Unsaved permission changes</p>
                    <PrimaryButton
                        onClick={save}
                        disabled={saving}
                        className="bg-butter text-ink hover:bg-butter/90"
                    >
                        Save matrix
                    </PrimaryButton>
                </div>
            )}

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle>New platform role</DialogTitle>
                    </DialogHeader>
                    <div>
                        <InputLabel value="Role name" />
                        <TextInput
                            value={createForm.data.name}
                            onChange={(e) => createForm.setData('name', e.target.value)}
                        />
                        <InputError message={createForm.errors.name} />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(renameRole)} onOpenChange={(open) => !open && setRenameRole(null)}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle>Rename role</DialogTitle>
                    </DialogHeader>
                    <div>
                        <InputLabel value="Role name" />
                        <TextInput
                            value={renameForm.data.name}
                            onChange={(e) => renameForm.setData('name', e.target.value)}
                        />
                        <InputError message={renameForm.errors.name} />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PlatformLayout>
    );
}
