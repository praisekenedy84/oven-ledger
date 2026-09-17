import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import ProductPriceFields from '@/Components/ProductPriceFields';
import SecondaryButton from '@/Components/SecondaryButton';
import SurfaceCard from '@/Components/SurfaceCard';
import TextInput from '@/Components/TextInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Separator } from '@/Components/ui/separator';
import TenantLayout from '@/Layouts/TenantLayout';
import RecipeFields from '@/Pages/Recipes/RecipeFields';
import { Head, Link, useForm } from '@inertiajs/react';

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

export default function Create({ categories = [], rawMaterials = [] }) {
    const defaultCategory = categories.find((category) => category.kind === 'produced') ?? categories[0];
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        product_category_id: defaultCategory?.id ?? '',
        unit_of_measure: 'pcs',
        cost_price: '',
        reorder_threshold: '',
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

            <SurfaceCard className="mx-auto max-w-[720px]">
                <form onSubmit={submit} className="flex flex-col gap-6">
                    <FormSection
                        title="1. Product details"
                        description="Name it, pick a category, and set the unit you sell in."
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
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Baked categories need a recipe so ingredient cost is locked. Hardware is bought in.
                                </p>
                            </div>
                            <div>
                                <InputLabel value="Unit of measure" />
                                <TextInput
                                    value={data.unit_of_measure}
                                    onChange={(e) => setData('unit_of_measure', e.target.value)}
                                />
                                <InputError message={errors.unit_of_measure} />
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

                    <Separator />

                    <Checkbox
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        label="Active"
                    />

                    <div className="flex justify-end gap-2">
                        <SecondaryButton asChild>
                            <Link href={route('tenant.products.index')}>Cancel</Link>
                        </SecondaryButton>
                        <PrimaryButton type="submit" disabled={processing}>
                            Save
                        </PrimaryButton>
                    </div>
                </form>
            </SurfaceCard>
        </TenantLayout>
    );
}
