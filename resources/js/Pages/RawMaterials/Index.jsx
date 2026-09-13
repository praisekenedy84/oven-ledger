import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import { Box, Button, Paper, Stack } from '@mui/material';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Index({ rawMaterials }) {
    const [editing, setEditing] = useState(null);

    const createForm = useForm({
        name: '',
        unit_of_measure: 'kg',
        reorder_threshold: '',
    });

    const editForm = useForm({
        name: '',
        unit_of_measure: '',
        reorder_threshold: '',
    });

    const startEdit = (item) => {
        setEditing(item.id);
        editForm.setData({
            name: item.name,
            unit_of_measure: item.unit_of_measure,
            reorder_threshold: item.reorder_threshold ?? '',
        });
    };

    return (
        <TenantLayout title="Raw Materials">
            <Head title="Raw Materials" />

            <PageHeader
                title="Raw materials"
                description="Ingredients and supplies used in production."
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
                    gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' },
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
                    <InputLabel value="Reorder at" />
                    <TextInput
                        type="number"
                        inputProps={{ step: '0.001' }}
                        value={createForm.data.reorder_threshold}
                        onChange={(e) => createForm.setData('reorder_threshold', e.target.value)}
                    />
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
                    { label: 'Unit' },
                    { label: 'Reorder threshold' },
                    { label: '' },
                ]}
            >
                {rawMaterials.data.map((item) => (
                    <DataTableRow key={item.id}>
                        {editing === item.id ? (
                            <DataTableCell colSpan={4}>
                                <Box
                                    component="form"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        editForm.put(route('tenant.raw-materials.update', editing), {
                                            onSuccess: () => setEditing(null),
                                        });
                                    }}
                                    sx={{
                                        display: 'grid',
                                        gap: 1.5,
                                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr auto' },
                                    }}
                                >
                                    <TextInput
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                    />
                                    <TextInput
                                        value={editForm.data.unit_of_measure}
                                        onChange={(e) =>
                                            editForm.setData('unit_of_measure', e.target.value)
                                        }
                                    />
                                    <TextInput
                                        type="number"
                                        inputProps={{ step: '0.001' }}
                                        value={editForm.data.reorder_threshold}
                                        onChange={(e) =>
                                            editForm.setData('reorder_threshold', e.target.value)
                                        }
                                    />
                                    <Stack direction="row" spacing={1}>
                                        <PrimaryButton type="submit" size="small">
                                            Save
                                        </PrimaryButton>
                                        <SecondaryButton
                                            size="small"
                                            onClick={() => setEditing(null)}
                                        >
                                            Cancel
                                        </SecondaryButton>
                                    </Stack>
                                </Box>
                            </DataTableCell>
                        ) : (
                            <>
                                <DataTableCell sx={{ fontWeight: 600 }}>{item.name}</DataTableCell>
                                <DataTableCell>{item.unit_of_measure}</DataTableCell>
                                <DataTableCell>{item.reorder_threshold ?? 'â€”'}</DataTableCell>
                                <DataTableCell>
                                    <Button size="small" onClick={() => startEdit(item)}>
                                        Edit
                                    </Button>
                                </DataTableCell>
                            </>
                        )}
                    </DataTableRow>
                ))}
            </DataTable>

            <Pagination links={rawMaterials.links} />
        </TenantLayout>
    );
}
