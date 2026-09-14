import Checkbox from '@/Components/Checkbox';
import ConfirmButton from '@/Components/ConfirmButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import ProductPriceFields from '@/Components/ProductPriceFields';
import StatusBadge from '@/Components/StatusBadge';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import RecipeFields from '@/Pages/Recipes/RecipeFields';
import { colors } from '@/theme/bakeryTheme';
import {
    Box,
    Divider,
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

export default function Show({
    product,
    prices = {},
    unitCost = 0,
    recipeCost = null,
    margins = {},
    categories = [],
    rawMaterials = [],
}) {
    const { data, setData, put, processing, errors } = useForm({
        name: product.name,
        product_category_id: product.product_category_id ?? product.product_category?.id ?? '',
        unit_of_measure: product.unit_of_measure,
        cost_price: product.cost_price ?? '',
        is_active: product.is_active,
        prices: {
            retail: prices.retail ?? '',
            wholesale: prices.wholesale ?? '',
            restaurant: prices.restaurant ?? '',
        },
        expected_yield: product.recipe?.expected_yield ?? '',
        ingredients: (product.recipe?.ingredients?.length
            ? product.recipe.ingredients
            : [{ raw_material_id: rawMaterials[0]?.id ?? '', quantity: '', unit: rawMaterials[0]?.unit_of_measure ?? 'kg' }]
        ).map((ingredient) => ({
            raw_material_id: ingredient.raw_material_id,
            quantity: ingredient.quantity ?? '',
            unit: ingredient.unit ?? 'kg',
        })),
    });

    const selectedCategory = categories.find(
        (category) => String(category.id) === String(data.product_category_id),
    );
    const isHardware = selectedCategory?.kind === 'hardware';

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
                    sx={{ p: 3, borderRadius: 1 }}
                >
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                        Edit product
                    </Typography>
                    <Stack spacing={3}>
                        <FormSection
                            title="1. Product details"
                            description="Name, category, and the unit you sell in."
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
                                </Box>
                                <Box>
                                    <InputLabel value="Unit" />
                                    <TextInput
                                        value={data.unit_of_measure}
                                        onChange={(e) => setData('unit_of_measure', e.target.value)}
                                    />
                                </Box>
                            </Box>
                        </FormSection>

                        {!isHardware && (
                            <FormSection
                                title="2. Recipe"
                                description="Ingredients lock cost and tell production what to deduct."
                            >
                                <RecipeFields
                                    data={data}
                                    setData={setData}
                                    errors={errors}
                                    rawMaterials={rawMaterials}
                                    lockProduct
                                    productName={data.name || product.name}
                                />
                            </FormSection>
                        )}

                        <FormSection
                            title={isHardware ? '2. Selling prices' : '3. Selling prices'}
                            description={
                                isHardware
                                    ? 'What you pay, then what the counter charges on each channel.'
                                    : 'Set after the recipe so cost is clear before you decide what to charge.'
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

                        <PrimaryButton type="submit" disabled={processing}>
                            Save changes
                        </PrimaryButton>
                    </Stack>
                </Paper>

                <Stack spacing={3}>
                    <Paper variant="outlined" sx={{ p: 3, borderRadius: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                            Cost vs selling price
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                            {isHardware
                                ? 'What you pay to stock this item, against what you charge.'
                                : 'Ingredient cost per piece from the recipe, against what you charge.'}
                        </Typography>
                        <Stack spacing={1}>
                            <CostRow label="Cost per unit" value={unitCost} />
                            {['retail', 'wholesale', 'restaurant'].map((channel) => (
                                <CostRow
                                    key={channel}
                                    label={`${channel} price`}
                                    value={prices[channel]}
                                    margin={margins[channel]}
                                />
                            ))}
                        </Stack>
                    </Paper>

                    {!isHardware && product.recipe && (
                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 1 }}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                Locked recipe cost
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Expected yield: {product.recipe.expected_yield}
                                {recipeCost
                                    ? ` · batch ${formatPlain(recipeCost.batch_cost)} · ${formatPlain(recipeCost.unit_cost)} each`
                                    : ''}
                            </Typography>
                            <List dense sx={{ mt: 1 }}>
                                {(recipeCost?.lines ?? product.recipe.ingredients)?.map((ing) => (
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
                                                {ing.line_cost != null ? ` · ${formatPlain(ing.line_cost)}` : ''}
                                            </Typography>
                                        }
                                    >
                                        <ListItemText primary={ing.name ?? ing.raw_material?.name} />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    )}
                </Stack>
            </Box>

            <Box sx={{ mt: 2 }}>
                <StatusBadge
                    status={isHardware ? 'hardware' : 'produced'}
                    label={isHardware ? 'Hardware' : 'Baked'}
                />
            </Box>
        </TenantLayout>
    );
}

function formatPlain(amount) {
    if (amount == null || amount === '') {
        return '—';
    }

    return `TZS ${Number(amount).toLocaleString('en-TZ')}`;
}

function CostRow({ label, value, margin }) {
    return (
        <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
                {value == null || value === '' ? '—' : <Money amount={value} />}
                {margin != null && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        {margin >= 0 ? 'margin' : 'loss'} <Money amount={Math.abs(margin)} />
                    </Typography>
                )}
            </Typography>
        </Stack>
    );
}
