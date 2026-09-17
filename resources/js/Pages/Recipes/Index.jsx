import ConfirmButton from '@/Components/ConfirmButton';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import SurfaceCard from '@/Components/SurfaceCard';
import { Button } from '@/Components/ui/button';
import TenantLayout from '@/Layouts/TenantLayout';
import RecipeFields from './RecipeFields';
import { Head, Link, router, useForm } from '@inertiajs/react';

export default function Index({ recipes, products, rawMaterials }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: products[0]?.id ?? '',
        expected_yield: '',
        ingredients: [
            { raw_material_id: rawMaterials[0]?.id ?? '', quantity: '', unit: 'kg' },
        ],
    });

    return (
        <TenantLayout title="Recipes">
            <Head title="Recipes" />

            <PageHeader
                title="Recipes"
                description="Ingredient lists that lock the cost of each baked product. Hardware does not use a recipe."
            />

            {products.length > 0 && (
                <SurfaceCard className="mb-6">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            post(route('tenant.recipes.store'), { onSuccess: () => reset() });
                        }}
                    >
                        <h2 className="mb-4 text-base font-bold">New recipe</h2>
                        <RecipeFields
                            data={data}
                            setData={setData}
                            errors={errors}
                            products={products}
                            rawMaterials={rawMaterials}
                        >
                            <PrimaryButton type="submit" disabled={processing}>
                                Create recipe
                            </PrimaryButton>
                        </RecipeFields>
                    </form>
                </SurfaceCard>
            )}

            <DataTable
                columns={[
                    { label: 'Product' },
                    { label: 'Yield' },
                    { label: 'Ingredients' },
                    { label: 'Batch cost' },
                    { label: 'Cost / piece' },
                    { label: '' },
                ]}
            >
                {recipes.data.map((recipe) => (
                    <DataTableRow key={recipe.id}>
                        <DataTableCell className="font-semibold">
                            {recipe.product?.name}
                        </DataTableCell>
                        <DataTableCell>{recipe.expected_yield}</DataTableCell>
                        <DataTableCell>{recipe.ingredients?.length ?? 0}</DataTableCell>
                        <DataTableCell>
                            {recipe.batch_cost ? <Money amount={recipe.batch_cost} /> : '—'}
                        </DataTableCell>
                        <DataTableCell>
                            {recipe.unit_cost ? <Money amount={recipe.unit_cost} /> : '—'}
                        </DataTableCell>
                        <DataTableCell>
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" asChild>
                                    <Link href={route('tenant.recipes.show', recipe.id)}>Edit</Link>
                                </Button>
                                {recipe.product?.type === 'trading' && (
                                    <ConfirmButton
                                        size="small"
                                        variant="danger"
                                        confirmTitle="Delete recipe"
                                        confirmMessage={`Delete the recipe for ${recipe.product?.name ?? 'this product'}?`}
                                        onConfirm={() =>
                                            router.delete(route('tenant.recipes.destroy', recipe.id), {
                                                preserveScroll: true,
                                            })
                                        }
                                    >
                                        Delete
                                    </ConfirmButton>
                                )}
                            </div>
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>

            <Pagination links={recipes.links} />
        </TenantLayout>
    );
}
