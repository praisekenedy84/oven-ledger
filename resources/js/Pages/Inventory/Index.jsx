import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import RawMaterialLifecycleTable from '@/Components/RawMaterialLifecycleTable';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatQuantity } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';
import {
    Box,
    Button,
    FormControl,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { Head, Link, router, useForm } from '@inertiajs/react';

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

function todayInput() {
    return new Date().toISOString().slice(0, 10);
}

export default function Index({
    rawMaterialStock,
    finishedGoodsStock,
    products,
    rawMaterials = [],
    movements,
    filters = {},
}) {
    const wasteForm = useForm({
        product_id: products[0]?.id ?? '',
        quantity: '',
        reason: 'expired',
    });

    const restockForm = useForm({
        raw_material_id: rawMaterials[0]?.id ?? '',
        quantity: '',
        unit_cost: rawMaterials[0]?.unit_cost ?? '',
        occurred_at: todayInput(),
        notes: '',
    });

    const rawWasteForm = useForm({
        raw_material_id: rawMaterials[0]?.id ?? '',
        quantity: '',
        reason: 'expired',
        occurred_at: todayInput(),
        notes: '',
    });

    const rawAlerts = rawMaterialStock.filter(isRawLow);
    const finishedAlerts = finishedGoodsStock.filter(isFinishedLow);
    const selectedRestock = rawMaterials.find(
        (item) => String(item.id) === String(restockForm.data.raw_material_id),
    );

    return (
        <TenantLayout title="Inventory">
            <Head title="Inventory" />

            <PageHeader
                eyebrow="Stock"
                title="Inventory"
                description="Receive raw materials, watch them move through production, and keep a running on-hand trail."
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
                            { label: '' },
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
                                        {formatQuantity(row.quantity_on_hand)}{' '}
                                        {row.raw_material?.unit_of_measure}
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
                                    <DataTableCell>
                                        {row.raw_material_id && (
                                            <Button
                                                component={Link}
                                                href={route('tenant.raw-materials.show', row.raw_material_id)}
                                                size="small"
                                            >
                                                History
                                            </Button>
                                        )}
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
                                        {formatQuantity(row.quantity_on_hand)} {row.product?.unit_of_measure}
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

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                    mt: 4,
                }}
            >
                <SurfaceCard
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        restockForm.post(route('tenant.inventory.restock'), {
                            preserveScroll: true,
                            onSuccess: () => restockForm.reset('quantity', 'notes'),
                        });
                    }}
                    sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    }}
                >
                    <Typography variant="h6" sx={{ gridColumn: '1 / -1' }}>
                        Restock raw materials
                    </Typography>
                    <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                        <InputLabel value="Material" />
                        <FormControl fullWidth size="small">
                            <Select
                                value={restockForm.data.raw_material_id}
                                onChange={(e) => {
                                    const next = rawMaterials.find(
                                        (item) => String(item.id) === String(e.target.value),
                                    );
                                    restockForm.setData({
                                        ...restockForm.data,
                                        raw_material_id: e.target.value,
                                        unit_cost: next?.unit_cost ?? '',
                                    });
                                }}
                            >
                                {rawMaterials.map((item) => (
                                    <MenuItem key={item.id} value={item.id}>
                                        {item.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <InputError message={restockForm.errors.raw_material_id} />
                    </Box>
                    <Box>
                        <InputLabel value={`Quantity${selectedRestock ? ` (${selectedRestock.unit_of_measure})` : ''}`} />
                        <TextInput
                            type="number"
                            inputProps={{ min: 0, step: '0.001' }}
                            value={restockForm.data.quantity}
                            onChange={(e) => restockForm.setData('quantity', e.target.value)}
                        />
                        <InputError message={restockForm.errors.quantity} />
                    </Box>
                    <Box>
                        <InputLabel value="Price per unit (TZS)" />
                        <TextInput
                            type="number"
                            inputProps={{ min: 0, step: '1' }}
                            value={restockForm.data.unit_cost}
                            onChange={(e) => restockForm.setData('unit_cost', e.target.value)}
                        />
                    </Box>
                    <Box>
                        <InputLabel value="Received on" />
                        <TextInput
                            type="date"
                            value={restockForm.data.occurred_at}
                            onChange={(e) => restockForm.setData('occurred_at', e.target.value)}
                        />
                    </Box>
                    <Box>
                        <InputLabel value="Notes" />
                        <TextInput
                            value={restockForm.data.notes}
                            onChange={(e) => restockForm.setData('notes', e.target.value)}
                            placeholder="Supplier, bag count…"
                        />
                    </Box>
                    <Box sx={{ gridColumn: '1 / -1' }}>
                        <PrimaryButton type="submit" disabled={restockForm.processing || rawMaterials.length === 0}>
                            Record restock
                        </PrimaryButton>
                    </Box>
                </SurfaceCard>

                <SurfaceCard
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        rawWasteForm.post(route('tenant.inventory.raw-waste'), {
                            preserveScroll: true,
                            onSuccess: () => rawWasteForm.reset('quantity', 'notes'),
                        });
                    }}
                    sx={{
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    }}
                >
                    <Typography variant="h6" sx={{ gridColumn: '1 / -1' }}>
                        Write off raw materials
                    </Typography>
                    <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                        <InputLabel value="Material" />
                        <FormControl fullWidth size="small">
                            <Select
                                value={rawWasteForm.data.raw_material_id}
                                onChange={(e) => rawWasteForm.setData('raw_material_id', e.target.value)}
                            >
                                {rawMaterials.map((item) => (
                                    <MenuItem key={item.id} value={item.id}>
                                        {item.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <InputError message={rawWasteForm.errors.raw_material_id} />
                    </Box>
                    <Box>
                        <InputLabel value="Quantity" />
                        <TextInput
                            type="number"
                            inputProps={{ min: 0, step: '0.001' }}
                            value={rawWasteForm.data.quantity}
                            onChange={(e) => rawWasteForm.setData('quantity', e.target.value)}
                        />
                        <InputError message={rawWasteForm.errors.quantity} />
                    </Box>
                    <Box>
                        <InputLabel value="Reason" />
                        <FormControl fullWidth size="small">
                            <Select
                                value={rawWasteForm.data.reason}
                                onChange={(e) => rawWasteForm.setData('reason', e.target.value)}
                            >
                                <MenuItem value="expired">Expired</MenuItem>
                                <MenuItem value="damaged">Damaged</MenuItem>
                                <MenuItem value="spillage">Spillage</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ gridColumn: '1 / -1' }}>
                        <InputLabel value="Notes" />
                        <TextInput
                            value={rawWasteForm.data.notes}
                            onChange={(e) => rawWasteForm.setData('notes', e.target.value)}
                        />
                    </Box>
                    <Box sx={{ gridColumn: '1 / -1' }}>
                        <PrimaryButton type="submit" disabled={rawWasteForm.processing || rawMaterials.length === 0}>
                            Log raw waste
                        </PrimaryButton>
                    </Box>
                </SurfaceCard>
            </Box>

            <Box sx={{ mt: 4 }}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={2}
                    alignItems={{ xs: 'stretch', sm: 'center' }}
                    justifyContent="space-between"
                    sx={{ mb: 1.5 }}
                >
                    <Typography variant="h6">Raw material lifecycle</Typography>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <Select
                            displayEmpty
                            value={filters.raw_material_id ?? ''}
                            onChange={(e) =>
                                router.get(
                                    route('tenant.inventory.index'),
                                    { raw_material_id: e.target.value || undefined },
                                    { preserveState: true, replace: true },
                                )
                            }
                        >
                            <MenuItem value="">All materials</MenuItem>
                            {rawMaterials.map((item) => (
                                <MenuItem key={item.id} value={item.id}>
                                    {item.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
                <RawMaterialLifecycleTable movements={movements} showMaterial />
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
                    Log finished-goods waste
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
