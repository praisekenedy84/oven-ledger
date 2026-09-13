<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $this->ensureUsernameColumn();
        $this->backfillUsernames();
        $this->ensureUniqueUsernameIndex();
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'username')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if ($this->usersHaveUniqueUsernameIndex()) {
                $table->dropUnique(['username']);
            }

            $table->dropColumn('username');
        });
    }

    protected function ensureUsernameColumn(): void
    {
        if (Schema::hasColumn('users', 'username')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable()->after('name');
        });
    }

    protected function backfillUsernames(): void
    {
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
    }

    protected function ensureUniqueUsernameIndex(): void
    {
        if ($this->usersHaveUniqueUsernameIndex()) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->unique('username');
        });
    }

    protected function usersHaveUniqueUsernameIndex(): bool
    {
        return collect(Schema::getIndexes('users'))->contains(
            fn (array $index) => in_array('username', $index['columns'], true)
                && ($index['unique'] ?? false)
        );
    }
};
