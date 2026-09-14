import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import TextInput from '@/Components/TextInput';
import { colors } from '@/theme/bakeryTheme';
import { Box, Button, FormControl, MenuItem, Select, Stack, Typography } from '@mui/material';

export default function RecipeFields({
    data,
    setData,
    errors,
    products = [],
    rawMaterials,
    lockProduct = false,
    productName,
    children,
}) {
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

    const materialCost = (id) => {
        const material = rawMaterials.find((item) => String(item.id) === String(id));
        return Number(material?.unit_cost ?? 0);
    };

    const batchCost = (data.ingredients ?? []).reduce(
        (sum, ingredient) =>
            sum + Number(ingredient.quantity || 0) * materialCost(ingredient.raw_material_id),
        0,
    );
    const yieldQty = Number(data.expected_yield || 0);
    const unitCost = yieldQty > 0 ? batchCost / yieldQty : 0;

    const removeIngredient = (index) => {
        if (data.ingredients.length === 1) {
            return;
        }

        setData(
            'ingredients',
            data.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
        );
    };

    return (
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
                    {lockProduct ? (
                        <Typography fontWeight={600} sx={{ pt: 1 }}>
                            {productName}
                        </Typography>
                    ) : (
                        <>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={data.product_id}
                                    onChange={(e) => setData('product_id', e.target.value)}
                                >
                                    {products.map((product) => (
                                        <MenuItem key={product.id} value={product.id}>
                                            {product.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <InputError message={errors.product_id} />
                        </>
                    )}
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
                    {data.ingredients.map((ingredient, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'grid',
                                gap: 1.5,
                                gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr auto' },
                                alignItems: 'center',
                            }}
                        >
                            <FormControl fullWidth size="small">
                                <Select
                                    value={ingredient.raw_material_id}
                                    onChange={(e) =>
                                        updateIngredient(index, 'raw_material_id', e.target.value)
                                    }
                                >
                                    {rawMaterials.map((rawMaterial) => (
                                        <MenuItem key={rawMaterial.id} value={rawMaterial.id}>
                                            {rawMaterial.name}
                                            {Number(rawMaterial.unit_cost)
                                                ? ` · TZS ${Number(rawMaterial.unit_cost).toLocaleString('en-TZ')}`
                                                : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextInput
                                type="number"
                                inputProps={{ step: '0.001' }}
                                placeholder="Qty"
                                value={ingredient.quantity}
                                onChange={(e) =>
                                    updateIngredient(index, 'quantity', e.target.value)
                                }
                            />
                            <TextInput
                                placeholder="Unit"
                                value={ingredient.unit}
                                onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                            />
                            <Button
                                size="small"
                                color="inherit"
                                disabled={data.ingredients.length === 1}
                                onClick={() => removeIngredient(index)}
                            >
                                Remove
                            </Button>
                        </Box>
                    ))}
                </Stack>
                <InputError message={errors.ingredients} />
                <Box
                    sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 1,
                        bgcolor: colors.wheatLight,
                        display: 'grid',
                        gap: 1,
                        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    }}
                >
                    <Typography variant="body2">
                        Batch ingredient cost:{' '}
                        <strong>
                            <Money amount={batchCost} />
                        </strong>
                    </Typography>
                    <Typography variant="body2">
                        Cost per piece:{' '}
                        <strong>
                            {yieldQty > 0 ? <Money amount={unitCost} /> : '—'}
                        </strong>
                    </Typography>
                </Box>
            </Box>

            {children}
        </Stack>
    );
}
