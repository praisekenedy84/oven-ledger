<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\RedirectResponse;

class OrderController extends Controller
{
    public function fulfill(Order $order): RedirectResponse
    {
        if ($order->status === 'completed') {
            return back()->with('success', 'Order is already fulfilled.');
        }

        $order->update(['status' => 'completed']);

        return back()->with('success', 'Order marked as fulfilled.');
    }
}
