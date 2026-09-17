import AccessMatrix from '@/Components/AccessMatrix';
import ConfirmButton from '@/Components/ConfirmButton';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import FeatureBadge from '@/Components/FeatureBadge';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import UsageBar from '@/Components/UsageBar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { businessSizeLabel, featureLabel } from '@/lib/features';
import { roleLabel, sameIdList } from '@/lib/roles';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function Show({
    tenant,
    branchCount,
    featureKeys,
    businessSizes = ['small', 'medium', 'large'],
    branchSuspensions,
    menuRows = [],
    availableMenuIds = [],
    enabledFeatures = {},
    users = [],
}) {
    const flagsByKey = Object.fromEntries(
        (tenant.feature_flags ?? tenant.featureFlags ?? []).map((f) => [
            f.feature_key,
            f.enabled,
        ]),
    );

    const branchesForm = useForm({ max_branches: tenant.max_branches });
    const sizeForm = useForm({ business_size: tenant.business_size || 'medium' });
    const [menuIds, setMenuIds] = useState(availableMenuIds);
    const [savingMenus, setSavingMenus] = useState(false);
    const visibleMenuRows = menuRows.filter(
        (row) => !row.feature_key || enabledFeatures[row.feature_key],
    );
    const menusDirty = !sameIdList(menuIds, availableMenuIds);

    const { auth } = usePage().props;
    const canImpersonate =
        (auth.permissions ?? []).includes('tenants.impersonate') && tenant.status === 'active';

    const suspend = () => router.post(route('platform.tenants.suspend', tenant.id));
    const reactivate = () => router.post(route('platform.tenants.reactivate', tenant.id));
    const impersonate = (user) =>
        router.post(route('platform.tenants.impersonate', tenant.id), { user_id: user.id });

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

            <div className="grid gap-6 lg:grid-cols-2">
                <SurfaceCard>
                    <h2 className="text-base font-bold">Overview</h2>
                    <div className="mt-4 space-y-3">
                        <Row label="Status">
                            <StatusBadge status={tenant.status} />
                        </Row>
                        <Row label="Bakery size">
                            {businessSizeLabel(tenant.business_size || 'medium')}
                        </Row>
                        <Row label="Owner">
                            {tenant.owner_name} ({tenant.owner_email})
                        </Row>
                        <Row label="Phone">{tenant.owner_phone || '—'}</Row>
                        <Row label="Branches">
                            <UsageBar value={branchCount} max={tenant.max_branches} />
                        </Row>
                    </div>
                </SurfaceCard>

                <SurfaceCard>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            sizeForm.patch(route('platform.tenants.business-size', tenant.id), {
                                preserveScroll: true,
                            });
                        }}
                    >
                        <h2 className="text-base font-bold">Bakery size</h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Changing size applies matching presets (production batches, multi-branch, transfers).
                            You can still tweak flags below.
                        </p>
                        <div className="mt-4 flex flex-row items-end gap-3">
                            <div className="flex-1">
                                <InputLabel value="Size" />
                                <Select
                                    value={sizeForm.data.business_size}
                                    onValueChange={(value) => sizeForm.setData('business_size', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {businessSizes.map((size) => (
                                            <SelectItem key={size} value={size}>
                                                {businessSizeLabel(size)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={sizeForm.errors.business_size} />
                            </div>
                            <PrimaryButton type="submit" disabled={sizeForm.processing}>
                                Update
                            </PrimaryButton>
                        </div>
                    </form>
                </SurfaceCard>

                <SurfaceCard>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            branchesForm.patch(route('platform.tenants.max-branches', tenant.id));
                        }}
                    >
                        <h2 className="text-base font-bold">Branch limit</h2>
                        <div className="mt-4 flex flex-row items-end gap-3">
                            <div className="flex-1">
                                <InputLabel value="Max branches" />
                                <TextInput
                                    type="number"
                                    min={1}
                                    value={branchesForm.data.max_branches}
                                    onChange={(e) =>
                                        branchesForm.setData('max_branches', Number(e.target.value))
                                    }
                                />
                                <InputError message={branchesForm.errors.max_branches} />
                            </div>
                            <PrimaryButton type="submit" disabled={branchesForm.processing}>
                                Update
                            </PrimaryButton>
                        </div>
                    </form>
                </SurfaceCard>

                <SurfaceCard className="lg:col-span-full">
                    <h2 className="text-base font-bold">Feature flags</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {featureKeys.map((key) => {
                            const enabled = flagsByKey[key] ?? false;
                            return (
                                <div
                                    key={key}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                                >
                                    <div>
                                        <FeatureBadge featureKey={key} enabled={enabled} />
                                        <span className="mt-1 block text-xs text-muted-foreground">
                                            {featureLabel(key)}
                                        </span>
                                    </div>
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
                                </div>
                            );
                        })}
                    </div>
                </SurfaceCard>

                <SurfaceCard className="lg:col-span-full">
                    <h2 className="text-base font-bold">Menu availability</h2>
                    <p className="mb-4 mt-0.5 text-sm text-muted-foreground">
                        Control which stations this bakery can see at every menu level. Feature-flagged items stay
                        hidden until that module is enabled.
                    </p>
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
                        <div className="mt-4 flex justify-end">
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
                        </div>
                    )}
                </SurfaceCard>

                <SurfaceCard className="lg:col-span-full">
                    <h2 className="text-base font-bold">Users</h2>
                    <p className="mb-4 mt-0.5 text-sm text-muted-foreground">
                        Open the bakery as a staff member to see exactly what they see. Actions you take are
                        recorded as that user.
                    </p>
                    <DataTable
                        columns={[
                            { label: 'Name' },
                            { label: 'Username' },
                            { label: 'Email' },
                            { label: 'Roles' },
                            { label: '' },
                        ]}
                        emptyMessage="No users on this tenant yet."
                    >
                        {users.map((user) => (
                            <DataTableRow key={user.id}>
                                <DataTableCell className="font-semibold">{user.name}</DataTableCell>
                                <DataTableCell>{user.username || '—'}</DataTableCell>
                                <DataTableCell>{user.email}</DataTableCell>
                                <DataTableCell>
                                    {user.roles?.length
                                        ? user.roles.map((role) => roleLabel(role)).join(', ')
                                        : '—'}
                                </DataTableCell>
                                <DataTableCell>
                                    {canImpersonate ? (
                                        <ConfirmButton
                                            variant="secondary"
                                            size="small"
                                            confirmTitle="Impersonate user"
                                            confirmMessage={`View ${tenant.name} as ${user.name}? Sales and other writes will be attributed to this account.`}
                                            onConfirm={() => impersonate(user)}
                                        >
                                            Impersonate
                                        </ConfirmButton>
                                    ) : null}
                                </DataTableCell>
                            </DataTableRow>
                        ))}
                    </DataTable>
                </SurfaceCard>

                {branchSuspensions?.length > 0 && (
                    <SurfaceCard className="lg:col-span-full">
                        <h2 className="text-base font-bold">Branch suspensions</h2>
                        <ul className="mt-2 space-y-2">
                            {branchSuspensions.map((s) => (
                                <li
                                    key={s.id}
                                    className="flex items-center justify-between rounded-lg bg-surface px-4 py-3"
                                >
                                    <span>Branch ID {s.branch_id}</span>
                                    <StatusBadge status="suspended" />
                                </li>
                            ))}
                        </ul>
                    </SurfaceCard>
                )}
            </div>
        </PlatformLayout>
    );
}

function Row({ label, children }) {
    return (
        <div className="flex flex-row justify-between gap-4">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-right text-sm font-semibold">{children}</span>
        </div>
    );
}
