<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\Recipe;
use App\Services\CatalogEconomics;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RecipeController extends Controller
{
    public function __construct(
        protected CatalogEconomics $economics,
    ) {}

    public function index(): Response
    {
        $recipes = Recipe::query()
            ->whereHas('product')
            ->with([
                'product:id,name,type',
                'ingredients:id,recipe_id,raw_material_id,quantity,unit',
                'ingredients.rawMaterial:id,name,unit_of_measure,unit_cost',
            ])
            ->latest()
            ->paginate(20)
            ->through(function (Recipe $recipe) {
                $cost = $this->economics->recipeCost($recipe);

                return [
                    ...$recipe->toArray(),
                    'batch_cost' => $cost['batch_cost'],
                    'unit_cost' => $cost['unit_cost'],
                ];
            });

        return Inertia::render('Recipes/Index', [
            'recipes' => $recipes,
            'products' => Product::query()
                ->where('type', 'produced')
                ->whereDoesntHave('recipe')
                ->orderBy('name')
                ->get(['id', 'name']),
            'rawMaterials' => RawMaterial::query()
                ->orderBy('name')
                ->get(['id', 'name', 'unit_of_measure', 'unit_cost']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'expected_yield' => ['required', 'numeric', 'min:0.001'],
            'ingredients' => ['required', 'array', 'min:1'],
            'ingredients.*.raw_material_id' => ['required', 'exists:raw_materials,id'],
            'ingredients.*.quantity' => ['required', 'numeric', 'min:0.001'],
            'ingredients.*.unit' => ['required', 'string', 'max:50'],
        ]);

        $product = Product::query()->findOrFail($validated['product_id']);

        if ($product->isHardware()) {
            return back()->withErrors(['product_id' => 'Hardware items do not use recipes.']);
        }

        if ($product->recipe) {
            return back()->withErrors(['product_id' => 'This product already has a recipe.']);
        }

        DB::transaction(function () use ($validated) {
            $recipe = Recipe::create([
                'product_id' => $validated['product_id'],
                'expected_yield' => $validated['expected_yield'],
            ]);

            $recipe->syncIngredients($validated['ingredients']);
        });

        return back()->with('success', 'Recipe created.');
    }

    public function show(Recipe $recipe): Response
    {
        $recipe->load(['product.priceLists', 'ingredients.rawMaterial']);

        return Inertia::render('Recipes/Show', [
            'recipe' => $recipe,
            'cost' => $this->economics->recipeCost($recipe),
            'prices' => $recipe->product ? $this->economics->priceMap($recipe->product) : null,
            'rawMaterials' => RawMaterial::query()
                ->orderBy('name')
                ->get(['id', 'name', 'unit_of_measure', 'unit_cost']),
        ]);
    }

    public function update(Request $request, Recipe $recipe): RedirectResponse
    {
        $validated = $request->validate([
            'expected_yield' => ['required', 'numeric', 'min:0.001'],
            'ingredients' => ['required', 'array', 'min:1'],
            'ingredients.*.raw_material_id' => ['required', 'exists:raw_materials,id'],
            'ingredients.*.quantity' => ['required', 'numeric', 'min:0.001'],
            'ingredients.*.unit' => ['required', 'string', 'max:50'],
        ]);

        DB::transaction(function () use ($recipe, $validated) {
            $recipe->update([
                'expected_yield' => $validated['expected_yield'],
            ]);

            $recipe->syncIngredients($validated['ingredients']);
        });

        return back()->with('success', 'Recipe updated.');
    }

    public function destroy(Recipe $recipe): RedirectResponse
    {
        $recipe->load('product');

        if ($recipe->product?->requiresRecipe()) {
            return back()->with('error', 'Baked products must keep a recipe so ingredient cost stays locked. Edit it instead.');
        }

        if ($recipe->productionBatches()->exists()) {
            return back()->with('error', 'This recipe is used by production batches and cannot be deleted.');
        }

        $recipe->delete();

        return redirect()->route('tenant.recipes.index')
            ->with('success', 'Recipe deleted.');
    }
}
