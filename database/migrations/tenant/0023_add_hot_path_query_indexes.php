<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->index('order_id', 'payments_order_id_idx');
                $table->index('paid_at', 'payments_paid_at_idx');
                $table->index('method', 'payments_method_idx');
            });
        }

        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->index('product_id', 'order_items_product_id_idx');
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (Schema::hasColumn('orders', 'customer_id')) {
                    $table->index('customer_id', 'orders_customer_id_idx');
                }

                if (Schema::hasColumn('orders', 'due_date')) {
                    $table->index('due_date', 'orders_due_date_idx');
                }

                if (Schema::hasColumn('orders', 'requested_fulfillment_at')) {
                    $table->index('requested_fulfillment_at', 'orders_requested_fulfillment_at_idx');
                }
            });
        }

        if (Schema::hasTable('waste_logs')) {
            Schema::table('waste_logs', function (Blueprint $table) {
                $table->index(['branch_id', 'logged_at'], 'waste_logs_branch_logged_at_idx');
            });
        }

        if (Schema::hasTable('owner_transactions')) {
            Schema::table('owner_transactions', function (Blueprint $table) {
                $table->index(['type', 'transacted_at'], 'owner_transactions_type_transacted_at_idx');
            });
        }

        if (Schema::hasTable('liability_payments')) {
            Schema::table('liability_payments', function (Blueprint $table) {
                $table->index('paid_at', 'liability_payments_paid_at_idx');
            });
        }

        if (Schema::hasTable('business_liabilities')) {
            Schema::table('business_liabilities', function (Blueprint $table) {
                $table->index(['status', 'due_date'], 'business_liabilities_status_due_date_idx');
            });
        }
    }

    public function down(): void
    {
        $this->dropIndexIfExists('payments', 'payments_order_id_idx');
        $this->dropIndexIfExists('payments', 'payments_paid_at_idx');
        $this->dropIndexIfExists('payments', 'payments_method_idx');
        $this->dropIndexIfExists('order_items', 'order_items_product_id_idx');
        $this->dropIndexIfExists('orders', 'orders_customer_id_idx');
        $this->dropIndexIfExists('orders', 'orders_due_date_idx');
        $this->dropIndexIfExists('orders', 'orders_requested_fulfillment_at_idx');
        $this->dropIndexIfExists('waste_logs', 'waste_logs_branch_logged_at_idx');
        $this->dropIndexIfExists('owner_transactions', 'owner_transactions_type_transacted_at_idx');
        $this->dropIndexIfExists('liability_payments', 'liability_payments_paid_at_idx');
        $this->dropIndexIfExists('business_liabilities', 'business_liabilities_status_due_date_idx');
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
