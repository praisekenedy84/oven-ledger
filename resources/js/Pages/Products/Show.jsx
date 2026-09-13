import Checkbox from '@/Components/Checkbox';
import ConfirmButton from '@/Components/ConfirmButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import { colors } from '@/theme/bakeryTheme';
import {
    Box,
    FormControl,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { Head, router, useForm } from '@inertiajs/react';

export default function Show({ product }) {
    const { data, setData, put, processing, errors } = useForm({
        name: product.name,
        type: product.type,
        unit_of_measure: product.unit_of_measure,
        category: product.category ?? '',
        is_active: product.is_active,
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('tenant.products.update', product.id));
    };

    const destroy = () => router.delete(route('tenant.products.destroy', product.id));

    return (
        <TenantLayout title={product.name}>
            <Head title={product.name} />

            <PageHeader
                title={product.name}
                backHref={route('tenant.products.index')}
                actions={
                    <ConfirmButton onConfirm={destroy} confirmMessage="Delete this product?">
                        Delete
                    </ConfirmButton>
                }
            />

            <Box
                sx={{
                    display: 'grid',
                    gap: 3,
                    gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                }}
            >
                <Paper
                    component="form"
                    onSubmit={submit}
                    variant="outlined"
                    sx={{ p: 3, borderRadius: 3 }}
                >
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                        Edit product
                    </Typography>
                    <Stack spacing={2.5}>
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
                        </Box>

                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                            }}
                        >
                            <Box>
                                <InputLabel value="Unit" />
                                <TextInput
                                    value={data.unit_of_measure}
                                    onChange={(e) => setData('unit_of_measure', e.target.value)}
                                />
                            </Box>
                            <Box>
                                <InputLabel value="Category" />
                                <TextInput
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                />
                            </Box>
                        </Box>

                        <Checkbox
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            label="Active"
                        />

                        <PrimaryButton type="submit" disabled={processing}>
                            Save changes
                        </PrimaryButton>
                    </Stack>
                </Paper>

                {product.recipe && (
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            Linked recipe
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Expected yield: {product.recipe.expected_yield}
                        </Typography>
                        <List dense sx={{ mt: 1 }}>
                            {product.recipe.ingredients?.map((ing) => (
                                <ListItem
                                    key={ing.id}
                                    sx={{
                                        bgcolor: colors.surface,
                                        borderRadius: 2,
                                        mb: 1,
                                        px: 2,
                                    }}
                                    secondaryAction={
                                        <Typography variant="body2" color="text.secondary">
                                            {ing.quantity} {ing.unit}
                                        </Typography>
                                    }
                                >
                                    <ListItemText primary={ing.raw_material?.name} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                )}
            </Box>

            <Box sx={{ mt: 2 }}>
                <StatusBadge status={product.type} />
            </Box>
        </TenantLayout>
    );
}
