import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import RawMaterialLifecycleTable from '@/Components/RawMaterialLifecycleTable';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatQuantity } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';
import { Box, Paper, Typography } from '@mui/material';
import { Head, useForm } from '@inertiajs/react';

function todayInput() {
    return new Date().toISOString().slice(0, 10);
}

export default function Show({ rawMaterial, movements }) {
    const restockForm = useForm({
        raw_material_id: rawMaterial.id,
        quantity: '',
        unit_cost: rawMaterial.unit_cost ?? '',
        occurred_at: todayInput(),
        notes: '',
    });

    return (
        <TenantLayout title={rawMaterial.name}>
            <Head title={rawMaterial.name} />

            <PageHeader
                eyebrow="Raw material"
                title={rawMaterial.name}
                description="Every restock, bake, and write-off for this ingredient at the current branch."
                backHref={route('tenant.raw-materials.index')}
            />

            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                    mb: 3,
                }}
            >
                {[
                    {
                        label: 'On hand',
                        value: `${formatQuantity(rawMaterial.quantity_on_hand)} ${rawMaterial.unit_of_measure}`,
                    },
                    {
                        label: 'Reorder at',
                        value: rawMaterial.reorder_threshold ?? '—',
                    },
                    {
                        label: 'Price per unit',
                        value: rawMaterial.unit_cost ? <Money amount={rawMaterial.unit_cost} /> : '—',
                    },
                ].map((card) => (
                    <Paper key={card.label} variant="outlined" sx={{ p: 3, borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            {card.label}
                        </Typography>
                        <Typography variant="h6" fontWeight={700} sx={{ color: colors.cocoa }}>
                            {card.value}
                        </Typography>
                    </Paper>
                ))}
            </Box>

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
                    mb: 4,
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                }}
            >
                <Typography variant="h6" sx={{ gridColumn: '1 / -1' }}>
                    Restock
                </Typography>
                <Box>
                    <InputLabel value={`Quantity (${rawMaterial.unit_of_measure})`} />
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
                <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                    <InputLabel value="Notes" />
                    <TextInput
                        value={restockForm.data.notes}
                        onChange={(e) => restockForm.setData('notes', e.target.value)}
                        placeholder="Supplier, invoice, bag count…"
                    />
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                    <PrimaryButton type="submit" disabled={restockForm.processing}>
                        Record restock
                    </PrimaryButton>
                </Box>
            </SurfaceCard>

            <Typography variant="h6" sx={{ mb: 1.5 }}>
                Lifecycle
            </Typography>
            <RawMaterialLifecycleTable
                movements={movements}
                emptyMessage="No restocks or usage yet for this material."
            />
        </TenantLayout>
    );
}
