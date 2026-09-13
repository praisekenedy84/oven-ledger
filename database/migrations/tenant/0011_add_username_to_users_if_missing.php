<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * 0010 originally synced the central directory mid-migration, which purged
 * the tenant connection and rolled back the username column on PostgreSQL.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('username')->nullable()->after('name');
            });
        }

        $used = [];

        foreach (DB::table('users')->orderBy('id')->get() as $user) {
            if (filled($user->username ?? null)) {
                $used[] = Str::lower((string) $user->username);

                continue;
            }

            $base = Str::slug(Str::before((string) $user->email, '@'), '_');

            if ($base === '') {
                $base = 'user'.$user->id;
            }

            $username = $base;
            $suffix = 1;

            while (in_array($username, $used, true)) {
                $username = $base.$suffix;
                $suffix++;
            }

            $used[] = $username;

            DB::table('users')->where('id', $user->id)->update([
                'username' => $username,
            ]);
        }

        $hasUnique = collect(Schema::getIndexes('users'))->contains(
            fn (array $index) => in_array('username', $index['columns'], true)
                && ($index['unique'] ?? false)
        );

        if (! $hasUnique) {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('username');
            });
        }
    }

    public function down(): void
    {
        // Intentionally empty: 0010 owns the username column.
    }
};
