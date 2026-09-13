<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('platform_admins', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('platform_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('label');
            $table->string('group');
        });

        Schema::create('platform_roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_default')->default(false);
        });

        Schema::create('platform_role_permissions', function (Blueprint $table) {
            $table->foreignId('platform_role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('platform_permission_id')->constrained()->cascadeOnDelete();
            $table->primary(['platform_role_id', 'platform_permission_id']);
        });

        Schema::create('platform_admin_roles', function (Blueprint $table) {
            $table->foreignId('platform_admin_id')->constrained()->cascadeOnDelete();
            $table->foreignId('platform_role_id')->constrained()->cascadeOnDelete();
            $table->primary(['platform_admin_id', 'platform_role_id']);
        });

        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->string('scope');
            $table->string('key');
            $table->string('label');
            $table->string('icon')->nullable();
            $table->string('route_name')->nullable();
            $table->foreignId('parent_id')->nullable()->constrained('menu_items')->nullOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('feature_key')->nullable();
        });

        Schema::create('tenant_menu_availability', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
            $table->boolean('available')->default(true);
            $table->unsignedBigInteger('updated_by_platform_admin_id')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unique(['tenant_id', 'menu_item_id']);
        });

        Schema::create('tenant_feature_flags', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('feature_key');
            $table->boolean('enabled')->default(false);
            $table->unsignedBigInteger('updated_by_platform_admin_id')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unique(['tenant_id', 'feature_key']);
        });

        Schema::create('tenant_branch_suspensions', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('branch_id');
            $table->boolean('suspended')->default(true);
            $table->text('reason')->nullable();
            $table->unsignedBigInteger('suspended_by_platform_admin_id')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unique(['tenant_id', 'branch_id']);
        });

        Schema::create('platform_audit_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_admin_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action');
            $table->string('target_type')->nullable();
            $table->string('target_id')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_audit_log');
        Schema::dropIfExists('tenant_branch_suspensions');
        Schema::dropIfExists('tenant_feature_flags');
        Schema::dropIfExists('tenant_menu_availability');
        Schema::dropIfExists('menu_items');
        Schema::dropIfExists('platform_admin_roles');
        Schema::dropIfExists('platform_role_permissions');
        Schema::dropIfExists('platform_roles');
        Schema::dropIfExists('platform_permissions');
        Schema::dropIfExists('platform_admins');
    }
};
