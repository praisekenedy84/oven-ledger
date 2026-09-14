import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import ProductPriceFields from '@/Components/ProductPriceFields';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import RecipeFields from '@/Pages/Recipes/RecipeFields';
import {
    Box,
    FormControl,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ categories = [], rawMaterials = [] }) {
    const defaultCategory = categories.find((category) => category.kind === 'produced') ?? categories[0];
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        product_category_id: defaultCategory?.id ?? '',
        unit_of_measure: 'pcs',
        cost_price: '',
        is_active: true,
        prices: { retail: '', wholesale: '', restaurant: '' },
        expected_yield: '',
        ingredients: [
            { raw_material_id: rawMaterials[0]?.id ?? '', quantity: '', unit: rawMaterials[0]?.unit_of_measure ?? 'kg' },
        ],
    });

    const selectedCategory = categories.find(
        (category) => String(category.id) === String(data.product_category_id),
    );
    const isHardware = selectedCategory?.kind === 'hardware';

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
                sx={{ mx: 'auto', maxWidth: 720, p: 3, borderRadius: 1 }}
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

                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2,
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        }}
                    >
                        <Box>
                            <InputLabel value="Category" />
                            <FormControl fullWidth size="small">
                                <Select
                                    value={data.product_category_id}
                                    onChange={(e) => setData('product_category_id', e.target.value)}
                                >
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                            {category.kind === 'hardware' ? ' · hardware' : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <InputError message={errors.product_category_id} />
                            <Typography variant="caption" color="text.secondary">
                                Baked categories need a recipe so ingredient cost is locked. Hardware is bought in.
                            </Typography>
                        </Box>
                        <Box>
                            <InputLabel value="Unit of measure" />
                            <TextInput
                                value={data.unit_of_measure}
                                onChange={(e) => setData('unit_of_measure', e.target.value)}
                            />
                            <InputError message={errors.unit_of_measure} />
                        </Box>
                    </Box>

                    <ProductPriceFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        showCostPrice={isHardware}
                    />

                    {!isHardware && (
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                Recipe
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                                This is what production will deduct from raw materials.
                            </Typography>
                            <RecipeFields
                                data={data}
                                setData={setData}
                                errors={errors}
                                rawMaterials={rawMaterials}
                                lockProduct
                                productName={data.name || 'This product'}
                            />
                        </Box>
                    )}

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
