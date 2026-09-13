<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index(['branch_id', 'status', 'created_at'], 'orders_branch_status_created_idx');
                $table->index(['branch_id', 'status', 'channel'], 'orders_branch_status_channel_idx');

                if (Schema::hasColumn('orders', 'is_pre_order')) {
                    $table->index(['branch_id', 'is_pre_order', 'status'], 'orders_branch_preorder_status_idx');
                }
            });
        }

        if (Schema::hasTable('production_batches')) {
            Schema::table('production_batches', function (Blueprint $table) {
                $table->index(['branch_id', 'status'], 'production_batches_branch_status_idx');
            });
        }

        if (Schema::hasTable('customer_ledger_entries')) {
            Schema::table('customer_ledger_entries', function (Blueprint $table) {
                $table->index(['customer_id', 'type'], 'customer_ledger_customer_type_idx');
            });
        }

        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                $table->index('is_active', 'products_is_active_idx');
            });
        }

        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->index('is_active', 'customers_is_active_idx');
                $table->index('type', 'customers_type_idx');
            });
        }

        if (Schema::hasTable('business_liabilities')) {
            Schema::table('business_liabilities', function (Blueprint $table) {
                $table->index('status', 'business_liabilities_status_idx');
            });
        }

        if (Schema::hasTable('branch_finished_goods_stock')) {
            Schema::table('branch_finished_goods_stock', function (Blueprint $table) {
                $table->index(['branch_id', 'product_id'], 'fg_stock_branch_product_idx');
            });
        }
    }

    public function down(): void
    {
        $this->dropIndexIfExists('orders', 'orders_branch_status_created_idx');
        $this->dropIndexIfExists('orders', 'orders_branch_status_channel_idx');
        $this->dropIndexIfExists('orders', 'orders_branch_preorder_status_idx');
        $this->dropIndexIfExists('production_batches', 'production_batches_branch_status_idx');
        $this->dropIndexIfExists('customer_ledger_entries', 'customer_ledger_customer_type_idx');
        $this->dropIndexIfExists('products', 'products_is_active_idx');
        $this->dropIndexIfExists('customers', 'customers_is_active_idx');
        $this->dropIndexIfExists('customers', 'customers_type_idx');
        $this->dropIndexIfExists('business_liabilities', 'business_liabilities_status_idx');
        $this->dropIndexIfExists('branch_finished_goods_stock', 'fg_stock_branch_product_idx');
    }

    protected function dropIndexIfExists(string $table, string $index): void
    {
        if (! Schema::hasTable($table)) {
            return;
        }

        Schema::table($table, function (Blueprint $blueprint) use ($index) {
            $blueprint->dropIndex($index);
        });
    }
};
