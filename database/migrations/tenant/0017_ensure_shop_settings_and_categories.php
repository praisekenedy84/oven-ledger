<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $migration = require __DIR__.'/0016_shop_categories_and_recipe_lock.php';
        $migration->up();
    }

    public function down(): void
    {
        // Keep shop settings and categories if 0016 is still applied.
    }
};
