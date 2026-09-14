<?php

namespace App\Http\Controllers;

use App\Models\BranchFinishedGoodsStock;
use App\Models\BranchRawMaterialStock;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\RawMaterialStockMovement;
use App\Models\WasteLog;
use App\Services\CurrentBranch;
use App\Services\FeatureGate;
use App\Services\FinishedGoodsInventory;
use App\Services\RawMaterialInventory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function __construct(
        protected CurrentBranch $currentBranch,
        protected RawMaterialInventory $rawMaterialInventory,
        protected FinishedGoodsInventory $finishedGoodsInventory,
        protected FeatureGate $featureGate,
    ) {}

    public function index(Request $request): Response
    {
        $branchId = $this->currentBranch->id();
        $materialId = $request->integer('raw_material_id') ?: null;
        $simpleStock = ! $this->featureGate->enabled('production_module');

        return Inertia::render('Inventory/Index', [
            'simpleStock' => $simpleStock,
            'rawMaterialStock' => BranchRawMaterialStock::query()
                ->with('rawMaterial:id,name,unit_of_measure,reorder_threshold,unit_cost')
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->get(),
            'finishedGoodsStock' => $this->finishedGoodsInventory->shelfSnapshot($branchId),
            'products' => Product::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'reorder_threshold', 'unit_of_measure']),
            'rawMaterials' => RawMaterial::query()
                ->orderBy('name')
                ->get(['id', 'name', 'unit_of_measure', 'unit_cost']),
            'movements' => RawMaterialStockMovement::query()
                ->with('rawMaterial:id,name,unit_of_measure')
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->when($materialId, fn ($q) => $q->where('raw_material_id', $materialId))
                ->orderByDesc('occurred_at')
                ->orderByDesc('id')
                ->paginate(15)
                ->withQueryString(),
            'filters' => [
                'raw_material_id' => $materialId,
            ],
        ]);
    }

    public function restock(Request $request): RedirectResponse
    {
        $branchId = $this->currentBranch->id();

        if (! $branchId) {
            return back()->withErrors([
                'raw_material_id' => 'Select a branch before restocking.',
            ]);
        }

        $validated = $request->validate([
            'raw_material_id' => ['required', 'exists:raw_materials,id'],
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'unit_cost' => ['nullable', 'numeric', 'min:0'],
            'occurred_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->rawMaterialInventory->restock(
            $branchId,
            (int) $validated['raw_material_id'],
            (float) $validated['quantity'],
            isset($validated['unit_cost']) && $validated['unit_cost'] !== ''
                ? (float) $validated['unit_cost']
                : null,
            $validated['notes'] ?? null,
            $validated['occurred_at'] ?? now(),
        );

        return back()->with('success', 'Raw material restocked.');
    }

    public function receiveFinished(Request $request): RedirectResponse
    {
        if ($this->featureGate->enabled('production_module')) {
            abort(403, 'This bakery uses production batches to put goods on the shelf.');
        }

        $branchId = $this->currentBranch->id();

        if (! $branchId) {
            return back()->withErrors([
                'product_id' => 'Select a branch before adding product stock.',
            ]);
        }

        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->finishedGoodsInventory->receive(
            $branchId,
            (int) $validated['product_id'],
            (float) $validated['quantity'],
            $validated['notes'] ?? null,
        );

        return back()->with('success', 'Product stock added to the shelf.');
    }

    public function logRawWaste(Request $request): RedirectResponse
    {
        $branchId = $this->currentBranch->id();

        if (! $branchId) {
            return back()->withErrors([
                'raw_material_id' => 'Select a branch before logging waste.',
            ]);
        }

        $validated = $request->validate([
            'raw_material_id' => ['required', 'exists:raw_materials,id'],
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'reason' => ['required', 'in:expired,damaged,spillage,other'],
            'occurred_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->rawMaterialInventory->writeOff(
            $branchId,
            (int) $validated['raw_material_id'],
            (float) $validated['quantity'],
            $validated['reason'],
            $validated['notes'] ?? null,
            $validated['occurred_at'] ?? now(),
        );

        return back()->with('success', 'Raw material waste logged.');
    }

    public function logWaste(Request $request): RedirectResponse
    {
        $branchId = $this->currentBranch->id();

        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'reason' => ['required', 'in:expired,damaged,given_away'],
        ]);

        WasteLog::create([
            ...$validated,
            'branch_id' => $branchId,
            'logged_at' => now(),
        ]);

        $stock = BranchFinishedGoodsStock::query()
            ->where('branch_id', $branchId)
            ->where('product_id', $validated['product_id'])
            ->first();

        $stock?->decrement('quantity_on_hand', $validated['quantity']);

        return back()->with('success', 'Waste logged.');
    }
}
