import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDate } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';
import { Box, Button, FormControl, MenuItem, Paper, Select, Stack, Typography } from '@mui/material';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const LIABILITY_TYPES = [
    { value: 'supplier_credit', label: 'Supplier credit' },
    { value: 'loan', label: 'Loan' },
    { value: 'other', label: 'Other' },
];

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

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                    mb: 3,
                }}
            >
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        Open payables
                    </Typography>
                    <Typography variant="h6" fontWeight={700} sx={{ color: colors.cocoa }}>
                        <Money amount={totals.payables_open} />
                    </Typography>
                </Paper>
            </Box>

            <Paper
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    liabilityForm.post(route('tenant.debts.store'), {
                        onSuccess: () => liabilityForm.reset(),
                    });
                }}
                variant="outlined"
                sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 1,
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
                }}
            >
                <Box>
                    <InputLabel value="Type" />
                    <FormControl fullWidth size="small">
                        <Select
                            value={liabilityForm.data.type}
                            onChange={(e) => liabilityForm.setData('type', e.target.value)}
                        >
                            {LIABILITY_TYPES.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
                <Box>
                    <InputLabel value="Creditor" />
                    <TextInput
                        value={liabilityForm.data.creditor_name}
                        onChange={(e) =>
                            liabilityForm.setData('creditor_name', e.target.value)
                        }
                    />
                    <InputError message={liabilityForm.errors.creditor_name} />
                </Box>
                <Box>
                    <InputLabel value="Original amount (TZS)" />
                    <TextInput
                        type="number"
                        value={liabilityForm.data.original_amount}
                        onChange={(e) =>
                            liabilityForm.setData('original_amount', e.target.value)
                        }
                    />
                    <InputError message={liabilityForm.errors.original_amount} />
                </Box>
                <Box>
                    <InputLabel value="Due date" />
                    <TextInput
                        type="date"
                        value={liabilityForm.data.due_date}
                        onChange={(e) => liabilityForm.setData('due_date', e.target.value)}
                    />
                </Box>
                {branches.length > 1 && (
                    <Box>
                        <InputLabel value="Branch" />
                        <FormControl fullWidth size="small">
                            <Select
                                value={liabilityForm.data.branch_id}
                                onChange={(e) =>
                                    liabilityForm.setData('branch_id', e.target.value)
                                }
                            >
                                {branches.map((branch) => (
                                    <MenuItem key={branch.id} value={branch.id}>
                                        {branch.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                )}
                <Box>
                    <InputLabel value="Notes" />
                    <TextInput
                        value={liabilityForm.data.notes}
                        onChange={(e) => liabilityForm.setData('notes', e.target.value)}
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <PrimaryButton type="submit" fullWidth disabled={liabilityForm.processing}>
                        Add liability
                    </PrimaryButton>
                </Box>
            </Paper>

            <FormControl size="small" sx={{ mb: 2, minWidth: 160 }}>
                <Select
                    value={filters.status ?? 'open'}
                    onChange={(e) =>
                        router.get(
                            route('tenant.debts.index'),
                            { status: e.target.value },
                            { preserveState: true, preserveScroll: true, only: ['liabilities', 'filters'] },
                        )
                    }
                >
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="settled">Settled</MenuItem>
                    <MenuItem value="all">All</MenuItem>
                </Select>
            </FormControl>

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
                                <Box
                                    component="form"
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
                                    sx={{
                                        display: 'grid',
                                        gap: 1.5,
                                        gridTemplateColumns: {
                                            xs: '1fr',
                                            md: '1fr 1fr 1fr auto',
                                        },
                                    }}
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
                                    <Stack direction="row" spacing={1}>
                                        <PrimaryButton type="submit" size="small">
                                            Save
                                        </PrimaryButton>
                                        <Button size="small" onClick={() => setPayingId(null)}>
                                            Cancel
                                        </Button>
                                    </Stack>
                                    <InputError message={paymentForm.errors.amount} />
                                </Box>
                            </DataTableCell>
                        ) : (
                            <>
                                <DataTableCell sx={{ fontWeight: 600 }}>
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
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                setPayingId(liability.id);
                                                paymentForm.setData(
                                                    'amount',
                                                    liability.balance_remaining,
                                                );
                                            }}
                                        >
                                            Record payment
                                        </Button>
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
