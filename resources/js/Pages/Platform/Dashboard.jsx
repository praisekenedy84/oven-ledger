import BalanceCard from '@/Components/bencho/BalanceCard';
import PageHeader from '@/Components/PageHeader';
import { MotionItem, MotionStagger } from '@/Components/smoothui/MotionRise';
import { Card, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import PlatformLayout from '@/Layouts/PlatformLayout';
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

            <MotionStagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MotionItem>
                    <BalanceCard label="Total Tenants" value={stats.tenants_total} format="number" />
                </MotionItem>
                <MotionItem>
                    <BalanceCard
                        label="Active"
                        value={stats.tenants_active}
                        format="number"
                        delta={0}
                        deltaLabel="healthy"
                    />
                </MotionItem>
                <MotionItem>
                    <BalanceCard
                        label="Suspended"
                        value={stats.tenants_suspended}
                        format="number"
                        delta={stats.tenants_suspended > 0 ? -stats.tenants_suspended : 0}
                        deltaLabel="need attention"
                    />
                </MotionItem>
            </MotionStagger>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link href={route('platform.tenants.index')} className="no-underline">
                    <Card className="transition-colors hover:bg-muted/40">
                        <CardHeader>
                            <CardTitle>Manage Tenants</CardTitle>
                            <CardDescription>View, provision, and configure bakery tenants.</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href={route('platform.audit.index')} className="no-underline">
                    <Card className="transition-colors hover:bg-muted/40">
                        <CardHeader>
                            <CardTitle>Audit Log</CardTitle>
                            <CardDescription>Review platform admin actions across tenants.</CardDescription>
                        </CardHeader>
                    </Card>
                </Link>
            </div>
        </PlatformLayout>
    );
}
