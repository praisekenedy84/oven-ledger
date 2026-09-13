<?php

declare(strict_types=1);

namespace App\Tenancy;

use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\TenantDatabaseManagers\SQLiteDatabaseManager as BaseSQLiteDatabaseManager;

class SQLiteDatabaseManager extends BaseSQLiteDatabaseManager
{
    public function createDatabase(TenantWithDatabase $tenant): bool
    {
        try {
            $result = file_put_contents(database_path($tenant->database()->getName()), '');

            return $result !== false;
        } catch (\Throwable) {
            return false;
        }
    }
}
