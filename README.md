# Oven Ledger

Multi-tenant bakery operations platform built with Laravel 12, Inertia React, and [stancl/tenancy](https://tenancyforlaravel.com/).

## Stack

- **Central (landlord) DB:** PostgreSQL
- **Tenant DBs:** One PostgreSQL database per tenant (stancl database-per-tenant; schema-per-tenant optional in production)
- **Auth:** Platform admins on central (`platform` guard at `/platform`); tenant staff on the shared app URL (`web` guard) with session-based tenant resolution

## Requirements

- PHP 8.2+ with `pdo_pgsql`
- Composer
- Node.js 18+ and npm
- PostgreSQL 14+

## Setup

```bash
# Install PHP dependencies
composer install

# Install frontend dependencies (for Vite/Inertia assets)
npm install

# Copy environment file if needed, then set Postgres in .env:
# DB_CONNECTION=pgsql
# DB_HOST=127.0.0.1
# DB_PORT=5433
# DB_DATABASE=ovenledger
# DB_USERNAME=postgres
# DB_PASSWORD=root
# SESSION_CONNECTION=pgsql
cp .env.example .env
php artisan key:generate

# Create the central database (once)
# createdb -h 127.0.0.1 -p 5433 -U postgres ovenledger

# Run central migrations and seed platform data
php artisan migrate --force
php artisan db:seed --force
```

### Platform admin login

After seeding:

- **URL:** `http://127.0.0.1:8000/platform/login`
- **Email:** `admin@mernet.co.tz`
- **Password:** `password`

### Demo tenant (already provisioned locally)

All bakeries share one URL (production: `https://oven.mernettechnologies.com`).

- **URL:** `http://127.0.0.1:8000/login`
- **Password for every demo account:** `password`

| Email | Role | Branches |
|---|---|---|
| `owner@demo.test` | Owner | All (Kariakoo, Masaki, Mlimani) |
| `manager@demo.test` | Branch manager | Masaki + Mlimani |
| `cashier@demo.test` | Cashier | Main Branch |
| `baker@demo.test` | Production staff | Main Branch |

`php scripts/provision-demo-tenant.php` creates the tenant if needed and seeds a week of bakery operations: catalog, recipes, stock, customers, credit ledgers, pre-orders, production batches, supplier bills, and owner capital. Catalog rows are upserted; sales, batches, and debts are skipped if they already exist.

Or recreate / repair with:

```bash
php scripts/provision-demo-tenant.php
php scripts/reset-demo-owner.php
# If upgrading from subdomain-based tenancy:
php scripts/sync-tenant-user-directory.php
```

### Create a tenant

1. Log in to the platform console at `/platform/dashboard`
2. Go to **Tenants → Create**
3. Provide business details and owner email/password (no subdomain / DNS step)
4. The provisioner creates the tenant database, runs tenant migrations/seeds, sets default feature flags, creates the owner user, and registers the owner in the central login directory

### Tenant access (shared domain)

Tenant staff sign in at `/login` on the same host as the platform. After authentication, the tenant is resolved from the user record and stored in the session for subsequent requests.

> **Note:** Production uses one shared host (e.g. `oven.mernettechnologies.com`). Platform admin stays under `/platform`.

## Development

```bash
# Run Laravel server, queue worker, logs, and Vite together
composer dev
```

Or separately:

```bash
php artisan serve
php artisan queue:listen
npm run dev
```

## Tenant migrations & seeds

```bash
# Migrate all tenant databases
php artisan tenants:migrate

# Seed all tenant databases
php artisan tenants:seed
```

Tenant seeding runs `TenantDatabaseSeeder` (default roles, permissions, Main Branch). Demo bakery catalog, customers, sales, and debts come from `DemoDataSeeder` via `php scripts/provision-demo-tenant.php`.

## Production notes

- Register `App\Providers\TenancyServiceProvider` in `bootstrap/providers.php` (required for tenant lifecycle jobs)
- Optionally switch tenant database manager to `PostgreSQLSchemaManager` in `config/tenancy.php` for schema-per-tenant
- Configure Redis for cache/queues in production
- Central sessions/cache/jobs remain on the landlord database
- Point a single DNS/SSL hostname at the app; do not provision per-tenant subdomains

## Project structure

| Area | Location |
|---|---|
| Central migrations | `database/migrations/` |
| Tenant migrations | `database/migrations/tenant/` |
| Platform controllers | `app/Http/Controllers/Platform/` |
| Tenant controllers | `app/Http/Controllers/` |
| Central routes | `routes/web.php` |
| Tenant routes | `routes/tenant.php` |
| PRD / SRS | `oven-ledger-prd.md`, `oven-ledger-srs.md` |
