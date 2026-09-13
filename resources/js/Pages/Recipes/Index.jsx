import DataTable, { DataTableCell, DataTableRow } from '@/Components/DataTable';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import TenantLayout from '@/Layouts/TenantLayout';
import {
    Box,
    Button,
    FormControl,
    MenuItem,
    Paper,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Index({ recipes, products, rawMaterials }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        product_id: products[0]?.id ?? '',
        expected_yield: '',
        ingredients: [
            { raw_material_id: rawMaterials[0]?.id ?? '', quantity: '', unit: 'kg' },
        ],
    });

    const addIngredient = () => {
        setData('ingredients', [
            ...data.ingredients,
            { raw_material_id: rawMaterials[0]?.id ?? '', quantity: '', unit: 'kg' },
        ]);
    };

    const updateIngredient = (index, field, value) => {
        const ingredients = [...data.ingredients];
        ingredients[index] = { ...ingredients[index], [field]: value };
        setData('ingredients', ingredients);
    };

    return (
        <TenantLayout title="Recipes">
            <Head title="Recipes" />

            <PageHeader title="Recipes" description="Bill of materials for produced goods." />

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
                <Stack spacing={2}>
                    <Box
                        sx={{
                            display: 'grid',
                            gap: 2,
                            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                        }}
                    >
                        <Box>
                            <InputLabel value="Product" />
                            <FormControl fullWidth size="small">
                                <Select
                                    value={data.product_id}
                                    onChange={(e) => setData('product_id', e.target.value)}
                                >
                                    {products.map((p) => (
                                        <MenuItem key={p.id} value={p.id}>
                                            {p.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <InputError message={errors.product_id} />
                        </Box>
                        <Box>
                            <InputLabel value="Expected yield" />
                            <TextInput
                                type="number"
                                inputProps={{ step: '0.001' }}
                                value={data.expected_yield}
                                onChange={(e) => setData('expected_yield', e.target.value)}
                            />
                            <InputError message={errors.expected_yield} />
                        </Box>
                    </Box>

                    <Box>
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 1 }}
                        >
                            <InputLabel value="Ingredients" />
                            <Button size="small" onClick={addIngredient}>
                                + Add ingredient
                            </Button>
                        </Stack>
                        <Stack spacing={1.5}>
                            {data.ingredients.map((ing, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'grid',
                                        gap: 1.5,
                                        gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' },
                                    }}
                                >
                                    <FormControl fullWidth size="small">
                                        <Select
                                            value={ing.raw_material_id}
                                            onChange={(e) =>
                                                updateIngredient(
                                                    index,
                                                    'raw_material_id',
                                                    e.target.value,
                                                )
                                            }
                                        >
                                            {rawMaterials.map((rm) => (
                                                <MenuItem key={rm.id} value={rm.id}>
                                                    {rm.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <TextInput
                                        type="number"
                                        inputProps={{ step: '0.001' }}
                                        placeholder="Qty"
                                        value={ing.quantity}
                                        onChange={(e) =>
                                            updateIngredient(index, 'quantity', e.target.value)
                                        }
                                    />
                                    <TextInput
                                        placeholder="Unit"
                                        value={ing.unit}
                                        onChange={(e) =>
                                            updateIngredient(index, 'unit', e.target.value)
                                        }
                                    />
                                </Box>
                            ))}
                        </Stack>
                    </Box>

                    <PrimaryButton type="submit" disabled={processing}>
                        Create recipe
                    </PrimaryButton>
                </Stack>
            </Paper>

            <DataTable
                columns={[
                    { label: 'Product' },
                    { label: 'Yield' },
                    { label: 'Ingredients' },
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
                            <Button
                                component={Link}
                                href={route('tenant.recipes.show', recipe.id)}
                                size="small"
                            >
                                View
                            </Button>
                        </DataTableCell>
                    </DataTableRow>
                ))}
            </DataTable>

            <Pagination links={recipes.links} />
        </TenantLayout>
    );
}
