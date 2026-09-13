<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Services\CurrentBranch;
use App\Services\CustomerLedger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CustomerLedgerController extends Controller
{
    public function __construct(
        protected CustomerLedger $ledger,
        protected CurrentBranch $currentBranch,
    ) {}

    public function store(Request $request, Customer $customer): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'entry_date' => ['nullable', 'date'],
        ]);

        $branchId = $this->currentBranch->id();

        if (! $branchId) {
            abort(422, 'Select a branch before recording a payment.');
        }

        $this->ledger->recordPayment(
            $customer,
            (float) $validated['amount'],
            $branchId,
            notes: $validated['notes'] ?? null,
            entryDate: $validated['entry_date'] ?? now(),
        );

        return back()->with('success', 'Payment recorded.');
    }
}
