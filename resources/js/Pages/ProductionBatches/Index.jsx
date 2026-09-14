import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatDate } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

const NEXT_STATUS = {
    planned: 'baking',
    baking: 'cooling',
    cooling: 'ready',
    ready: 'dispatched',
};

const COLUMNS = [
    { key: 'baking', label: 'Baking', accent: colors.jam },
    { key: 'cooling', label: 'Cooling', accent: colors.butter },
    { key: 'ready', label: 'Ready', accent: colors.sage },
];

export default function Index({ batches, products }) {
    const createForm = useForm({
        product_id: products[0]?.id ?? '',
        planned_quantity: '',
        expiry_date: '',
    });

    const selectedProduct = products.find(
        (product) => String(product.id) === String(createForm.data.product_id),
    );

    const [qtyDialog, setQtyDialog] = useState({ open: false, batch: null, status: null, quantity: '' });

    const transition = (batch, status) => {
        if (status === 'ready' || status === 'dispatched') {
            setQtyDialog({
                open: true,
                batch,
                status,
                quantity: batch.actual_quantity ?? batch.planned_quantity ?? '',
            });
            return;
        }

        router.patch(route('tenant.production-batches.transition', batch.id), { status }, {
            preserveScroll: true,
        });
    };

    const confirmQuantity = () => {
        if (!qtyDialog.batch || !qtyDialog.status) {
            return;
        }

        router.patch(
            route('tenant.production-batches.transition', qtyDialog.batch.id),
            {
                status: qtyDialog.status,
                actual_quantity: qtyDialog.quantity || null,
            },
            { preserveScroll: true },
        );
        setQtyDialog({ open: false, batch: null, status: null, quantity: '' });
    };

    const rows = batches.data ?? [];
    const board = Object.fromEntries(
        COLUMNS.map((col) => [col.key, rows.filter((batch) => batch.status === col.key)]),
    );
    const queued = rows.filter((batch) => !['baking', 'cooling', 'ready'].includes(batch.status));

    return (
        <TenantLayout title="Production">
            <Head title="Production" />

            <PageHeader
                eyebrow="Floor"
                title="Production planning"
                description="Schedule a batch, then walk it from oven to cooling rack to the ready shelf."
            />

            <SurfaceCard
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    createForm.post(route('tenant.production-batches.store'), {
                        onSuccess: () => createForm.reset('planned_quantity', 'expiry_date'),
                    });
                }}
                sx={{
                    mb: 3,
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
                }}
            >
                <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="h6">Schedule a batch</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Pick what is on the floor. The recipe and batch number are assigned automatically.
                    </Typography>
                </Box>
                <Box>
                    <InputLabel value="Product" />
                    <FormControl fullWidth size="small">
                        <Select
                            value={createForm.data.product_id}
                            onChange={(e) => createForm.setData('product_id', e.target.value)}
                        >
                            {products.map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <InputError message={createForm.errors.product_id} />
                    {selectedProduct?.recipe?.expected_yield && (
                        <Typography variant="caption" color="text.secondary">
                            Recipe yield {selectedProduct.recipe.expected_yield}
                        </Typography>
                    )}
                </Box>
                <Box>
                    <InputLabel value="Planned quantity" />
                    <TextInput
                        type="number"
                        inputProps={{ step: '0.001' }}
                        value={createForm.data.planned_quantity}
                        onChange={(e) => createForm.setData('planned_quantity', e.target.value)}
                    />
                </Box>
                <Box>
                    <InputLabel value="Expiry date" />
                    <TextInput
                        type="date"
                        value={createForm.data.expiry_date}
                        onChange={(e) => createForm.setData('expiry_date', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
                    <PrimaryButton type="submit" fullWidth disabled={createForm.processing}>
                        Schedule batch
                    </PrimaryButton>
                </Box>
            </SurfaceCard>

            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
                    mb: 3,
                }}
            >
                {COLUMNS.map((col) => (
                    <SurfaceCard key={col.key} sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography variant="overline" sx={{ color: col.accent }}>
                                {col.label}
                            </Typography>
                            <Typography variant="caption" fontWeight={700}>
                                {board[col.key].length}
                            </Typography>
                        </Stack>
                        <Stack spacing={1.25}>
                            {board[col.key].length === 0 && (
                                <Typography variant="body2" color="text.secondary">
                                    None {col.label.toLowerCase()}.
                                </Typography>
                            )}
                            {board[col.key].map((batch) => {
                                const next = NEXT_STATUS[batch.status];
                                return (
                                    <Box
                                        key={batch.id}
                                        sx={{
                                            p: 1.5,
                                            borderRadius: '10px',
                                            border: `1px solid ${colors.border}`,
                                            bgcolor: colors.wheatLight,
                                        }}
                                    >
                                        <Typography variant="subtitle2">{batch.product?.name}</Typography>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            #{batch.batch_number} · {batch.planned_quantity}
                                            {batch.actual_quantity ? ` actual ${batch.actual_quantity}` : ''}
                                        </Typography>
                                        {next && (
                                            <SecondaryButton
                                                size="small"
                                                onClick={() => transition(batch, next)}
                                                sx={{ mt: 1, textTransform: 'capitalize' }}
                                            >
                                                → {next}
                                            </SecondaryButton>
                                        )}
                                    </Box>
                                );
                            })}
                        </Stack>
                    </SurfaceCard>
                ))}
            </Box>

            {queued.length > 0 && (
                <SurfaceCard>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Queued & dispatched
                    </Typography>
                    <Stack spacing={1.25}>
                        {queued.map((batch) => {
                            const next = NEXT_STATUS[batch.status];
                            return (
                                <Stack
                                    key={batch.id}
                                    direction={{ xs: 'column', sm: 'row' }}
                                    justifyContent="space-between"
                                    spacing={1}
                                    sx={{
                                        py: 1,
                                        borderBottom: `1px solid ${colors.border}`,
                                    }}
                                >
                                    <Box>
                                        <Typography variant="subtitle2">{batch.product?.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            #{batch.batch_number} · planned {batch.planned_quantity} ·{' '}
                                            {formatDate(batch.expiry_date)}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <StatusBadge status={batch.status} />
                                        {next && (
                                            <SecondaryButton
                                                size="small"
                                                onClick={() => transition(batch, next)}
                                                sx={{ textTransform: 'capitalize' }}
                                            >
                                                → {next}
                                            </SecondaryButton>
                                        )}
                                    </Stack>
                                </Stack>
                            );
                        })}
                    </Stack>
                </SurfaceCard>
            )}

            <Pagination links={batches.links} />

            <Dialog
                open={qtyDialog.open}
                onClose={() => setQtyDialog({ open: false, batch: null, status: null, quantity: '' })}
                fullWidth
                maxWidth="xs"
            >
                <DialogTitle>Actual quantity</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {qtyDialog.batch?.product?.name
                            ? `How many ${qtyDialog.batch.product.name} came out of this batch?`
                            : 'Optional — leave blank to keep the planned quantity.'}
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        type="number"
                        label="Quantity produced"
                        value={qtyDialog.quantity}
                        onChange={(e) => setQtyDialog((prev) => ({ ...prev, quantity: e.target.value }))}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => setQtyDialog({ open: false, batch: null, status: null, quantity: '' })}
                    >
                        Cancel
                    </Button>
                    <Button variant="contained" onClick={confirmQuantity}>
                        Mark {qtyDialog.status}
                    </Button>
                </DialogActions>
            </Dialog>
        </TenantLayout>
    );
}
