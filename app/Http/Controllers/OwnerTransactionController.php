<?php

namespace App\Http\Controllers;

use App\Models\OwnerTransaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class OwnerTransactionController extends Controller
{
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
