import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PlatformLayout from '@/Layouts/PlatformLayout';
import { formatDateTime } from '@/lib/format';
import { Head } from '@inertiajs/react';

export default function Index({ logs }) {
    return (
        <PlatformLayout title="Audit Log">
            <Head title="Audit Log" />

            <PageHeader
                title="Audit log"
                description="Platform admin actions across all tenants."
            />

            <DataTable
                columns={[
                    { label: 'When' },
                    { label: 'Admin' },
                    { label: 'Action' },
                    { label: 'Target' },
                    { label: 'Details' },
                ]}
            >
                {logs.data.map((log) => (
                    <DataTableRow key={log.id}>
                        <DataTableCell className="whitespace-nowrap text-muted-foreground">
                            {formatDateTime(log.created_at)}
                        </DataTableCell>
                        <DataTableCell>{log.platform_admin?.name ?? '—'}</DataTableCell>
                        <DataTableCell className="font-mono text-xs">
                            {log.action}
                        </DataTableCell>
                        <DataTableCell className="text-xs text-muted-foreground">
                            {log.target_type ? `${log.target_type} #${log.target_id}` : '—'}
                        </DataTableCell>
                        <DataTableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                            {log.meta ? JSON.stringify(log.meta) : '—'}
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>

            <Pagination links={logs.links} />
        </PlatformLayout>
    );
}
