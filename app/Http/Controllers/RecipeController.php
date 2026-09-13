<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RecipeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Recipes/Index', [
            'recipes' => Recipe::query()->with(['product', 'ingredients.rawMaterial'])->latest()->paginate(20),
            'products' => Product::query()->where('type', 'produced')->orderBy('name')->get(),
            'rawMaterials' => RawMaterial::query()->orderBy('name')->get(),
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

        DB::transaction(function () use ($validated) {
            $recipe = Recipe::create([
                'product_id' => $validated['product_id'],
                'expected_yield' => $validated['expected_yield'],
            ]);

            foreach ($validated['ingredients'] as $ingredient) {
                RecipeIngredient::create([
                    'recipe_id' => $recipe->id,
                    'raw_material_id' => $ingredient['raw_material_id'],
                    'quantity' => $ingredient['quantity'],
                    'unit' => $ingredient['unit'],
                ]);
            }
        });

        return back()->with('success', 'Recipe created.');
    }

    public function show(Recipe $recipe): Response
    {
        $recipe->load(['product', 'ingredients.rawMaterial']);

        return Inertia::render('Recipes/Show', [
            'recipe' => $recipe,
            'products' => Product::where('type', 'produced')->get(),
        ]);
    }
}
