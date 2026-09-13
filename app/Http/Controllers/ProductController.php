<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Products/Index', [
            'products' => Product::query()->latest()->paginate(20),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Products/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:produced,trading'],
            'unit_of_measure' => ['required', 'string', 'max:50'],
            'category' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        Product::create($validated);

        return redirect()->route('tenant.products.index')
            ->with('success', 'Product created.');
    }

    public function show(Product $product): Response
    {
        $product->load('recipe.ingredients.rawMaterial');

        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:produced,trading'],
            'unit_of_measure' => ['required', 'string', 'max:50'],
            'category' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        $product->update($validated);

        return back()->with('success', 'Product updated.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $product->delete();

        return redirect()->route('tenant.products.index')
            ->with('success', 'Product deleted.');
    }
}
