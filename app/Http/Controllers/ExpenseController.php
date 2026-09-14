<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\OperatingExpense;
use App\Services\CurrentBranch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function __construct(
        protected CurrentBranch $currentBranch,
    ) {}

    public function index(Request $request): Response
    {
        $category = trim((string) $request->input('category', ''));
        $monthStart = now()->startOfMonth();

        $query = OperatingExpense::query()
            ->with(['branch:id,name', 'recordedBy:id,name'])
            ->when($category !== '', fn ($q) => $q->where('category', $category))
            ->latest('incurred_at');

        $monthTotal = (float) OperatingExpense::query()
            ->where('incurred_at', '>=', $monthStart)
            ->sum('amount');

        $allTime = (float) OperatingExpense::query()->sum('amount');

        $byCategory = OperatingExpense::query()
            ->selectRaw('category, SUM(amount) as total')
            ->where('incurred_at', '>=', $monthStart)
            ->groupBy('category')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'category' => $row->category,
                'label' => OperatingExpense::categoryLabel($row->category),
                'total' => round((float) $row->total, 2),
            ]);

        return Inertia::render('Expenses/Index', [
            'expenses' => $query->paginate(20)->withQueryString(),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'categories' => OperatingExpense::categoryOptions(),
            'filters' => [
                'category' => $category,
            ],
            'totals' => [
                'this_month' => round($monthTotal, 2),
                'all_time' => round($allTime, 2),
                'by_category' => $byCategory,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'category' => ['required', Rule::in(array_keys(OperatingExpense::CATEGORIES))],
            'payee' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'incurred_at' => ['nullable', 'date'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        OperatingExpense::query()->create([
            'category' => $validated['category'],
            'payee' => $validated['payee'],
            'amount' => round((float) $validated['amount'], 2),
            'incurred_at' => $validated['incurred_at'] ?? now(),
            'notes' => $validated['notes'] ?? null,
            'branch_id' => $validated['branch_id'] ?? $this->currentBranch->id(),
            'created_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Expense recorded.');
    }
}
