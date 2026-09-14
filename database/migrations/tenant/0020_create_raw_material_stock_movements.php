<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('raw_material_stock_movements')) {
            Schema::create('raw_material_stock_movements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
                $table->foreignId('raw_material_id')->constrained()->cascadeOnDelete();
                $table->string('type');
                $table->decimal('quantity', 15, 3);
                $table->decimal('quantity_after', 15, 3);
                $table->decimal('unit_cost', 15, 2)->nullable();
                $table->string('reference_type')->nullable();
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->string('notes')->nullable();
                $table->timestamp('occurred_at');
                $table->timestamps();

                $table->index(['branch_id', 'raw_material_id', 'occurred_at'], 'raw_movements_branch_material_time_idx');
                $table->index(['reference_type', 'reference_id'], 'raw_movements_reference_idx');
            });
        }

        if (! Schema::hasTable('branch_raw_material_stock')) {
            return;
        }

        $now = now();

        DB::table('branch_raw_material_stock')
            ->orderBy('id')
            ->each(function (object $stock) use ($now): void {
                $quantity = (float) $stock->quantity_on_hand;

                $alreadyRecorded = DB::table('raw_material_stock_movements')
                    ->where('branch_id', $stock->branch_id)
                    ->where('raw_material_id', $stock->raw_material_id)
                    ->exists();

                if ($alreadyRecorded || $quantity == 0.0) {
                    return;
                }

                DB::table('raw_material_stock_movements')->insert([
                    'branch_id' => $stock->branch_id,
                    'raw_material_id' => $stock->raw_material_id,
                    'type' => 'opening',
                    'quantity' => $quantity,
                    'quantity_after' => $quantity,
                    'unit_cost' => null,
                    'reference_type' => null,
                    'reference_id' => null,
                    'notes' => 'Opening balance',
                    'occurred_at' => $stock->created_at ?? $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('raw_material_stock_movements');
    }
};
