import ConfirmButton from '@/Components/ConfirmButton';
import Money from '@/Components/Money';
import PageHeader from '@/Components/PageHeader';
import PrimaryButton from '@/Components/PrimaryButton';
import TenantLayout from '@/Layouts/TenantLayout';
import RecipeFields from './RecipeFields';
import { Box, Paper, Stack, Typography } from '@mui/material';
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

            <Paper
                component="form"
                onSubmit={submit}
                variant="outlined"
                sx={{ p: { xs: 2, sm: 3 }, borderRadius: 1 }}
            >
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                    Edit recipe
                </Typography>
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
            </Paper>

            {cost && (
                <Paper variant="outlined" sx={{ mt: 3, p: { xs: 2, sm: 3 }, borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700}>
                        Ingredient cost
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                        From current raw-material prices. Batch <Money amount={cost.batch_cost} /> ·{' '}
                        <Money amount={cost.unit_cost} /> per piece.
                    </Typography>
                    <Stack spacing={1}>
                        {(cost.lines ?? []).map((line) => (
                            <Stack
                                key={line.id ?? line.raw_material_id}
                                direction="row"
                                justifyContent="space-between"
                            >
                                <Typography variant="body2">
                                    {line.name} · {line.quantity} {line.unit}
                                </Typography>
                                <Typography variant="body2" fontWeight={600}>
                                    <Money amount={line.line_cost} />
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>
                    {prices?.retail != null && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            Retail <Money amount={prices.retail} />
                            {cost.unit_cost
                                ? ` · ${prices.retail - cost.unit_cost >= 0 ? 'margin' : 'loss'} `
                                : ''}
                            {cost.unit_cost ? (
                                <Money amount={Math.abs(prices.retail - cost.unit_cost)} />
                            ) : null}
                        </Typography>
                    )}
                </Paper>
            )}
        </TenantLayout>
    );
}
