import ConfirmButton from '@/Components/ConfirmButton';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import { formatQuantity } from '@/lib/format';
import { colors } from '@/theme/bakeryTheme';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Button, IconButton, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Fragment, useState } from 'react';

function todayInput() {
    return new Date().toISOString().slice(0, 10);
}

export default function Index({ rawMaterials }) {
    const [panel, setPanel] = useState(null);

    const createForm = useForm({
        name: '',
        unit_of_measure: 'kg',
        reorder_threshold: '',
        unit_cost: '',
        current_stock: '',
    });

    const editForm = useForm({
        name: '',
        unit_of_measure: '',
        reorder_threshold: '',
        unit_cost: '',
    });

    const restockForm = useForm({
        raw_material_id: '',
        quantity: '',
        unit_cost: '',
        occurred_at: todayInput(),
        notes: '',
    });

    const closePanel = () => setPanel(null);

    const startEdit = (item) => {
        setPanel({ type: 'edit', id: item.id });
        editForm.clearErrors();
        editForm.setData({
            name: item.name,
            unit_of_measure: item.unit_of_measure,
            reorder_threshold: item.reorder_threshold ?? '',
            unit_cost: item.unit_cost ?? '',
        });
    };

    const startRestock = (item) => {
        setPanel({ type: 'restock', id: item.id, unit: item.unit_of_measure, name: item.name });
        restockForm.clearErrors();
        restockForm.setData({
            raw_material_id: item.id,
            quantity: '',
            unit_cost: item.unit_cost ?? '',
            occurred_at: todayInput(),
            notes: '',
        });
    };

    return (
        <TenantLayout title="Raw Materials">
            <Head title="Raw Materials" />

            <PageHeader
                title="Raw materials"
                description="Ingredients and supplies used in production. Restock from the table, edit details inline, or open history for the full lifecycle."
            />

            <Paper
                component="form"
                onSubmit={(e) => {
                    e.preventDefault();
                    createForm.post(route('tenant.raw-materials.store'), {
                        onSuccess: () => createForm.reset(),
                    });
                }}
                variant="outlined"
                sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 1,
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr 1fr 1fr' },
                }}
            >
                <Box>
                    <InputLabel value="Name" />
                    <TextInput
                        value={createForm.data.name}
                        onChange={(e) => createForm.setData('name', e.target.value)}
                    />
                    <InputError message={createForm.errors.name} />
                </Box>
                <Box>
                    <InputLabel value="Unit" />
                    <TextInput
                        value={createForm.data.unit_of_measure}
                        onChange={(e) => createForm.setData('unit_of_measure', e.target.value)}
                    />
                </Box>
                <Box>
                    <InputLabel value="Current stock" />
                    <TextInput
                        type="number"
                        inputProps={{ min: 0, step: '0.001' }}
                        value={createForm.data.current_stock}
                        onChange={(e) => createForm.setData('current_stock', e.target.value)}
                        placeholder="Optional"
                    />
                    <InputError message={createForm.errors.current_stock} />
                </Box>
                <Box>
                    <InputLabel value="Reorder at" />
                    <TextInput
                        type="number"
                        inputProps={{ step: '0.001' }}
                        value={createForm.data.reorder_threshold}
                        onChange={(e) => createForm.setData('reorder_threshold', e.target.value)}
                    />
                </Box>
                <Box>
                    <InputLabel value="Price per unit (TZS)" />
                    <TextInput
                        type="number"
                        inputProps={{ min: 0, step: '1' }}
                        value={createForm.data.unit_cost}
                        onChange={(e) => createForm.setData('unit_cost', e.target.value)}
                    />
                    <InputError message={createForm.errors.unit_cost} />
                </Box>
                <Box sx={{ gridColumn: '1 / -1' }}>
                    <PrimaryButton type="submit" disabled={createForm.processing}>
                        Add raw material
                    </PrimaryButton>
                </Box>
            </Paper>

            <DataTable
                columns={[
                    { label: 'Name' },
                    { label: 'On hand' },
                    { label: 'Unit' },
                    { label: 'Reorder threshold' },
                    { label: 'Price / unit' },
                    { label: 'Actions' },
                ]}
            >
                {rawMaterials.data.map((item) => {
                    const isEditing = panel?.type === 'edit' && panel.id === item.id;
                    const isRestocking = panel?.type === 'restock' && panel.id === item.id;

                    return (
                        <Fragment key={item.id}>
                            <DataTableRow>
                                <DataTableCell sx={{ fontWeight: 600 }}>{item.name}</DataTableCell>
                                <DataTableCell>
                                    {formatQuantity(item.quantity_on_hand ?? 0)}
                                </DataTableCell>
                                <DataTableCell>{item.unit_of_measure}</DataTableCell>
                                <DataTableCell>{item.reorder_threshold ?? '—'}</DataTableCell>
                                <DataTableCell>
                                    {item.unit_cost ? <Money amount={item.unit_cost} /> : '—'}
                                </DataTableCell>
                                <DataTableCell>
                                    <Stack
                                        direction="row"
                                        spacing={0.5}
                                        justifyContent="flex-end"
                                        alignItems="center"
                                    >
                                        <Button
                                            size="small"
                                            variant={isRestocking ? 'contained' : 'outlined'}
                                            onClick={() =>
                                                isRestocking ? closePanel() : startRestock(item)
                                            }
                                        >
                                            Restock
                                        </Button>
                                        <Tooltip title="Edit">
                                            <IconButton
                                                size="small"
                                                aria-label={`Edit ${item.name}`}
                                                color={isEditing ? 'primary' : 'default'}
                                                onClick={() =>
                                                    isEditing ? closePanel() : startEdit(item)
                                                }
                                            >
                                                <EditOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="View history">
                                            <IconButton
                                                component={Link}
                                                href={route('tenant.raw-materials.show', item.id)}
                                                size="small"
                                                aria-label={`View history for ${item.name}`}
                                            >
                                                <VisibilityOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <ConfirmButton
                                            size="small"
                                            variant="danger"
                                            confirmTitle="Delete raw material"
                                            confirmMessage={`Delete ${item.name}?`}
                                            onConfirm={() =>
                                                router.delete(
                                                    route('tenant.raw-materials.destroy', item.id),
                                                    { preserveScroll: true },
                                                )
                                            }
                                            sx={{
                                                minWidth: 36,
                                                px: 1,
                                            }}
                                            aria-label={`Delete ${item.name}`}
                                        >
                                            <DeleteOutlinedIcon fontSize="small" />
                                        </ConfirmButton>
                                    </Stack>
                                </DataTableCell>
                            </DataTableRow>

                            {(isEditing || isRestocking) && (
                                <DataTableRow>
                                    <DataTableCell
                                        colSpan={6}
                                        sx={{
                                            bgcolor: colors.wheatLight,
                                            borderTop: `1px solid ${colors.border}`,
                                            py: 2.5,
                                        }}
                                    >
                                        {isEditing ? (
                                            <Box
                                                component="form"
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    editForm.put(
                                                        route(
                                                            'tenant.raw-materials.update',
                                                            item.id,
                                                        ),
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: closePanel,
                                                        },
                                                    );
                                                }}
                                            >
                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight={700}
                                                    sx={{ mb: 0.5 }}
                                                >
                                                    Edit {item.name}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    display="block"
                                                    sx={{ mb: 2 }}
                                                >
                                                    Adjust name, unit, reorder point, or buy-in
                                                    price. Stock changes go through Restock.
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        display: 'grid',
                                                        gap: 2,
                                                        gridTemplateColumns: {
                                                            xs: '1fr',
                                                            sm: '2fr 1fr 1fr 1fr',
                                                        },
                                                    }}
                                                >
                                                    <Box>
                                                        <InputLabel value="Name" />
                                                        <TextInput
                                                            value={editForm.data.name}
                                                            onChange={(e) =>
                                                                editForm.setData(
                                                                    'name',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={editForm.errors.name}
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <InputLabel value="Unit" />
                                                        <TextInput
                                                            value={editForm.data.unit_of_measure}
                                                            onChange={(e) =>
                                                                editForm.setData(
                                                                    'unit_of_measure',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                editForm.errors.unit_of_measure
                                                            }
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <InputLabel value="Reorder at" />
                                                        <TextInput
                                                            type="number"
                                                            inputProps={{ step: '0.001' }}
                                                            value={
                                                                editForm.data.reorder_threshold
                                                            }
                                                            onChange={(e) =>
                                                                editForm.setData(
                                                                    'reorder_threshold',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                editForm.errors.reorder_threshold
                                                            }
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <InputLabel value="Price per unit (TZS)" />
                                                        <TextInput
                                                            type="number"
                                                            inputProps={{ min: 0, step: '1' }}
                                                            value={editForm.data.unit_cost}
                                                            onChange={(e) =>
                                                                editForm.setData(
                                                                    'unit_cost',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={editForm.errors.unit_cost}
                                                        />
                                                    </Box>
                                                </Box>
                                                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                                    <PrimaryButton
                                                        type="submit"
                                                        size="small"
                                                        disabled={editForm.processing}
                                                    >
                                                        Save changes
                                                    </PrimaryButton>
                                                    <SecondaryButton
                                                        size="small"
                                                        onClick={closePanel}
                                                    >
                                                        Cancel
                                                    </SecondaryButton>
                                                </Stack>
                                            </Box>
                                        ) : (
                                            <Box
                                                component="form"
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    restockForm.post(
                                                        route('tenant.inventory.restock'),
                                                        {
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                restockForm.reset(
                                                                    'quantity',
                                                                    'notes',
                                                                );
                                                                closePanel();
                                                            },
                                                        },
                                                    );
                                                }}
                                            >
                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight={700}
                                                    sx={{ mb: 0.5 }}
                                                >
                                                    Restock {item.name}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    display="block"
                                                    sx={{ mb: 2 }}
                                                >
                                                    Add what you received. On-hand quantity and
                                                    price update when you save.
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        display: 'grid',
                                                        gap: 2,
                                                        gridTemplateColumns: {
                                                            xs: '1fr',
                                                            sm: '1fr 1fr 1fr 1fr',
                                                        },
                                                    }}
                                                >
                                                    <Box>
                                                        <InputLabel
                                                            value={`Quantity (${item.unit_of_measure})`}
                                                        />
                                                        <TextInput
                                                            type="number"
                                                            inputProps={{
                                                                min: 0,
                                                                step: '0.001',
                                                            }}
                                                            value={restockForm.data.quantity}
                                                            onChange={(e) =>
                                                                restockForm.setData(
                                                                    'quantity',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={restockForm.errors.quantity}
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <InputLabel value="Price per unit (TZS)" />
                                                        <TextInput
                                                            type="number"
                                                            inputProps={{ min: 0, step: '1' }}
                                                            value={restockForm.data.unit_cost}
                                                            onChange={(e) =>
                                                                restockForm.setData(
                                                                    'unit_cost',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={restockForm.errors.unit_cost}
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <InputLabel value="Received on" />
                                                        <TextInput
                                                            type="date"
                                                            value={restockForm.data.occurred_at}
                                                            onChange={(e) =>
                                                                restockForm.setData(
                                                                    'occurred_at',
                                                                    e.target.value,
                                                                )
                                                            }
                                                        />
                                                        <InputError
                                                            message={
                                                                restockForm.errors.occurred_at
                                                            }
                                                        />
                                                    </Box>
                                                    <Box>
                                                        <InputLabel value="Notes" />
                                                        <TextInput
                                                            value={restockForm.data.notes}
                                                            onChange={(e) =>
                                                                restockForm.setData(
                                                                    'notes',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            placeholder="Supplier, invoice…"
                                                        />
                                                    </Box>
                                                </Box>
                                                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                                                    <PrimaryButton
                                                        type="submit"
                                                        size="small"
                                                        disabled={restockForm.processing}
                                                    >
                                                        Record restock
                                                    </PrimaryButton>
                                                    <SecondaryButton
                                                        size="small"
                                                        onClick={closePanel}
                                                    >
                                                        Cancel
                                                    </SecondaryButton>
                                                </Stack>
                                            </Box>
                                        )}
                                    </DataTableCell>
                                </DataTableRow>
                            )}
                        </Fragment>
                    );
                })}
            </DataTable>

            <Pagination links={rawMaterials.links} />
        </TenantLayout>
    );
}
