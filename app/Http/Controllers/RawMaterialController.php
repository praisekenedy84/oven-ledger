<?php

namespace App\Http\Controllers;

use App\Models\RawMaterial;
use App\Models\RawMaterialStockMovement;
use App\Services\CatalogEconomics;
use App\Services\CurrentBranch;
use App\Services\RawMaterialInventory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RawMaterialController extends Controller
{
    public function __construct(
        protected CurrentBranch $currentBranch,
        protected RawMaterialInventory $rawMaterialInventory,
        protected CatalogEconomics $economics,
    ) {}

    public function index(): Response
    {
        $branchId = $this->currentBranch->id();

        return Inertia::render('RawMaterials/Index', [
            'rawMaterials' => RawMaterial::query()
                ->with(['branchStock' => fn ($query) => $query->when(
                    $branchId,
                    fn ($inner) => $inner->where('branch_id', $branchId)
                )])
                ->latest()
                ->paginate(20)
                ->through(function (RawMaterial $material) {
                    return [
                        ...$material->only([
                            'id', 'name', 'unit_of_measure', 'reorder_threshold', 'unit_cost',
                        ]),
                        'quantity_on_hand' => (float) ($material->branchStock->first()?->quantity_on_hand ?? 0),
                    ];
                }),
        ]);
    }

    public function show(RawMaterial $rawMaterial): Response
    {
        $branchId = $this->currentBranch->id();

        $rawMaterial->load(['branchStock' => fn ($query) => $query->when(
            $branchId,
            fn ($inner) => $inner->where('branch_id', $branchId)
        )]);

        return Inertia::render('RawMaterials/Show', [
            'rawMaterial' => [
                ...$rawMaterial->only([
                    'id', 'name', 'unit_of_measure', 'reorder_threshold', 'unit_cost',
                ]),
                'quantity_on_hand' => (float) ($rawMaterial->branchStock->first()?->quantity_on_hand ?? 0),
            ],
            'movements' => RawMaterialStockMovement::query()
                ->where('raw_material_id', $rawMaterial->id)
                ->when($branchId, fn ($query) => $query->where('branch_id', $branchId))
                ->orderByDesc('occurred_at')
                ->orderByDesc('id')
                ->paginate(20)
                ->withQueryString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'unit_of_measure' => ['required', 'string', 'max:50'],
            'reorder_threshold' => ['nullable', 'numeric', 'min:0'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'current_stock' => ['nullable', 'numeric', 'min:0'],
        ]);

        $currentStock = isset($validated['current_stock']) && $validated['current_stock'] !== ''
            ? (float) $validated['current_stock']
            : 0.0;

        unset($validated['current_stock']);

        if ($currentStock > 0 && ! $this->currentBranch->id()) {
            return back()->withErrors([
                'current_stock' => 'Select a branch before recording current stock.',
            ])->withInput();
        }

        DB::transaction(function () use ($validated, $currentStock) {
            $material = RawMaterial::create($validated);

            if ($currentStock > 0) {
                $this->rawMaterialInventory->openingBalance(
                    (int) $this->currentBranch->id(),
                    $material->id,
                    $currentStock,
                    isset($validated['unit_cost']) && $validated['unit_cost'] !== ''
                        ? (float) $validated['unit_cost']
                        : null,
                );
            }
        });

        $this->economics->forgetUnitCostMap();

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

        $this->economics->forgetUnitCostMap();

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

        if ($rawMaterial->stockMovements()->exists()) {
            return back()->with('error', 'This raw material has stock history and cannot be deleted.');
        }

        $rawMaterial->branchStock()->delete();
        $rawMaterial->delete();

        $this->economics->forgetUnitCostMap();

        return back()->with('success', 'Raw material deleted.');
    }
}
