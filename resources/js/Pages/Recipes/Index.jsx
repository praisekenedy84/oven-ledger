import ConfirmButton from '@/Components/ConfirmButton';
import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import TenantLayout from '@/Layouts/TenantLayout';
import RecipeFields from './RecipeFields';
import { Button, Paper, Stack, Typography } from '@mui/material';
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
                <Paper
                    component="form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        post(route('tenant.recipes.store'), { onSuccess: () => reset() });
                    }}
                    variant="outlined"
                    sx={{ mb: 3, p: { xs: 2, sm: 3 }, borderRadius: 1 }}
                >
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                        New recipe
                    </Typography>
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
                </Paper>
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
                        <DataTableCell sx={{ fontWeight: 600 }}>
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
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button
                                    component={Link}
                                    href={route('tenant.recipes.show', recipe.id)}
                                    size="small"
                                >
                                    Edit
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
                            </Stack>
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>

            <Pagination links={recipes.links} />
        </TenantLayout>
    );
}
