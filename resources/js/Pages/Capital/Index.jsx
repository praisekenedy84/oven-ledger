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
import { formatDateTime } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';
import { Box, FormControl, MenuItem, Paper, Select, Typography } from '@mui/material';
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

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                    mb: 3,
                }}
            >
                {[
                    { label: 'Capital in', value: totals.capital_in },
                    { label: 'Drawings', value: totals.drawings },
                    { label: 'Still in the business', value: totals.capital_remaining },
                ].map((card) => (
                    <Paper key={card.label} variant="outlined" sx={{ p: 3, borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            {card.label}
                        </Typography>
                        <Typography variant="h6" fontWeight={700} sx={{ color: colors.cocoa }}>
                            <Money amount={card.value} />
                        </Typography>
                    </Paper>
                ))}
            </Box>

            <Paper
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    ownerForm.post(route('tenant.capital.store'), {
                        onSuccess: () => ownerForm.reset('amount', 'notes'),
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
                            value={ownerForm.data.type}
                            onChange={(e) => ownerForm.setData('type', e.target.value)}
                        >
                            <MenuItem value="capital_injection">Capital in</MenuItem>
                            <MenuItem value="drawing">Drawing</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Box>
                    <InputLabel value="Amount (TZS)" />
                    <TextInput
                        type="number"
                        value={ownerForm.data.amount}
                        onChange={(e) => ownerForm.setData('amount', e.target.value)}
                    />
                    <InputError message={ownerForm.errors.amount} />
                </Box>
                <Box>
                    <InputLabel value="Date" />
                    <TextInput
                        type="date"
                        value={ownerForm.data.transacted_at}
                        onChange={(e) => ownerForm.setData('transacted_at', e.target.value)}
                    />
                </Box>
                <Box>
                    <InputLabel value="Notes" />
                    <TextInput
                        value={ownerForm.data.notes}
                        onChange={(e) => ownerForm.setData('notes', e.target.value)}
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <PrimaryButton type="submit" fullWidth disabled={ownerForm.processing}>
                        Record
                    </PrimaryButton>
                </Box>
            </Paper>

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
                        <DataTableCell sx={{ fontWeight: 600 }}>
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
