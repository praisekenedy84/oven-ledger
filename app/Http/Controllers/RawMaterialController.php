<?php

namespace App\Http\Controllers;

use App\Models\RawMaterial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RawMaterialController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('RawMaterials/Index', [
            'rawMaterials' => RawMaterial::query()->latest()->paginate(20),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'unit_of_measure' => ['required', 'string', 'max:50'],
            'reorder_threshold' => ['nullable', 'numeric', 'min:0'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        RawMaterial::create($validated);

        return back()->with('success', 'Raw material created.');
    }

    public function update(Request $request, RawMaterial $rawMaterial): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'unit_of_measure' => ['required', 'string', 'max:50'],
            'reorder_threshold' => ['nullable', 'numeric', 'min:0'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
        ]);

        $rawMaterial->update($validated);

        return back()->with('success', 'Raw material updated.');
    }

    public function destroy(RawMaterial $rawMaterial): RedirectResponse
    {
        if ($rawMaterial->recipeIngredients()->exists()) {
            return back()->with('error', 'This raw material is used in a recipe and cannot be deleted.');
        }

        if ($rawMaterial->purchaseOrderItems()->exists()) {
            return back()->with('error', 'This raw material is used on a purchase order and cannot be deleted.');
        }

        if ($rawMaterial->branchStock()->where('quantity_on_hand', '>', 0)->exists()) {
            return back()->with('error', 'This raw material still has stock and cannot be deleted.');
        }

        $rawMaterial->branchStock()->delete();
        $rawMaterial->delete();

        return back()->with('success', 'Raw material deleted.');
    }
}
