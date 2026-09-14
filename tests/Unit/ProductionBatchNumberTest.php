<?php

namespace Tests\Unit;

use App\Models\ProductionBatch;
use PHPUnit\Framework\TestCase;

class ProductionBatchNumberTest extends TestCase
{
    public function test_first_batch_of_the_day_starts_at_0001(): void
    {
        $this->assertSame(
            'PB-20260914-0001',
            ProductionBatch::nextNumberAfter('PB-20260914-', null),
        );
    }

    public function test_it_increments_the_daily_sequence(): void
    {
        $this->assertSame(
            'PB-20260914-0003',
            ProductionBatch::nextNumberAfter('PB-20260914-', 'PB-20260914-0002'),
        );
    }

    public function test_it_ignores_non_numeric_suffixes(): void
    {
        $this->assertSame(
            'PB-20260914-0001',
            ProductionBatch::nextNumberAfter('PB-20260914-', 'PB-20260914-legacy'),
        );
    }
}
