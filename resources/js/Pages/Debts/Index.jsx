import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDate } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const LIABILITY_TYPES = [
    { value: 'supplier_credit', label: 'Supplier credit' },
    { value: 'loan', label: 'Loan' },
    { value: 'other', label: 'Other' },
];

const selectClassName =
    'flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function Index({ liabilities, branches, filters, totals }) {
    const [payingId, setPayingId] = useState(null);

    const liabilityForm = useForm({
        type: 'supplier_credit',
        creditor_name: '',
        original_amount: '',
        due_date: '',
        branch_id: branches[0]?.id ?? '',
        notes: '',
    });

    const paymentForm = useForm({
        amount: '',
        paid_at: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    return (
        <TenantLayout title="Debts">
            <Head title="Debts" />

            <PageHeader
                title="Debts"
                description="Money the bakery owes — supplier credit, loans, and other payables."
            />

            <div className="mb-6 grid gap-6 md:grid-cols-3">
                <SurfaceCard>
                    <p className="text-xs text-muted-foreground">Open payables</p>
                    <p className="text-lg font-bold text-cocoa">
                        <Money amount={totals.payables_open} />
                    </p>
                </SurfaceCard>
            </div>

            <SurfaceCard className="mb-6">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        liabilityForm.post(route('tenant.debts.store'), {
                            onSuccess: () => liabilityForm.reset(),
                        });
                    }}
                    className="grid gap-4 lg:grid-cols-3"
                >
                    <div>
                        <InputLabel value="Type" />
                        <Select
                            value={liabilityForm.data.type}
                            onValueChange={(value) => liabilityForm.setData('type', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {LIABILITY_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <InputLabel value="Creditor" />
                        <TextInput
                            value={liabilityForm.data.creditor_name}
                            onChange={(e) =>
                                liabilityForm.setData('creditor_name', e.target.value)
                            }
                        />
                        <InputError message={liabilityForm.errors.creditor_name} />
                    </div>
                    <div>
                        <InputLabel value="Original amount (TZS)" />
                        <TextInput
                            type="number"
                            value={liabilityForm.data.original_amount}
                            onChange={(e) =>
                                liabilityForm.setData('original_amount', e.target.value)
                            }
                        />
                        <InputError message={liabilityForm.errors.original_amount} />
                    </div>
                    <div>
                        <InputLabel value="Due date" />
                        <TextInput
                            type="date"
                            value={liabilityForm.data.due_date}
                            onChange={(e) => liabilityForm.setData('due_date', e.target.value)}
                        />
                    </div>
                    {branches.length > 1 && (
                        <div>
                            <InputLabel value="Branch" />
                            <Select
                                value={String(liabilityForm.data.branch_id)}
                                onValueChange={(value) => liabilityForm.setData('branch_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {branches.map((branch) => (
                                        <SelectItem key={branch.id} value={String(branch.id)}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div>
                        <InputLabel value="Notes" />
                        <TextInput
                            value={liabilityForm.data.notes}
                            onChange={(e) => liabilityForm.setData('notes', e.target.value)}
                        />
                    </div>
                    <div className="flex items-end">
                        <PrimaryButton type="submit" className="w-full" disabled={liabilityForm.processing}>
                            Add liability
                        </PrimaryButton>
                    </div>
                </form>
            </SurfaceCard>

            <select
                className={`${selectClassName} mb-4 min-w-[160px]`}
                value={filters.status ?? 'open'}
                onChange={(e) =>
                    router.get(
                        route('tenant.debts.index'),
                        { status: e.target.value },
                        { preserveState: true, preserveScroll: true, only: ['liabilities', 'filters'] },
                    )
                }
            >
                <option value="open">Open</option>
                <option value="settled">Settled</option>
                <option value="all">All</option>
            </select>

            <DataTable
                columns={[
                    { label: 'Creditor' },
                    { label: 'Type' },
                    { label: 'Remaining' },
                    { label: 'Due' },
                    { label: 'Status' },
                    { label: '' },
                ]}
                emptyMessage="No business debts recorded."
            >
                {liabilities.data.map((liability) => (
                    <DataTableRow key={liability.id}>
                        {payingId === liability.id ? (
                            <DataTableCell colSpan={6}>
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        paymentForm.post(
                                            route('tenant.debts.payments.store', liability.id),
                                            {
                                                onSuccess: () => {
                                                    setPayingId(null);
                                                    paymentForm.reset();
                                                },
                                            },
                                        );
                                    }}
                                    className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                                >
                                    <TextInput
                                        type="number"
                                        placeholder="Amount"
                                        value={paymentForm.data.amount}
                                        onChange={(e) =>
                                            paymentForm.setData('amount', e.target.value)
                                        }
                                    />
                                    <TextInput
                                        type="date"
                                        value={paymentForm.data.paid_at}
                                        onChange={(e) =>
                                            paymentForm.setData('paid_at', e.target.value)
                                        }
                                    />
                                    <TextInput
                                        placeholder="Notes"
                                        value={paymentForm.data.notes}
                                        onChange={(e) =>
                                            paymentForm.setData('notes', e.target.value)
                                        }
                                    />
                                    <div className="flex gap-2">
                                        <PrimaryButton type="submit" size="sm">
                                            Save
                                        </PrimaryButton>
                                        <SecondaryButton type="button" size="sm" onClick={() => setPayingId(null)}>
                                            Cancel
                                        </SecondaryButton>
                                    </div>
                                    <InputError message={paymentForm.errors.amount} />
                                </form>
                            </DataTableCell>
                        ) : (
                            <>
                                <DataTableCell className="font-semibold">
                                    {liability.creditor_name}
                                </DataTableCell>
                                <DataTableCell>
                                    <StatusBadge status={liability.type} />
                                </DataTableCell>
                                <DataTableCell>
                                    <Money amount={liability.balance_remaining} />
                                </DataTableCell>
                                <DataTableCell>{formatDate(liability.due_date)}</DataTableCell>
                                <DataTableCell>
                                    <StatusBadge status={liability.status} />
                                </DataTableCell>
                                <DataTableCell>
                                    {liability.status === 'open' && (
                                        <SecondaryButton
                                            size="sm"
                                            onClick={() => {
                                                setPayingId(liability.id);
                                                paymentForm.setData(
                                                    'amount',
                                                    liability.balance_remaining,
                                                );
                                            }}
                                        >
                                            Record payment
                                        </SecondaryButton>
                                    )}
                                </DataTableCell>
                            </>
                        )}
                    </DataTableRow>
                ))}
            </DataTable>
            <Pagination links={liabilities.links} />
        </TenantLayout>
    );
}
