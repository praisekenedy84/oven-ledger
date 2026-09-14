<?php

namespace App\Http\Controllers;

use App\Models\OwnerTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OwnerTransactionController extends Controller
{
    public function index(): Response
    {
        $ownerTotals = OwnerTransaction::query()
            ->selectRaw("
                COALESCE(SUM(CASE WHEN type = 'capital_injection' THEN amount ELSE 0 END), 0) as capital_in,
                COALESCE(SUM(CASE WHEN type = 'drawing' THEN amount ELSE 0 END), 0) as drawings
            ")
            ->first();

        $capitalIn = (float) ($ownerTotals?->capital_in ?? 0);
        $drawings = (float) ($ownerTotals?->drawings ?? 0);

        return Inertia::render('Capital/Index', [
            'ownerTransactions' => OwnerTransaction::query()
                ->latest('transacted_at')
                ->paginate(20)
                ->withQueryString(),
            'totals' => [
                'capital_in' => $capitalIn,
                'drawings' => $drawings,
                'capital_remaining' => round($capitalIn - $drawings, 2),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:capital_injection,drawing'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'transacted_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        OwnerTransaction::create([
            ...$validated,
            'transacted_at' => $validated['transacted_at'] ?? now(),
        ]);

        $label = $validated['type'] === 'drawing' ? 'Drawing' : 'Capital injection';

        return back()->with('success', $label.' recorded.');
    }
}
