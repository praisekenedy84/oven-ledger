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
                        <DataTableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                            {formatDateTime(log.created_at)}
                        </DataTableCell>
                        <DataTableCell>{log.platform_admin?.name ?? '—'}</DataTableCell>
                        <DataTableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                            {log.action}
                        </DataTableCell>
                        <DataTableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                            {log.target_type ? `${log.target_type} #${log.target_id}` : '—'}
                        </DataTableCell>
                        <DataTableCell
                            sx={{
                                maxWidth: 280,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: 12,
                                color: 'text.secondary',
                            }}
                        >
                            {log.meta ? JSON.stringify(log.meta) : '—'}
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>

            <Pagination links={logs.links} />
        </PlatformLayout>
    );
}
