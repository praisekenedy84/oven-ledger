import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import TextInput from '@/Components/TextInput';
import { colors } from '@/theme/bakeryTheme';
import { Box, Button, FormControl, MenuItem, Select, Stack, Typography } from '@mui/material';

function toAmount(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
}

function materialUnitCost(rawMaterials, id) {
    const material = rawMaterials.find((item) => String(item.id) === String(id));
    return toAmount(material?.unit_cost);
}

function lineIngredientCost(ingredient, rawMaterials) {
    return toAmount(ingredient.quantity) * materialUnitCost(rawMaterials, ingredient.raw_material_id);
}

function computeBatchCost(ingredients, rawMaterials) {
    return (ingredients ?? []).reduce(
        (sum, ingredient) => sum + lineIngredientCost(ingredient, rawMaterials),
        0,
    );
}

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
    const ingredients = data.ingredients ?? [];

    const addIngredient = () => {
        setData((current) => ({
            ...current,
            ingredients: [
                ...(current.ingredients ?? []),
                {
                    raw_material_id: rawMaterials[0]?.id ?? '',
                    quantity: '',
                    unit: rawMaterials[0]?.unit_of_measure ?? 'kg',
                },
            ],
        }));
    };

    const updateIngredient = (index, field, value) => {
        setData((current) => {
            const next = [...(current.ingredients ?? [])];
            const row = { ...next[index], [field]: value };

            if (field === 'raw_material_id') {
                const material = rawMaterials.find((item) => String(item.id) === String(value));
                if (material?.unit_of_measure) {
                    row.unit = material.unit_of_measure;
                }
            }

            next[index] = row;
            return { ...current, ingredients: next };
        });
    };

    const removeIngredient = (index) => {
        setData((current) => {
            const currentIngredients = current.ingredients ?? [];
            if (currentIngredients.length <= 1) {
                return current;
            }

            return {
                ...current,
                ingredients: currentIngredients.filter((_, ingredientIndex) => ingredientIndex !== index),
            };
        });
    };

    const setExpectedYield = (value) => {
        setData((current) => ({ ...current, expected_yield: value }));
    };

    const batchCost = computeBatchCost(ingredients, rawMaterials);
    const yieldQty = toAmount(data.expected_yield);
    const unitCost = yieldQty > 0 ? batchCost / yieldQty : 0;

    const quantityInputProps = {
        inputMode: 'decimal',
        step: 'any',
        min: '0',
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
                        type="text"
                        inputProps={quantityInputProps}
                        value={data.expected_yield}
                        onChange={(e) => setExpectedYield(e.target.value)}
                        onInput={(e) => setExpectedYield(e.target.value)}
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
                    {ingredients.map((ingredient, index) => {
                        const lineCost = lineIngredientCost(ingredient, rawMaterials);

                        return (
                            <Box
                                key={index}
                                sx={{
                                    display: 'grid',
                                    gap: 1.5,
                                    gridTemplateColumns: {
                                        xs: '1fr',
                                        sm: '2fr 1fr 1fr auto',
                                    },
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
                                    type="text"
                                    inputProps={quantityInputProps}
                                    placeholder="Qty"
                                    value={ingredient.quantity}
                                    onChange={(e) =>
                                        updateIngredient(index, 'quantity', e.target.value)
                                    }
                                    onInput={(e) =>
                                        updateIngredient(index, 'quantity', e.target.value)
                                    }
                                />
                                <TextInput
                                    placeholder="Unit"
                                    value={ingredient.unit}
                                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                                />
                                <Stack
                                    direction={{ xs: 'row', sm: 'column' }}
                                    alignItems={{ xs: 'center', sm: 'flex-end' }}
                                    justifyContent="space-between"
                                    spacing={0.5}
                                >
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ whiteSpace: 'nowrap' }}
                                    >
                                        Line <Money amount={lineCost} />
                                    </Typography>
                                    <Button
                                        size="small"
                                        color="inherit"
                                        disabled={ingredients.length === 1}
                                        onClick={() => removeIngredient(index)}
                                    >
                                        Remove
                                    </Button>
                                </Stack>
                            </Box>
                        );
                    })}
                </Stack>
                <InputError message={errors.ingredients} />

                <Box
                    sx={{
                        position: { xs: 'sticky', sm: 'static' },
                        bottom: { xs: 12, sm: 'auto' },
                        zIndex: 2,
                        mt: 2,
                        p: 2,
                        borderRadius: 1,
                        bgcolor: colors.wheatLight,
                        border: `1px solid ${colors.border}`,
                        boxShadow: { xs: '0 -4px 16px rgba(51, 38, 28, 0.12)', sm: 'none' },
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
                        <strong>{yieldQty > 0 ? <Money amount={unitCost} /> : '—'}</strong>
                    </Typography>
                </Box>
            </Box>

            {children}
        </Stack>
    );
}
