import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import { colors } from '@/theme/bakeryTheme';
import {
    Box,
    FormControl,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { Head, useForm } from '@inertiajs/react';

function isRawLow(row) {
    const qty = Number(row.quantity_on_hand) || 0;
    const threshold = row.raw_material?.reorder_threshold;
    if (threshold == null) {
        return qty <= 0;
    }
    return qty <= Number(threshold);
}

function isFinishedLow(row) {
    return (Number(row.quantity_on_hand) || 0) <= 8;
}

export default function Index({ rawMaterialStock, finishedGoodsStock, products }) {
    const wasteForm = useForm({
        product_id: products[0]?.id ?? '',
        quantity: '',
        reason: 'expired',
    });

    const rawAlerts = rawMaterialStock.filter(isRawLow);
    const finishedAlerts = finishedGoodsStock.filter(isFinishedLow);

    return (
        <TenantLayout title="Inventory">
            <Head title="Inventory" />

            <PageHeader
                eyebrow="Stock"
                title="Inventory"
                description="Raw materials and finished goods for this branch, with reorder lines called out."
            />

            {(rawAlerts.length > 0 || finishedAlerts.length > 0) && (
                <SurfaceCard sx={{ mb: 3, borderColor: colors.butter, bgcolor: `${colors.butter}14` }}>
                    <Typography variant="overline" sx={{ color: '#8A6410' }}>
                        Reorder alerts
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>
                        {rawAlerts.length + finishedAlerts.length} items under the line
                    </Typography>
                    <Stack spacing={0.75}>
                        {[...rawAlerts, ...finishedAlerts].map((row) => (
                            <Typography key={row.id} variant="body2">
                                {(row.raw_material?.name || row.product?.name)} — {row.quantity_on_hand}{' '}
                                {row.raw_material?.unit_of_measure || row.product?.unit_of_measure}
                            </Typography>
                        ))}
                    </Stack>
                </SurfaceCard>
            )}

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                }}
            >
                <Box>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>
                        Raw materials
                    </Typography>
                    <DataTable
                        columns={[
                            { label: 'Material' },
                            { label: 'On hand' },
                            { label: 'Reorder' },
                            { label: 'Status' },
                        ]}
                        emptyMessage="No raw material stock recorded."
                    >
                        {rawMaterialStock.map((row) => {
                            const low = isRawLow(row);
                            return (
                                <DataTableRow
                                    key={row.id}
                                    sx={low ? { bgcolor: `${colors.jam}0d` } : undefined}
                                >
                                    <DataTableCell sx={{ fontWeight: 600 }}>
                                        {row.raw_material?.name}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {row.quantity_on_hand} {row.raw_material?.unit_of_measure}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {row.raw_material?.reorder_threshold ?? '—'}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <StatusBadge
                                            status={low ? 'open' : 'ready'}
                                            label={low ? 'Reorder' : 'OK'}
                                        />
                                    </DataTableCell>
                                </DataTableRow>
                            );
                        })}
                    </DataTable>
                </Box>

                <Box>
                    <Typography variant="h6" sx={{ mb: 1.5 }}>
                        Finished goods
                    </Typography>
                    <DataTable
                        columns={[
                            { label: 'Product' },
                            { label: 'On hand' },
                            { label: 'Status' },
                        ]}
                        emptyMessage="No finished goods in stock."
                    >
                        {finishedGoodsStock.map((row) => {
                            const low = isFinishedLow(row);
                            return (
                                <DataTableRow
                                    key={row.id}
                                    sx={low ? { bgcolor: `${colors.jam}0d` } : undefined}
                                >
                                    <DataTableCell sx={{ fontWeight: 600 }}>
                                        {row.product?.name}
                                    </DataTableCell>
                                    <DataTableCell>
                                        {row.quantity_on_hand} {row.product?.unit_of_measure}
                                    </DataTableCell>
                                    <DataTableCell>
                                        <StatusBadge
                                            status={low ? 'open' : 'ready'}
                                            label={low ? 'Low' : 'OK'}
                                        />
                                    </DataTableCell>
                                </DataTableRow>
                            );
                        })}
                    </DataTable>
                </Box>
            </Box>

            <SurfaceCard
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    wasteForm.post(route('tenant.inventory.waste'), {
                        onSuccess: () => wasteForm.reset('quantity'),
                    });
                }}
                sx={{
                    mt: 4,
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' },
                }}
            >
                <Typography variant="h6" sx={{ gridColumn: '1 / -1' }}>
                    Log waste
                </Typography>
                <Box>
                    <InputLabel value="Product" />
                    <FormControl fullWidth size="small">
                        <Select
                            value={wasteForm.data.product_id}
                            onChange={(e) => wasteForm.setData('product_id', e.target.value)}
                        >
                            {products.map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <InputError message={wasteForm.errors.product_id} />
                </Box>
                <Box>
                    <InputLabel value="Quantity" />
                    <TextInput
                        type="number"
                        inputProps={{ step: '0.001' }}
                        value={wasteForm.data.quantity}
                        onChange={(e) => wasteForm.setData('quantity', e.target.value)}
                    />
                    <InputError message={wasteForm.errors.quantity} />
                </Box>
                <Box>
                    <InputLabel value="Reason" />
                    <FormControl fullWidth size="small">
                        <Select
                            value={wasteForm.data.reason}
                            onChange={(e) => wasteForm.setData('reason', e.target.value)}
                        >
                            <MenuItem value="expired">Expired</MenuItem>
                            <MenuItem value="damaged">Damaged</MenuItem>
                            <MenuItem value="given_away">Given away</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                    <PrimaryButton type="submit" disabled={wasteForm.processing}>
                        Log waste
                    </PrimaryButton>
                </Box>
            </SurfaceCard>
        </TenantLayout>
    );
}
