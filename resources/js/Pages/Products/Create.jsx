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
import { colors } from '@/theme/bakeryTheme';
import {
    Box,
    Divider,
    FormControl,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { Head, Link, useForm } from '@inertiajs/react';

function FormSection({ title, description, children, showDivider = true }) {
    return (
        <Box>
            {showDivider && <Divider sx={{ mb: 2.5, borderColor: colors.border }} />}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                {title}
            </Typography>
            {description && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                    {description}
                </Typography>
            )}
            <Stack spacing={2}>{children}</Stack>
        </Box>
    );
}

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
                <Stack spacing={3}>
                    <FormSection
                        title="1. Product details"
                        description="Name it, pick a category, and set the unit you sell in."
                        showDivider={false}
                    >
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
                    </FormSection>

                    {!isHardware && (
                        <FormSection
                            title="2. Recipe"
                            description="Add ingredients first. This locks cost and tells production what to deduct from raw materials."
                        >
                            <RecipeFields
                                data={data}
                                setData={setData}
                                errors={errors}
                                rawMaterials={rawMaterials}
                                lockProduct
                                productName={data.name || 'This product'}
                            />
                        </FormSection>
                    )}

                    <FormSection
                        title={isHardware ? '2. Selling prices' : '3. Selling prices'}
                        description={
                            isHardware
                                ? 'Set what you pay, then what the counter charges on each channel.'
                                : 'Set prices after the recipe is in place, so you know cost before you decide what to charge.'
                        }
                    >
                        <ProductPriceFields
                            data={data}
                            setData={setData}
                            errors={errors}
                            showCostPrice={isHardware}
                            showHeading={false}
                        />
                    </FormSection>

                    <Divider sx={{ borderColor: colors.border }} />

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
