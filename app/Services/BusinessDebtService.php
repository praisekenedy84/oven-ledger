<?php

namespace App\Services;

use App\Models\BusinessLiability;
use App\Models\LiabilityPayment;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BusinessDebtService
{
    public function recordPayment(
        BusinessLiability $liability,
        float $amount,
        $paidAt = null,
        ?string $notes = null,
    ): LiabilityPayment {
        $amount = round($amount, 2);

        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'Payment amount must be greater than zero.',
            ]);
        }

        return DB::transaction(function () use ($liability, $amount, $paidAt, $notes) {
            $liability = BusinessLiability::query()->lockForUpdate()->findOrFail($liability->id);

            if ($liability->status === 'settled') {
                throw ValidationException::withMessages([
                    'amount' => 'This liability is already settled.',
                ]);
            }

            $remaining = (float) $liability->balance_remaining;

            if ($amount - $remaining > 0.009) {
                throw ValidationException::withMessages([
                    'amount' => 'Payment cannot exceed the remaining balance of '.number_format($remaining, 2).'.',
                ]);
            }

            $payment = LiabilityPayment::create([
                'business_liability_id' => $liability->id,
                'amount' => $amount,
                'paid_at' => $paidAt ?? now(),
                'notes' => $notes,
            ]);

            $newBalance = round($remaining - $amount, 2);
            $liability->update([
                'balance_remaining' => $newBalance,
                'status' => $newBalance <= 0.009 ? 'settled' : 'open',
            ]);

            return $payment;
        });
    }
}
