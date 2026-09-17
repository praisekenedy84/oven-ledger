import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Money from '@/Components/Money';
import TextInput from '@/Components/TextInput';
import { Button } from '@/Components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { formatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';

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

    return (
        <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <InputLabel value="Product" />
                    {lockProduct ? (
                        <p className="pt-2 font-semibold">{productName}</p>
                    ) : (
                        <>
                            <Select
                                value={String(data.product_id ?? '')}
                                onValueChange={(value) => setData('product_id', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((product) => (
                                        <SelectItem key={product.id} value={String(product.id)}>
                                            {product.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.product_id} />
                        </>
                    )}
                </div>
                <div>
                    <InputLabel value="Expected yield" />
                    <TextInput
                        type="number"
                        step="any"
                        min="0"
                        value={data.expected_yield}
                        onChange={(e) => setExpectedYield(e.target.value)}
                    />
                    <InputError message={errors.expected_yield} />
                </div>
            </div>

            <div>
                <div className="mb-2 flex items-center justify-between">
                    <InputLabel value="Ingredients" />
                    <Button type="button" size="sm" variant="ghost" onClick={addIngredient}>
                        + Add ingredient
                    </Button>
                </div>
                <div className="space-y-3">
                    {ingredients.map((ingredient, index) => {
                        const lineCost = lineIngredientCost(ingredient, rawMaterials);

                        return (
                            <div
                                key={index}
                                className="grid items-center gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
                            >
                                <Select
                                    value={String(ingredient.raw_material_id ?? '')}
                                    onValueChange={(value) =>
                                        updateIngredient(index, 'raw_material_id', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select material" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rawMaterials.map((rawMaterial) => (
                                            <SelectItem key={rawMaterial.id} value={String(rawMaterial.id)}>
                                                {rawMaterial.name}
                                                {Number(rawMaterial.unit_cost)
                                                    ? ` · ${formatMoney(rawMaterial.unit_cost)}`
                                                    : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <TextInput
                                    type="number"
                                    step="any"
                                    min="0"
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
                                <div className="flex flex-row items-center justify-between gap-2 sm:flex-col sm:items-end">
                                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                                        Line <Money amount={lineCost} />
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        disabled={ingredients.length === 1}
                                        onClick={() => removeIngredient(index)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <InputError message={errors.ingredients} />

                <div
                    className={cn(
                        'mt-4 grid gap-2 rounded-md border border-border bg-wheat-light p-4 sm:grid-cols-2',
                        'sticky bottom-3 z-[2] shadow-[0_-4px_16px_rgba(51,38,28,0.12)] sm:static sm:shadow-none',
                    )}
                >
                    <p className="text-sm">
                        Batch ingredient cost:{' '}
                        <strong>
                            <Money amount={batchCost} />
                        </strong>
                    </p>
                    <p className="text-sm">
                        Cost per piece:{' '}
                        <strong>{yieldQty > 0 ? <Money amount={unitCost} /> : '—'}</strong>
                    </p>
                </div>
            </div>

            {children}
        </div>
    );
}
