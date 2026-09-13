import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import {
    Box,
    FormControl,
    MenuItem,
    Paper,
    Select,
    Stack,
} from '@mui/material';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        type: 'produced',
        unit_of_measure: 'pcs',
        category: '',
        is_active: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('tenant.products.store'));
    };

    return (
        <TenantLayout title="New Product">
            <Head title="New Product" />

            <PageHeader title="Add product" backHref={route('tenant.products.index')} />

            <Paper
                component="form"
                onSubmit={submit}
                variant="outlined"
                sx={{ mx: 'auto', maxWidth: 560, p: 3, borderRadius: 1 }}
            >
                <Stack spacing={2}>
                    <Box>
                        <InputLabel value="Name" />
                        <TextInput
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                        />
                        <InputError message={errors.name} />
                    </Box>

                    <Box>
                        <InputLabel value="Type" />
                        <FormControl fullWidth size="small">
                            <Select
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                            >
                                <MenuItem value="produced">Produced</MenuItem>
                                <MenuItem value="trading">Trading</MenuItem>
                            </Select>
                        </FormControl>
                        <InputError message={errors.type} />
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2,
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        }}
                    >
                        <Box>
                            <InputLabel value="Unit of measure" />
                            <TextInput
                                value={data.unit_of_measure}
                                onChange={(e) => setData('unit_of_measure', e.target.value)}
                            />
                            <InputError message={errors.unit_of_measure} />
                        </Box>
                        <Box>
                            <InputLabel value="Category" />
                            <TextInput
                                value={data.category}
                                onChange={(e) => setData('category', e.target.value)}
                            />
                            <InputError message={errors.category} />
                        </Box>
                    </Box>

                    <Checkbox
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        label="Active"
                    />

                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <SecondaryButton component={Link} href={route('tenant.products.index')}>
                            Cancel
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing}>
                            Save
                        </PrimaryButton>
                    </Stack>
                </Stack>
            </Paper>
        </TenantLayout>
    );
}
