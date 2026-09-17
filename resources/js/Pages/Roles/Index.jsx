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
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import TenantLayout from '@/Layouts/TenantLayout';
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
                    <PrimaryButton onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4" />
                        New role
                    </PrimaryButton>
                }
            />

            <div className="mb-6 flex flex-row flex-wrap gap-2">
                {roles.map((role) => (
                    <SurfaceCard key={role.id} className="min-w-[160px] bg-surface-raised p-4">
                        <div className="flex items-center justify-between gap-2">
                            <p className="font-bold">{roleLabel(role.name)}</p>
                            {role.is_default && (
                                <Badge variant="secondary" className="h-[22px] px-2 text-xs">
                                    Default
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {role.users_count} staff · {matrix[role.id]?.permission_ids.length ?? 0} permissions
                        </p>
                        <div className="mt-2 flex gap-1.5">
                            <SecondaryButton
                                size="sm"
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
                        </div>
                    </SurfaceCard>
                ))}
            </div>

            <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
                <Tabs value={tab} onValueChange={setTab}>
                    <div className="border-b border-border bg-surface px-4">
                        <TabsList className="h-auto bg-transparent p-0">
                            <TabsTrigger value="permissions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-jam data-[state=active]:bg-transparent">
                                Permissions
                            </TabsTrigger>
                            <TabsTrigger value="menus" className="rounded-none border-b-2 border-transparent data-[state=active]:border-jam data-[state=active]:bg-transparent">
                                Menu stations
                            </TabsTrigger>
                        </TabsList>
                    </div>
                    <div className="p-4 md:p-6">
                        <p className="mb-4 text-sm text-muted-foreground">
                            {tab === 'permissions'
                                ? 'Grant or revoke actions. Disabled modules stay hidden from this board.'
                                : 'Show or hide each menu item, including parent stations and their children.'}
                        </p>
                        <AccessMatrix columns={roles} rows={rows} value={value} onChange={updateIds} />
                    </div>
                </Tabs>
            </div>

            {dirty && (
                <div className="sticky bottom-4 mt-4 flex items-center justify-between gap-4 rounded-card bg-ink px-4 py-3 text-cream shadow-[0_12px_32px_rgb(61_43_31_/_0.28)]">
                    <p className="text-sm font-semibold">Unsaved access changes</p>
                    <PrimaryButton
                        onClick={save}
                        disabled={saving}
                        className="bg-butter text-ink hover:bg-[#C8901F]"
                    >
                        Save matrix
                    </PrimaryButton>
                </div>
            )}

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle>New role</DialogTitle>
                    </DialogHeader>
                    <div>
                        <InputLabel value="Role name" />
                        <TextInput
                            value={createForm.data.name}
                            onChange={(e) => createForm.setData('name', e.target.value)}
                            placeholder="Night baker"
                        />
                        <InputError message={createForm.errors.name} />
                    </div>
                    <DialogFooter className="gap-2">
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
                    <DialogFooter className="gap-2">
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TenantLayout>
    );
}
