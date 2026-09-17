import Checkbox from '@/Components/Checkbox';
import ConfirmButton from '@/Components/ConfirmButton';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import ProductPriceFields from '@/Components/ProductPriceFields';
import StatusBadge from '@/Components/StatusBadge';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Separator } from '@/Components/ui/separator';
import TenantLayout from '@/Layouts/TenantLayout';
import RecipeFields from '@/Pages/Recipes/RecipeFields';
import { formatMoney } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';

function FormSection({ title, description, children, showDivider = true }) {
    return (
        <div>
            {showDivider && <Separator className="mb-5" />}
            <p className="mb-1 text-sm font-bold">{title}</p>
            {description && (
                <p className="mb-4 block text-xs text-muted-foreground">{description}</p>
            )}
            <div className="flex flex-col gap-4">{children}</div>
        </div>
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
        reorder_threshold: product.reorder_threshold ?? '',
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

            <div className="grid gap-6 lg:grid-cols-2">
                <SurfaceCard>
                    <form onSubmit={submit} className="flex flex-col gap-6">
                        <p className="text-base font-bold">Edit product</p>
                        <FormSection
                            title="1. Product details"
                            description="Name, category, and the unit you sell in."
                            showDivider={false}
                        >
                            <div>
                                <InputLabel value="Name" />
                                <TextInput
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <InputLabel value="Category" />
                                    <Select
                                        value={String(data.product_category_id)}
                                        onValueChange={(value) => setData('product_category_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={String(category.id)}>
                                                    {category.name}
                                                    {category.kind === 'hardware' ? ' · hardware' : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.product_category_id} />
                                </div>
                                <div>
                                    <InputLabel value="Unit" />
                                    <TextInput
                                        value={data.unit_of_measure}
                                        onChange={(e) => setData('unit_of_measure', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <InputLabel value="Shelf reorder at" />
                                <TextInput
                                    type="number"
                                    min={0}
                                    step="0.001"
                                    value={data.reorder_threshold}
                                    onChange={(e) => setData('reorder_threshold', e.target.value)}
                                    placeholder="e.g. 12"
                                />
                                <InputError message={errors.reorder_threshold} />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Alert when shelf stock falls to this number or below. Leave blank to only warn when empty.
                                </p>
                            </div>
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

                        <Separator />

                        <Checkbox
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            label="Active"
                        />

                        <PrimaryButton type="submit" disabled={processing}>
                            Save changes
                        </PrimaryButton>
                    </form>
                </SurfaceCard>

                <div className="flex flex-col gap-6">
                    <SurfaceCard>
                        <p className="text-base font-bold">Cost vs selling price</p>
                        <p className="mt-1 mb-4 text-sm text-muted-foreground">
                            {isHardware
                                ? 'What you pay to stock this item, against what you charge.'
                                : 'Ingredient cost per piece from the recipe, against what you charge.'}
                        </p>
                        <div className="flex flex-col gap-2">
                            <CostRow label="Cost per unit" value={unitCost} />
                            {['retail', 'wholesale', 'restaurant'].map((channel) => (
                                <CostRow
                                    key={channel}
                                    label={`${channel} price`}
                                    value={prices[channel]}
                                    margin={margins[channel]}
                                />
                            ))}
                        </div>
                    </SurfaceCard>

                    {!isHardware && product.recipe && (
                        <SurfaceCard>
                            <p className="text-base font-bold">Locked recipe cost</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Expected yield: {product.recipe.expected_yield}
                                {recipeCost
                                    ? ` · batch ${formatPlain(recipeCost.batch_cost)} · ${formatPlain(recipeCost.unit_cost)} each`
                                    : ''}
                            </p>
                            <ul className="mt-2 space-y-2">
                                {(recipeCost?.lines ?? product.recipe.ingredients)?.map((ing) => (
                                    <li
                                        key={ing.id}
                                        className="flex items-center justify-between gap-4 rounded-lg bg-surface px-4 py-2"
                                    >
                                        <span className="text-sm font-medium">
                                            {ing.name ?? ing.raw_material?.name}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {ing.quantity} {ing.unit}
                                            {ing.line_cost != null ? ` · ${formatPlain(ing.line_cost)}` : ''}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </SurfaceCard>
                    )}
                </div>
            </div>

            <div className="mt-4">
                <StatusBadge
                    status={isHardware ? 'hardware' : 'produced'}
                    label={isHardware ? 'Hardware' : 'Baked'}
                />
            </div>
        </TenantLayout>
    );
}

function formatPlain(amount) {
    if (amount == null || amount === '') {
        return '—';
    }

    return formatMoney(amount);
}

function CostRow({ label, value, margin }) {
    return (
        <div className="flex justify-between gap-4">
            <p className="text-sm capitalize">{label}</p>
            <p className="text-sm font-semibold">
                {value == null || value === '' ? '—' : <Money amount={value} />}
                {margin != null && (
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {margin >= 0 ? 'margin' : 'loss'} <Money amount={Math.abs(margin)} />
                    </span>
                )}
            </p>
        </div>
    );
}
