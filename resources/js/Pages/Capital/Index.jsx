import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDateTime } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';

export default function Index({ ownerTransactions, totals }) {
    const ownerForm = useForm({
        type: 'capital_injection',
        amount: '',
        transacted_at: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    return (
        <TenantLayout title="Capital">
            <Head title="Capital" />

            <PageHeader
                title="Capital"
                description="Money the owner put into the bakery, and drawings taken out."
            />

            <div className="mb-6 grid gap-6 md:grid-cols-3">
                {[
                    { label: 'Capital in', value: totals.capital_in },
                    { label: 'Drawings', value: totals.drawings },
                    { label: 'Still in the business', value: totals.capital_remaining },
                ].map((card) => (
                    <SurfaceCard key={card.label}>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className="text-lg font-bold text-cocoa">
                            <Money amount={card.value} />
                        </p>
                    </SurfaceCard>
                ))}
            </div>

            <SurfaceCard className="mb-6">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        ownerForm.post(route('tenant.capital.store'), {
                            onSuccess: () => ownerForm.reset('amount', 'notes'),
                        });
                    }}
                    className="grid gap-4 lg:grid-cols-3"
                >
                    <div>
                        <InputLabel value="Type" />
                        <Select
                            value={ownerForm.data.type}
                            onValueChange={(value) => ownerForm.setData('type', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="capital_injection">Capital in</SelectItem>
                                <SelectItem value="drawing">Drawing</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <InputLabel value="Amount (TZS)" />
                        <TextInput
                            type="number"
                            value={ownerForm.data.amount}
                            onChange={(e) => ownerForm.setData('amount', e.target.value)}
                        />
                        <InputError message={ownerForm.errors.amount} />
                    </div>
                    <div>
                        <InputLabel value="Date" />
                        <TextInput
                            type="date"
                            value={ownerForm.data.transacted_at}
                            onChange={(e) => ownerForm.setData('transacted_at', e.target.value)}
                        />
                    </div>
                    <div>
                        <InputLabel value="Notes" />
                        <TextInput
                            value={ownerForm.data.notes}
                            onChange={(e) => ownerForm.setData('notes', e.target.value)}
                        />
                    </div>
                    <div className="flex items-end">
                        <PrimaryButton type="submit" className="w-full" disabled={ownerForm.processing}>
                            Record
                        </PrimaryButton>
                    </div>
                </form>
            </SurfaceCard>

            <DataTable
                columns={[
                    { label: 'Date' },
                    { label: 'Type' },
                    { label: 'Amount' },
                    { label: 'Notes' },
                ]}
                emptyMessage="No owner capital movements yet."
            >
                {ownerTransactions.data.map((row) => (
                    <DataTableRow key={row.id}>
                        <DataTableCell>{formatDateTime(row.transacted_at)}</DataTableCell>
                        <DataTableCell>
                            <StatusBadge status={row.type} />
                        </DataTableCell>
                        <DataTableCell className="font-semibold">
                            <Money amount={row.amount} />
                        </DataTableCell>
                        <DataTableCell>{row.notes || '—'}</DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>
            <Pagination links={ownerTransactions.links} />
        </TenantLayout>
    );
}
