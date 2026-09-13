<?php

namespace App\Http\Controllers;

use App\Models\BranchFinishedGoodsStock;
use App\Models\Product;
use App\Models\BranchRawMaterialStock;
use App\Models\WasteLog;
use App\Services\CurrentBranch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function __construct(
        protected CurrentBranch $currentBranch,
    ) {}

    public function index(): Response
    {
        $branchId = $this->currentBranch->id();

        return Inertia::render('Inventory/Index', [
            'rawMaterialStock' => BranchRawMaterialStock::query()
                ->with('rawMaterial')
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->get(),
            'finishedGoodsStock' => BranchFinishedGoodsStock::query()
                ->with('product')
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->get(),
            'products' => Product::query()->orderBy('name')->get(),
        ]);
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
