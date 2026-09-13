<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BusinessLiability;
use App\Models\OwnerTransaction;
use App\Services\BusinessDebtService;
use App\Services\CurrentBranch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BusinessLiabilityController extends Controller
{
    public function __construct(
        protected BusinessDebtService $debts,
        protected CurrentBranch $currentBranch,
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->input('status', 'open');

        $liabilities = BusinessLiability::query()
            ->with('branch:id,name')
            ->withCount('payments')
            ->when($status && $status !== 'all', fn ($q) => $q->where('status', $status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $ownerTransactions = OwnerTransaction::query()
            ->latest('transacted_at')
            ->paginate(20, ['*'], 'owner_page')
            ->withQueryString();

        return Inertia::render('Debts/Index', [
            'liabilities' => $liabilities,
            'ownerTransactions' => $ownerTransactions,
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'status' => $status,
            ],
            'totals' => [
                'payables_open' => (float) BusinessLiability::query()
                    ->where('status', 'open')
                    ->sum('balance_remaining'),
                'capital_in' => (float) OwnerTransaction::query()
                    ->where('type', 'capital_injection')
                    ->sum('amount'),
                'drawings' => (float) OwnerTransaction::query()
                    ->where('type', 'drawing')
                    ->sum('amount'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:supplier_credit,loan,other'],
            'creditor_name' => ['required', 'string', 'max:255'],
            'original_amount' => ['required', 'numeric', 'min:0.01'],
            'due_date' => ['nullable', 'date'],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $amount = round((float) $validated['original_amount'], 2);

        BusinessLiability::create([
            ...$validated,
            'original_amount' => $amount,
            'balance_remaining' => $amount,
            'status' => 'open',
            'branch_id' => $validated['branch_id'] ?? $this->currentBranch->id(),
        ]);

        return back()->with('success', 'Liability recorded.');
    }

    public function storePayment(Request $request, BusinessLiability $liability): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'paid_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->debts->recordPayment(
            $liability,
            (float) $validated['amount'],
            $validated['paid_at'] ?? now(),
            $validated['notes'] ?? null,
        );

        return back()->with('success', 'Payment recorded.');
    }
}
