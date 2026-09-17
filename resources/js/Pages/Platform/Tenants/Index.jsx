import ConfirmButton from '@/Components/ConfirmButton';
import FeatureBadge from '@/Components/FeatureBadge';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import UsageBar from '@/Components/UsageBar';
import { Button } from '@/Components/ui/button';
import { Switch } from '@/Components/ui/switch';
import PlatformLayout from '@/Layouts/PlatformLayout';
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
                    <Button asChild>
                        <Link href={route('platform.tenants.create')}>New tenant</Link>
                    </Button>
                }
            />

            <div className="space-y-4">
                {tenants.data.map((tenant) => {
                    const flags = Object.fromEntries(
                        (tenant.feature_flags ?? tenant.featureFlags ?? []).map((f) => [
                            f.feature_key,
                            f.enabled,
                        ]),
                    );

                    return (
                        <SurfaceCard key={tenant.id} className="p-5">
                            <div className="grid items-center gap-4 lg:grid-cols-[minmax(0,1.3fr)_180px_minmax(0,1.4fr)_auto]">
                                <div>
                                    <div className="flex flex-row items-center gap-2">
                                        <h2 className="text-lg font-semibold">{tenant.name}</h2>
                                        <StatusBadge status={tenant.status} />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {tenant.owner_name} · {tenant.owner_email}
                                    </p>
                                </div>

                                <UsageBar
                                    value={tenant.branch_count ?? 0}
                                    max={tenant.max_branches}
                                    label="Branch usage"
                                />

                                <div className="grid gap-2 sm:grid-cols-3">
                                    {featureKeys.map((key) => {
                                        const enabled = Boolean(flags[key]);
                                        return (
                                            <div
                                                key={key}
                                                className="flex flex-row items-center justify-between gap-1 rounded-[10px] border border-border bg-wheat-light px-2 py-1"
                                            >
                                                <FeatureBadge featureKey={key} enabled={enabled} />
                                                <Switch
                                                    checked={enabled}
                                                    onCheckedChange={(next) =>
                                                        toggleFeature(tenant, key, next)
                                                    }
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-row justify-end gap-2">
                                    <Button size="sm" variant="ghost" asChild>
                                        <Link href={route('platform.tenants.show', tenant.id)}>Open</Link>
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
                                </div>
                            </div>
                        </SurfaceCard>
                    );
                })}
            </div>

            <Pagination links={tenants.links} />
        </PlatformLayout>
    );
}
