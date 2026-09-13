<?php

declare(strict_types=1);

use App\Support\MenuCatalog;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        app(MenuCatalog::class)->sync();
    }

    public function down(): void
    {
        // Catalog sync is additive and kept on rollback.
    }
};
