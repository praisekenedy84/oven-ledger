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
        if (! Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('branch_id')->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('orders', 'voided_by')) {
                $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('orders', 'voided_at')) {
                $table->timestamp('voided_at')->nullable();
            }

            if (! Schema::hasColumn('orders', 'void_reason')) {
                $table->string('void_reason')->nullable();
            }

            if (! Schema::hasColumn('orders', 'stock_deducted')) {
                $table->boolean('stock_deducted')->default(false);
            }
        });

        if (Schema::hasColumn('orders', 'created_by')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index(['created_by', 'created_at'], 'orders_cashier_created_idx');
            });
        }

        $ownerId = DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->where('roles.name', 'owner')
            ->value('user_roles.user_id');

        if ($ownerId) {
            DB::table('orders')->whereNull('created_by')->update(['created_by' => $ownerId]);
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('orders')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'created_by')) {
                $table->dropIndex('orders_cashier_created_idx');
                $table->dropConstrainedForeignId('created_by');
            }

            if (Schema::hasColumn('orders', 'voided_by')) {
                $table->dropConstrainedForeignId('voided_by');
            }

            foreach (['voided_at', 'void_reason', 'stock_deducted'] as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
