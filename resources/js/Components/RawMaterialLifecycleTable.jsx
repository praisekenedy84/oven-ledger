import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import { formatDateTime, formatQuantity } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';

const TYPE_LABELS = {
    restock: 'Restock',
    production: 'Used in bake',
    waste: 'Waste',
    opening: 'Opening',
};

export default function RawMaterialLifecycleTable({
    movements,
    showMaterial = false,
    emptyMessage = 'No restocks or usage recorded yet.',
}) {
    const columns = [
        { label: 'When' },
        ...(showMaterial ? [{ label: 'Material' }] : []),
        { label: 'Type' },
        { label: 'Change' },
        { label: 'On hand after' },
        { label: 'Buy-in' },
        { label: 'Notes' },
    ];

    return (
        <>
            <DataTable columns={columns} emptyMessage={emptyMessage}>
                {(movements.data ?? []).map((row) => {
                    const change = Number(row.quantity) || 0;
                    const inbound = change > 0;

                    return (
                        <DataTableRow key={row.id}>
                            <DataTableCell>{formatDateTime(row.occurred_at)}</DataTableCell>
                            {showMaterial && (
                                <DataTableCell sx={{ fontWeight: 600 }}>
                                    {row.raw_material?.name ?? '—'}
                                </DataTableCell>
                            )}
                            <DataTableCell>
                                <StatusBadge
                                    status={row.type}
                                    label={TYPE_LABELS[row.type] ?? row.type}
                                />
                            </DataTableCell>
                            <DataTableCell
                                sx={{
                                    fontWeight: 700,
                                    color: inbound ? colors.sage : colors.jam,
                                }}
                            >
                                {inbound ? '+' : ''}
                                {formatQuantity(change)}
                                {row.raw_material?.unit_of_measure
                                    ? ` ${row.raw_material.unit_of_measure}`
                                    : ''}
                            </DataTableCell>
                            <DataTableCell sx={{ fontWeight: 600 }}>
                                {formatQuantity(row.quantity_after)}
                                {row.raw_material?.unit_of_measure
                                    ? ` ${row.raw_material.unit_of_measure}`
                                    : ''}
                            </DataTableCell>
                            <DataTableCell>
                                {row.unit_cost ? <Money amount={row.unit_cost} /> : '—'}
                            </DataTableCell>
                            <DataTableCell>{row.notes || '—'}</DataTableCell>
                        </DataTableRow>
                    );
                })}
            </DataTable>
            <Pagination links={movements.links} />
        </>
    );
}
