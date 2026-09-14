<?php

namespace App\Http\Controllers;

use App\Jobs\DeductRawMaterialsOnBatchComplete;
use App\Models\Product;
use App\Models\ProductionBatch;
use App\Services\CurrentBranch;
use App\Services\ProductionInventory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductionBatchController extends Controller
{
    public function __construct(
        protected CurrentBranch $currentBranch,
        protected ProductionInventory $productionInventory,
    ) {}

    public function index(): Response
    {
        $branchId = $this->currentBranch->id();
        $this->productionInventory->postOutstanding($branchId);

        return Inertia::render('ProductionBatches/Index', [
            'batches' => ProductionBatch::query()
                ->with(['product:id,name,type', 'recipe:id,product_id,expected_yield'])
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->latest()
                ->paginate(20),
            'products' => Product::query()
                ->where('type', 'produced')
                ->whereHas('recipe')
                ->with('recipe:id,product_id,expected_yield')
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $branchId = $this->currentBranch->id();

        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'planned_quantity' => ['required', 'numeric', 'min:0.001'],
            'expiry_date' => ['nullable', 'date'],
        ]);

        $product = Product::query()->with('recipe')->findOrFail($validated['product_id']);

        if ($product->isHardware() || ! $product->recipe) {
            return back()->withErrors([
                'product_id' => 'Pick a baked product that already has a recipe.',
            ]);
        }

        $batch = ProductionBatch::create([
            'product_id' => $product->id,
            'recipe_id' => $product->recipe->id,
            'planned_quantity' => $validated['planned_quantity'],
            'expiry_date' => $validated['expiry_date'] ?? null,
            'branch_id' => $branchId,
            'status' => 'planned',
        ]);

        return back()->with('success', "Production batch {$batch->batch_number} scheduled.");
    }

    public function transition(Request $request, ProductionBatch $productionBatch): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:baking,cooling,ready,dispatched'],
            'actual_quantity' => ['nullable', 'numeric', 'min:0'],
        ]);

        if (! $productionBatch->canTransitionTo($validated['status'])) {
            return back()->withErrors(['status' => 'Invalid status transition.']);
        }

        $productionBatch->update([
            'status' => $validated['status'],
            'actual_quantity' => $validated['actual_quantity'] ?? $productionBatch->actual_quantity,
            'produced_at' => in_array($validated['status'], ['ready', 'dispatched'], true)
                ? now()
                : $productionBatch->produced_at,
        ]);

        if (in_array($validated['status'], ['ready', 'dispatched'], true)) {
            $this->productionInventory->postCompletedBatch($productionBatch->fresh());
            DeductRawMaterialsOnBatchComplete::dispatch($productionBatch->id);
        }

        return back()->with('success', 'Batch status updated.');
    }
}
