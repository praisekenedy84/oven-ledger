<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerLedgerEntry;
use App\Support\ReceivableAging;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomerLedger
{
    public function outstandingBalance(Customer $customer): float
    {
        return $customer->outstandingBalance();
    }

    public function recordCharge(
        Customer $customer,
        float $amount,
        int $branchId,
        ?int $orderId = null,
        ?string $notes = null,
        $entryDate = null,
    ): CustomerLedgerEntry {
        $amount = round($amount, 2);

        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'Charge amount must be greater than zero.',
            ]);
        }

        return DB::transaction(function () use ($customer, $amount, $branchId, $orderId, $notes, $entryDate) {
            $customer = Customer::query()->lockForUpdate()->findOrFail($customer->id);
            $balance = $this->outstandingBalance($customer);
            $this->assertWithinCreditLimit($customer, $balance + $amount);

            return CustomerLedgerEntry::create([
                'customer_id' => $customer->id,
                'order_id' => $orderId,
                'branch_id' => $branchId,
                'type' => 'charge',
                'amount' => $amount,
                'balance_after' => round($balance + $amount, 2),
                'entry_date' => $entryDate ?? now(),
                'notes' => $notes,
            ]);
        });
    }

    public function recordPayment(
        Customer $customer,
        float $amount,
        int $branchId,
        ?int $orderId = null,
        ?string $notes = null,
        $entryDate = null,
    ): CustomerLedgerEntry {
        $amount = round($amount, 2);

        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'Payment amount must be greater than zero.',
            ]);
        }

        return DB::transaction(function () use ($customer, $amount, $branchId, $orderId, $notes, $entryDate) {
            $customer = Customer::query()->lockForUpdate()->findOrFail($customer->id);
            $balance = $this->outstandingBalance($customer);

            if ($amount - $balance > 0.009) {
                throw ValidationException::withMessages([
                    'amount' => 'Payment cannot exceed the outstanding balance of '.number_format($balance, 2).'.',
                ]);
            }

            return CustomerLedgerEntry::create([
                'customer_id' => $customer->id,
                'order_id' => $orderId,
                'branch_id' => $branchId,
                'type' => 'payment',
                'amount' => $amount,
                'balance_after' => round($balance - $amount, 2),
                'entry_date' => $entryDate ?? now(),
                'notes' => $notes,
            ]);
        });
    }

    public function aging(Customer $customer): array
    {
        return ReceivableAging::buckets(
            $customer->ledgerEntries()
                ->orderBy('entry_date')
                ->orderBy('id')
                ->get(['type', 'amount', 'entry_date'])
                ->map(fn (CustomerLedgerEntry $entry) => [
                    'type' => $entry->type,
                    'amount' => $entry->amount,
                    'entry_date' => $entry->entry_date,
                ])
                ->all()
        );
    }

    public function assertWithinCreditLimit(Customer $customer, float $projectedBalance): void
    {
        if ($customer->credit_limit === null) {
            return;
        }

        $limit = (float) $customer->credit_limit;

        if ($projectedBalance - $limit > 0.009) {
            throw ValidationException::withMessages([
                'customer_id' => 'This charge would exceed '.$customer->name.'\'s credit limit of '.number_format($limit, 2).'.',
            ]);
        }
    }
}
