import ConfirmButton from '@/Components/ConfirmButton';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import SurfaceCard from '@/Components/SurfaceCard';
import TenantLayout from '@/Layouts/TenantLayout';
import RecipeFields from './RecipeFields';
import { Head, router, useForm } from '@inertiajs/react';

export default function Show({ recipe, rawMaterials, cost = null, prices = null }) {
    const { data, setData, put, processing, errors } = useForm({
        expected_yield: recipe.expected_yield,
        ingredients: recipe.ingredients?.length
            ? recipe.ingredients.map((ingredient) => ({
                  raw_material_id: ingredient.raw_material_id,
                  quantity: ingredient.quantity,
                  unit: ingredient.unit,
              }))
            : [{ raw_material_id: rawMaterials[0]?.id ?? '', quantity: '', unit: 'kg' }],
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('tenant.recipes.update', recipe.id));
    };

    return (
        <TenantLayout title={recipe.product?.name ?? 'Recipe'}>
            <Head title="Recipe" />

            <PageHeader
                title={recipe.product?.name ?? 'Recipe'}
                description="Update the bill of materials or remove this recipe."
                backHref={route('tenant.recipes.index')}
                actions={
                    <ConfirmButton
                        onConfirm={() => router.delete(route('tenant.recipes.destroy', recipe.id))}
                        confirmTitle="Delete recipe"
                        confirmMessage="Delete this recipe? Production batches that already used it will keep their history."
                    >
                        Delete
                    </ConfirmButton>
                }
            />

            <SurfaceCard>
                <form onSubmit={submit}>
                    <h2 className="mb-4 text-base font-bold">Edit recipe</h2>
                    <RecipeFields
                        data={data}
                        setData={setData}
                        errors={errors}
                        rawMaterials={rawMaterials}
                        lockProduct
                        productName={recipe.product?.name}
                    >
                        <PrimaryButton type="submit" disabled={processing}>
                            Save changes
                        </PrimaryButton>
                    </RecipeFields>
                </form>
            </SurfaceCard>

            {cost && (
                <SurfaceCard className="mt-6">
                    <h2 className="text-base font-bold">Ingredient cost</h2>
                    <p className="mb-4 mt-0.5 text-sm text-muted-foreground">
                        From current raw-material prices. Batch <Money amount={cost.batch_cost} /> ·{' '}
                        <Money amount={cost.unit_cost} /> per piece.
                    </p>
                    <div className="space-y-2">
                        {(cost.lines ?? []).map((line) => (
                            <div
                                key={line.id ?? line.raw_material_id}
                                className="flex flex-row justify-between"
                            >
                                <p className="text-sm">
                                    {line.name} · {line.quantity} {line.unit}
                                </p>
                                <p className="text-sm font-semibold">
                                    <Money amount={line.line_cost} />
                                </p>
                            </div>
                        ))}
                    </div>
                    {prices?.retail != null && (
                        <p className="mt-4 text-sm text-muted-foreground">
                            Retail <Money amount={prices.retail} />
                            {cost.unit_cost
                                ? ` · ${prices.retail - cost.unit_cost >= 0 ? 'margin' : 'loss'} `
                                : ''}
                            {cost.unit_cost ? (
                                <Money amount={Math.abs(prices.retail - cost.unit_cost)} />
                            ) : null}
                        </p>
                    )}
                </SurfaceCard>
            )}
        </TenantLayout>
    );
}
