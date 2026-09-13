<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('name')->after('id');
            $table->string('owner_name')->after('name');
            $table->string('owner_email')->after('owner_name');
            $table->string('owner_phone')->nullable()->after('owner_email');
            $table->string('status')->default('active')->after('owner_phone');
            $table->unsignedInteger('max_branches')->default(1)->after('status');
            $table->unsignedBigInteger('created_by_platform_admin_id')->nullable()->after('max_branches');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'name',
                'owner_name',
                'owner_email',
                'owner_phone',
                'status',
                'max_branches',
                'created_by_platform_admin_id',
            ]);
        });
    }
};
