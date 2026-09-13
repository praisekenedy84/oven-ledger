<?php

namespace App\Support;

use DateTimeInterface;
use Illuminate\Support\Carbon;

class ReceivableAging
{
    /**
     * Allocate payments against charges FIFO and bucket the unpaid remainder.
     *
     * @param  iterable<int, array{type: string, amount: float|string, entry_date: DateTimeInterface|string}>  $entries
     * @return array{current: float, days_31_60: float, days_61_90: float, days_90_plus: float, oldest_unpaid_at: ?string, outstanding: float}
     */
    public static function buckets(iterable $entries, DateTimeInterface|string|null $asOf = null): array
    {
        $asOf = Carbon::parse($asOf ?? now())->startOfDay();
        $openCharges = [];

        foreach ($entries as $entry) {
            $type = $entry['type'] ?? null;
            $amount = round((float) ($entry['amount'] ?? 0), 2);
            $date = Carbon::parse($entry['entry_date']);

            if ($type === 'charge' && $amount > 0) {
                $openCharges[] = ['remaining' => $amount, 'date' => $date];
                continue;
            }

            if ($type !== 'payment' || $amount <= 0) {
                continue;
            }

            foreach ($openCharges as $index => $charge) {
                if ($amount <= 0) {
                    break;
                }

                $applied = min($charge['remaining'], $amount);
                $openCharges[$index]['remaining'] = round($charge['remaining'] - $applied, 2);
                $amount = round($amount - $applied, 2);
            }

            $openCharges = array_values(array_filter(
                $openCharges,
                fn (array $charge) => $charge['remaining'] > 0
            ));
        }

        $buckets = [
            'current' => 0.0,
            'days_31_60' => 0.0,
            'days_61_90' => 0.0,
            'days_90_plus' => 0.0,
            'oldest_unpaid_at' => null,
            'outstanding' => 0.0,
        ];

        foreach ($openCharges as $charge) {
            $days = $charge['date']->startOfDay()->diffInDays($asOf);
            $remaining = $charge['remaining'];
            $buckets['outstanding'] = round($buckets['outstanding'] + $remaining, 2);

            if ($buckets['oldest_unpaid_at'] === null || $charge['date']->lt($buckets['oldest_unpaid_at'])) {
                $buckets['oldest_unpaid_at'] = $charge['date']->toDateString();
            }

            if ($days <= 30) {
                $buckets['current'] = round($buckets['current'] + $remaining, 2);
            } elseif ($days <= 60) {
                $buckets['days_31_60'] = round($buckets['days_31_60'] + $remaining, 2);
            } elseif ($days <= 90) {
                $buckets['days_61_90'] = round($buckets['days_61_90'] + $remaining, 2);
            } else {
                $buckets['days_90_plus'] = round($buckets['days_90_plus'] + $remaining, 2);
            }
        }

        return $buckets;
    }
}
