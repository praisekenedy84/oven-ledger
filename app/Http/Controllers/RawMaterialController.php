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
        ]);

        $rawMaterial->update($validated);

        return back()->with('success', 'Raw material updated.');
    }
}
