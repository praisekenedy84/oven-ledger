<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\FinishedGoodsInventory;
use App\Services\SaleCorrection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function fulfill(Order $order, FinishedGoodsInventory $inventory): RedirectResponse
    {
        if ($order->isVoided()) {
            throw ValidationException::withMessages([
                'order' => 'A voided sale cannot be fulfilled.',
            ]);
        }

        if ($order->status === 'completed') {
            return back()->with('success', 'Order is already fulfilled.');
        }

        DB::transaction(function () use ($order, $inventory) {
            $locked = Order::query()->lockForUpdate()->findOrFail($order->id);

            if ($locked->status === 'completed') {
                return;
            }

            $locked->update(['status' => 'completed']);
            $inventory->deductForOrder($locked);
        });

        return back()->with('success', 'Order marked as fulfilled.');
    }

    public function void(Request $request, Order $order, SaleCorrection $correction): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:255'],
        ]);

        $correction->void($order, $request->user(), $validated['reason']);

        return back()->with('success', 'Sale voided. Ring it again if it still needs to be sold.');
    }
}
