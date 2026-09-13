<?php

namespace Tests\Unit;

use App\Support\ReceivableAging;
use PHPUnit\Framework\TestCase;

class ReceivableAgingTest extends TestCase
{
    public function test_it_ages_unpaid_charges_fifo(): void
    {
        $asOf = '2026-09-13';

        $buckets = ReceivableAging::buckets([
            ['type' => 'charge', 'amount' => 100, 'entry_date' => '2026-05-01'],
            ['type' => 'charge', 'amount' => 50, 'entry_date' => '2026-08-20'],
            ['type' => 'payment', 'amount' => 80, 'entry_date' => '2026-08-25'],
        ], $asOf);

        $this->assertSame(70.0, $buckets['outstanding']);
        $this->assertSame(50.0, $buckets['current']);
        $this->assertSame(20.0, $buckets['days_90_plus']);
        $this->assertSame('2026-05-01', $buckets['oldest_unpaid_at']);
    }

    public function test_it_clears_aging_when_payments_cover_charges(): void
    {
        $buckets = ReceivableAging::buckets([
            ['type' => 'charge', 'amount' => 40, 'entry_date' => '2026-01-01'],
            ['type' => 'payment', 'amount' => 40, 'entry_date' => '2026-01-02'],
        ], '2026-09-13');

        $this->assertSame(0.0, $buckets['outstanding']);
        $this->assertNull($buckets['oldest_unpaid_at']);
    }
}
