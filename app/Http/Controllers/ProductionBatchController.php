<?php

namespace App\Http\Controllers;

use App\Jobs\DeductRawMaterialsOnBatchComplete;
use App\Models\Product;
use App\Models\ProductionBatch;
use App\Models\Recipe;
use App\Services\CurrentBranch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductionBatchController extends Controller
{
    public function __construct(
        protected CurrentBranch $currentBranch,
    ) {}

    public function index(): Response
    {
        $branchId = $this->currentBranch->id();

        return Inertia::render('ProductionBatches/Index', [
            'batches' => ProductionBatch::query()
                ->with(['product:id,name,type', 'recipe:id,product_id,expected_yield'])
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->latest()
                ->paginate(20),
            'products' => Product::query()
                ->where('type', 'produced')
                ->orderBy('name')
                ->get(['id', 'name']),
            'recipes' => Recipe::query()
                ->with('product:id,name')
                ->orderBy('id')
                ->get(['id', 'product_id', 'expected_yield']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $branchId = $this->currentBranch->id();

        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'recipe_id' => ['required', 'exists:recipes,id'],
            'batch_number' => ['required', 'string', 'max:100'],
            'planned_quantity' => ['required', 'numeric', 'min:0.001'],
            'expiry_date' => ['nullable', 'date'],
        ]);

        ProductionBatch::create([
            ...$validated,
            'branch_id' => $branchId,
            'status' => 'planned',
        ]);

        return back()->with('success', 'Production batch scheduled.');
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
            DeductRawMaterialsOnBatchComplete::dispatch($productionBatch->id);
        }

        return back()->with('success', 'Batch status updated.');
    }
}
