<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\RawMaterial;
use App\Models\Recipe;
use App\Services\CatalogEconomics;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(
        protected CatalogEconomics $economics,
    ) {}

    public function index(): Response
    {
        $products = Product::query()
            ->with(['priceLists', 'recipe.ingredients.rawMaterial', 'productCategory'])
            ->latest()
            ->paginate(20)
            ->through(function (Product $product) {
                $prices = $this->economics->priceMap($product);

                return [
                    ...$product->toArray(),
                    'retail_price' => $prices['retail'],
                    'wholesale_price' => $prices['wholesale'],
                    'restaurant_price' => $prices['restaurant'],
                    'unit_cost' => $this->economics->unitCostForProduct($product),
                    'category' => $product->productCategory?->name ?? $product->category,
                ];
            });

        return Inertia::render('Products/Index', [
            'products' => $products,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Products/Create', $this->formOptions());
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);
        $category = ProductCategory::query()->findOrFail($validated['product_category_id']);

        DB::transaction(function () use ($validated, $category) {
            $product = Product::create([
                'name' => $validated['name'],
                'type' => $category->productType(),
                'unit_of_measure' => $validated['unit_of_measure'],
                'category' => $category->name,
                'product_category_id' => $category->id,
                'cost_price' => $category->isHardware() ? ($validated['cost_price'] ?? null) : null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            $this->economics->syncPrices($product, $validated['prices'] ?? []);

            if ($category->isProduced()) {
                $recipe = Recipe::create([
                    'product_id' => $product->id,
                    'expected_yield' => $validated['expected_yield'],
                ]);
                $recipe->syncIngredients($validated['ingredients']);
            }
        });

        return redirect()->route('tenant.products.index')
            ->with('success', 'Product created.');
    }

    public function show(Product $product): Response
    {
        $product->load(['priceLists', 'recipe.ingredients.rawMaterial', 'productCategory']);

        $prices = $this->economics->priceMap($product);
        $unitCost = $this->economics->unitCostForProduct($product);
        $recipeCost = $product->recipe ? $this->economics->recipeCost($product->recipe) : null;

        return Inertia::render('Products/Show', [
            ...$this->formOptions(),
            'product' => $product,
            'prices' => $prices,
            'unitCost' => $unitCost,
            'recipeCost' => $recipeCost,
            'margins' => collect(CatalogEconomics::CHANNELS)->mapWithKeys(function (string $channel) use ($prices, $unitCost) {
                $price = $prices[$channel];

                return [
                    $channel => $price === null ? null : round((float) $price - $unitCost, 2),
                ];
            })->all(),
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $this->validated($request);
        $category = ProductCategory::query()->findOrFail($validated['product_category_id']);

        DB::transaction(function () use ($product, $validated, $category) {
            $product->update([
                'name' => $validated['name'],
                'type' => $category->productType(),
                'unit_of_measure' => $validated['unit_of_measure'],
                'category' => $category->name,
                'product_category_id' => $category->id,
                'cost_price' => $category->isHardware() ? ($validated['cost_price'] ?? null) : null,
                'is_active' => $validated['is_active'] ?? $product->is_active,
            ]);

            $this->economics->syncPrices($product, $validated['prices'] ?? []);

            if ($category->isProduced()) {
                $recipe = $product->recipe ?? new Recipe(['product_id' => $product->id]);
                $recipe->expected_yield = $validated['expected_yield'];
                $recipe->save();
                $recipe->syncIngredients($validated['ingredients']);
            }
        });

        return back()->with('success', 'Product updated.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $recipe = $product->recipe;

        if ($recipe && ! $recipe->productionBatches()->exists()) {
            $recipe->delete();
        }

        $product->delete();

        return redirect()->route('tenant.products.index')
            ->with('success', 'Product deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function formOptions(): array
    {
        return [
            'categories' => ProductCategory::query()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name', 'kind', 'is_system']),
            'rawMaterials' => RawMaterial::query()
                ->orderBy('name')
                ->get(['id', 'name', 'unit_of_measure', 'unit_cost']),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        $category = ProductCategory::query()->find($request->input('product_category_id'));
        $requiresRecipe = $category?->isProduced() ?? false;

        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'product_category_id' => ['required', 'exists:product_categories,id'],
            'unit_of_measure' => ['required', 'string', 'max:50'],
            'cost_price' => [Rule::requiredIf(fn () => $category?->isHardware() ?? false), 'nullable', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'prices' => ['nullable', 'array'],
            'prices.retail' => ['nullable', 'numeric', 'min:0'],
            'prices.wholesale' => ['nullable', 'numeric', 'min:0'],
            'prices.restaurant' => ['nullable', 'numeric', 'min:0'],
            'expected_yield' => [$requiresRecipe ? 'required' : 'nullable', 'numeric', 'min:0.001'],
            'ingredients' => [$requiresRecipe ? 'required' : 'nullable', 'array', $requiresRecipe ? 'min:1' : 'nullable'],
            'ingredients.*.raw_material_id' => [$requiresRecipe ? 'required' : 'nullable', 'exists:raw_materials,id'],
            'ingredients.*.quantity' => [$requiresRecipe ? 'required' : 'nullable', 'numeric', 'min:0.001'],
            'ingredients.*.unit' => [$requiresRecipe ? 'required' : 'nullable', 'string', 'max:50'],
        ]);
    }
}
