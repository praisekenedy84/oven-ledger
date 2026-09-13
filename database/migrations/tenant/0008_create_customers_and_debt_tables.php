<?php

declare(strict_types=1);

use App\Models\MenuItem;
use App\Models\Permission;
use App\Models\Role;
use App\Models\RoleMenuVisibility;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->renameClientsToCustomers();
        $this->extendOrders();
        $this->createCustomerAddresses();
        $this->addOrderDeliveryForeignKey();
        $this->createLedgerTables();
        $this->seedAccess();
    }

    public function down(): void
    {
        Schema::dropIfExists('owner_transactions');
        Schema::dropIfExists('liability_payments');
        Schema::dropIfExists('business_liabilities');
        Schema::dropIfExists('customer_ledger_entries');

        if (Schema::hasColumn('orders', 'delivery_address_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropConstrainedForeignId('delivery_address_id');
                $table->dropColumn([
                    'is_pre_order',
                    'fulfillment_type',
                    'requested_fulfillment_at',
                ]);
            });
        }

        Schema::dropIfExists('customer_addresses');

        if (Schema::hasTable('customers') && ! Schema::hasTable('clients')) {
            if (Schema::hasColumn('orders', 'customer_id')) {
                $this->dropForeignIfExists('orders', ['customer_id']);
                Schema::table('orders', function (Blueprint $table) {
                    $table->renameColumn('customer_id', 'client_id');
                });
            }

            Schema::table('customers', function (Blueprint $table) {
                $table->dropColumn(['phone', 'email']);
            });

            Schema::rename('customers', 'clients');

            Schema::table('orders', function (Blueprint $table) {
                $table->foreign('client_id')->references('id')->on('clients')->nullOnDelete();
            });
        }

        Permission::query()->whereIn('key', ['customers.manage', 'debts.manage'])->delete();
    }

    protected function renameClientsToCustomers(): void
    {
        $this->dropOrderCustomerForeign();

        if (Schema::hasTable('clients') && ! Schema::hasTable('customers')) {
            Schema::rename('clients', 'customers');
        }

        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table) {
                if (! Schema::hasColumn('customers', 'phone')) {
                    $table->string('phone')->nullable();
                }
                if (! Schema::hasColumn('customers', 'email')) {
                    $table->string('email')->nullable();
                }
            });

            $driver = Schema::getConnection()->getDriverName();

            if ($driver === 'pgsql') {
                DB::statement('ALTER TABLE customers ALTER COLUMN credit_limit DROP NOT NULL');
            } elseif ($driver === 'mysql') {
                DB::statement('ALTER TABLE customers MODIFY credit_limit DECIMAL(15,2) NULL');
            }
        }

        if (Schema::hasColumn('orders', 'client_id') && ! Schema::hasColumn('orders', 'customer_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->renameColumn('client_id', 'customer_id');
            });
        }

        if (Schema::hasColumn('orders', 'customer_id')) {
            $this->dropOrderCustomerForeign();
            Schema::table('orders', function (Blueprint $table) {
                $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            });
        }
    }

    protected function extendOrders(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (! Schema::hasColumn('orders', 'is_pre_order')) {
                $table->boolean('is_pre_order')->default(false);
            }
            if (! Schema::hasColumn('orders', 'fulfillment_type')) {
                $table->string('fulfillment_type')->default('pickup');
            }
            if (! Schema::hasColumn('orders', 'requested_fulfillment_at')) {
                $table->timestamp('requested_fulfillment_at')->nullable();
            }
        });
    }

    protected function createCustomerAddresses(): void
    {
        if (Schema::hasTable('customer_addresses')) {
            return;
        }

        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('label');
            $table->text('address_text');
            $table->string('phone')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    protected function addOrderDeliveryForeignKey(): void
    {
        if (Schema::hasColumn('orders', 'delivery_address_id')) {
            return;
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('delivery_address_id')
                ->nullable()
                ->constrained('customer_addresses')
                ->nullOnDelete();
        });
    }

    protected function createLedgerTables(): void
    {
        if (! Schema::hasTable('customer_ledger_entries')) {
            Schema::create('customer_ledger_entries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
                $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
                $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
                $table->string('type');
                $table->decimal('amount', 15, 2);
                $table->decimal('balance_after', 15, 2);
                $table->timestamp('entry_date');
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['customer_id', 'entry_date']);
            });
        }

        if (! Schema::hasTable('business_liabilities')) {
            Schema::create('business_liabilities', function (Blueprint $table) {
                $table->id();
                $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete();
                $table->string('type');
                $table->string('creditor_name');
                $table->decimal('original_amount', 15, 2);
                $table->decimal('balance_remaining', 15, 2);
                $table->date('due_date')->nullable();
                $table->string('status')->default('open');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('liability_payments')) {
            Schema::create('liability_payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('business_liability_id')->constrained()->cascadeOnDelete();
                $table->decimal('amount', 15, 2);
                $table->timestamp('paid_at');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('owner_transactions')) {
            Schema::create('owner_transactions', function (Blueprint $table) {
                $table->id();
                $table->string('type');
                $table->decimal('amount', 15, 2);
                $table->timestamp('transacted_at');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    protected function seedAccess(): void
    {
        $permissions = [
            ['key' => 'customers.manage', 'label' => 'Manage customers', 'group' => 'customers'],
            ['key' => 'debts.manage', 'label' => 'Manage business debts', 'group' => 'debts'],
        ];

        $permissionIds = [];

        foreach ($permissions as $permission) {
            $record = Permission::query()->firstOrCreate(
                ['key' => $permission['key']],
                $permission
            );
            $permissionIds[] = $record->id;
        }

        Role::query()
            ->whereIn('name', ['owner', 'branch_manager'])
            ->get()
            ->each(fn (Role $role) => $role->permissions()->syncWithoutDetaching($permissionIds));

        $menuKeys = ['tenant.customers', 'tenant.debts', 'tenant.sales'];
        $menuIds = MenuItem::query()->whereIn('key', $menuKeys)->pluck('id', 'key');

        Role::query()
            ->whereIn('name', ['owner', 'branch_manager'])
            ->get()
            ->each(function (Role $role) use ($menuIds) {
                foreach ($menuIds as $menuItemId) {
                    RoleMenuVisibility::query()->updateOrInsert(
                        [
                            'role_id' => $role->id,
                            'menu_item_id' => $menuItemId,
                        ],
                        ['visible' => true]
                    );
                }
            });
    }

    protected function dropForeignIfExists(string $table, array $columns): void
    {
        if (Schema::getConnection()->getDriverName() === 'pgsql') {
            $this->dropPostgresForeigns($table, $columns);

            return;
        }

        foreach ($columns as $column) {
            if (! Schema::hasColumn($table, $column)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($column) {
                $blueprint->dropForeign([$column]);
            });
        }
    }

    protected function dropOrderCustomerForeign(): void
    {
        $this->dropForeignIfExists('orders', ['client_id', 'customer_id']);
    }

    protected function dropPostgresForeigns(string $table, array $columns): void
    {
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));

        $names = collect(DB::select(
            "SELECT DISTINCT c.conname
             FROM pg_constraint c
             JOIN pg_class t ON c.conrelid = t.oid
             JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
             WHERE t.relname = ? AND c.contype = 'f' AND a.attname IN ({$placeholders})",
            [$table, ...$columns]
        ))->pluck('conname');

        foreach ($names as $name) {
            DB::statement("ALTER TABLE {$table} DROP CONSTRAINT IF EXISTS \"{$name}\"");
        }
    }
};
