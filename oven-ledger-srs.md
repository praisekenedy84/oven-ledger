# Oven Ledger — Software Requirements Specification (SRS)

**Companion to:** `oven-ledger-prd.md`
**Document version:** 1.0 (draft for scoping)

---

## 1. Introduction

### 1.1 Purpose
This document specifies the functional and non-functional requirements, data model, and architecture for Oven Ledger, a multi-tenant, multi-branch operations and sales platform for bakery/confectionery businesses.

### 1.2 Scope
Covers the platform-admin layer, tenant/branch management, feature gating, production, inventory, point of sale across retail/wholesale/restaurant channels, trading-goods sales, and reporting, as introduced in the PRD.

### 1.3 Definitions

| Term | Meaning |
|---|---|
| Platform | Mernet's operating layer that manages all tenants. |
| Tenant | A bakery/confectionery business using the system; has its own isolated schema. |
| Branch | A physical outlet/location belonging to a tenant. |
| Produced good | A catalog item made from a recipe/BOM (bread, cakes, pastries). |
| Trading good | A catalog item procured and resold as-is (tools, instruments, packaging). |
| Feature flag | A per-tenant on/off switch for a module or capability, set by the platform admin. |
| Branch limit | The maximum number of branches a tenant may create, set by the platform admin as a plain number. |

---

## 2. Architecture

### 2.1 Pattern
Same architectural family as NexStays:

- **Framework:** Laravel, using its default application structure — one repository, one `app/` tree. No separate frontend/backend split; Blade/Inertia views and controllers live together in the standard Laravel folders (`app/Http/Controllers`, `resources/views` or `resources/js/Pages` for Inertia, `routes/web.php`, etc.).
- **Multi-tenancy:** `stancl/tenancy`, schema-per-tenant on PostgreSQL. Each tenant gets its own PostgreSQL schema for operational data (branches, products, batches, inventory, sales, clients). Platform-level data (tenants, plans-free branch limits, feature flags, platform admins, suspension state, audit log) lives in the **central/landlord database**, outside any tenant schema.
- **Cache/queues:** Redis, used for session/cache and for queued jobs — notably stock-deduction jobs on production and sale events, to avoid race conditions on shared inventory counts.
- **Web server:** Nginx.
- **Deployment:** Laravel Forge, on Mernet's existing infrastructure (`mernet-server`), following the zero-downtime deployment pattern already used for NexStays/CRF-ERP, including awareness of Vite asset-hashing behavior during deploys.
- **Frontend rendering:** Inertia.js monolith pattern (Laravel + React or Vue via Inertia), consistent with Mernet's newer builds — no standalone SPA/API split.

### 2.2 Tenant resolution and routing
- Tenant identified by subdomain or custom domain (per `stancl/tenancy` central domain configuration), consistent with existing Mernet products.
- Central (landlord) routes handle: platform admin console, tenant onboarding, billing/branch-limit management.
- Tenant routes handle: everything branch-operational (POS, production, inventory, reporting) and are only reachable when the tenant is not suspended.

### 2.3 Branch scoping within a tenant schema
All operational tables inside a tenant's schema carry a `branch_id` foreign key. A middleware/service (`CurrentBranch`) resolves the active branch from the authenticated user's session or assignment, and every query is scoped through it by default, with an explicit "all branches" mode for owner-level reporting.

---

## 3. Data model

### 3.1 Central (landlord) database

```
platform_admins
  id, name, email, password, timestamps

platform_permissions
  id, key, label, group  -- e.g. tenants.manage, feature_flags.manage, branches.suspend, roles.manage

platform_roles
  id, name, is_default

platform_role_permissions
  platform_role_id, platform_permission_id

platform_admin_roles  (pivot — an admin can hold more than one role)
  platform_admin_id, platform_role_id

menu_items  (master catalog — every navigable item that could ever appear, tenant- or platform-side)
  id, scope (platform | tenant), key, label, icon, route_name, parent_id, sort_order

tenant_menu_availability  (which master menu items the platform admin has made available to a tenant at all)
  id, tenant_id, menu_item_id, available (boolean), updated_by_platform_admin_id

tenants
  id, name, owner_name, owner_email, owner_phone,
  domain, status (active | suspended), max_branches (integer, set by platform admin),
  created_by_platform_admin_id, timestamps

tenant_feature_flags
  id, tenant_id, feature_key, enabled (boolean), updated_by_platform_admin_id, timestamps
  -- feature_key examples: wholesale_module, restaurant_module, trading_goods_module,
  --   custom_orders_module, multi_branch, tra_fiscalization, inter_branch_transfers

tenant_branch_suspensions
  id, tenant_id, branch_id, suspended (boolean), reason, suspended_by_platform_admin_id, timestamps

platform_audit_log
  id, platform_admin_id, action, target_type, target_id, meta (jsonb), timestamps
```

Notes:
- There is intentionally **no `plans` table** — `max_branches` and each `tenant_feature_flags` row are set directly per tenant by the platform admin. This is a deliberate departure from a package/tier model.
- `tenant_branch_suspensions` is central (not inside the tenant schema) so a suspended tenant cannot alter its own suspension state.

### 3.2 Tenant schema (per-tenant, via `stancl/tenancy`)

```
branches
  id, name, address, phone, is_active, created_at

users
  id, name, email, password, timestamps

branch_user  (pivot — staff assigned to one or more branches)
  user_id, branch_id

permissions
  id, key, label, group  -- e.g. pos.sell, pos.refund, inventory.view, inventory.transfer,
                          --   production.manage, reports.view_own_branch, reports.view_all_branches,
                          --   wholesale.manage_clients (only assignable if tenant's wholesale_module flag is on)

roles
  id, name, is_default  -- is_default marks the ships-with roles: owner, branch_manager, cashier, production_staff

role_permissions
  role_id, permission_id

user_roles  (a user can hold a role tenant-wide or scoped to one branch)
  id, user_id, role_id, branch_id (nullable — null means tenant-wide)

role_menu_visibility  (tenant-admin controls, per role, which of the tenant's available menu items show)
  role_id, menu_item_id, visible

products
  id, name, type (produced | trading), unit_of_measure, category, is_active

recipes
  id, product_id, expected_yield, timestamps

recipe_ingredients
  id, recipe_id, raw_material_id, quantity, unit

raw_materials
  id, name, unit_of_measure, reorder_threshold

branch_raw_material_stock
  id, branch_id, raw_material_id, quantity_on_hand

production_batches
  id, branch_id, product_id, recipe_id, batch_number, planned_quantity,
  actual_quantity, status (planned | baking | cooling | ready | dispatched),
  produced_at, expiry_date, timestamps

branch_finished_goods_stock
  id, branch_id, product_id, quantity_on_hand, batch_reference

stock_transfers
  id, from_branch_id, to_branch_id, product_id, quantity,
  status (dispatched | received), dispatched_at, received_at

waste_logs
  id, branch_id, product_id, quantity, reason (expired | damaged | given_away), logged_at

price_lists
  id, product_id, channel (retail | wholesale | restaurant), price

clients
  id, name, type (wholesale | restaurant), tin_number (nullable),
  credit_limit, payment_terms, is_active
  -- clients belong to the tenant, not to a single branch

orders
  id, branch_id, client_id (nullable, for wholesale/restaurant/custom),
  channel (retail | wholesale | restaurant | custom), status,
  deposit_amount (nullable), due_date (nullable), created_at

order_items
  id, order_id, product_id, quantity, unit_price, line_total

payments
  id, order_id, method (cash | card | credit_account | mobile_money),
  amount, provider (clickpesa | mpesa | airtel | null), paid_at
  -- v1 only writes cash | card | credit_account; mobile_money and its providers
  -- are reserved columns, not yet reachable from the UI (see FR-PAY-01)

fiscal_receipts
  id, order_id, tra_receipt_number (nullable), fiscal_payload (nullable), issued_at (nullable)
  -- table exists so a receipt can be retro-fitted with fiscal data once TRA VFD ships;
  -- not populated in v1 (see FR-PAY-02)

suppliers
  id, name, phone, contact_person

purchase_orders
  id, supplier_id, branch_id, status, ordered_at, received_at
```

---

## 4. Functional requirements

Numbering: `FR-<area>-<n>`.

### 4.1 Platform administration

- **FR-PLAT-01**: The platform admin shall be able to create a tenant with an owner name, contact details, and an initial `max_branches` value.
- **FR-PLAT-02**: The platform admin shall be able to change a tenant's `max_branches` at any time to any non-negative integer.
- **FR-PLAT-03**: The platform admin shall be able to enable or disable any individual feature flag for a tenant, independent of any other tenant's configuration.
- **FR-PLAT-04**: The platform admin shall be able to suspend a tenant, which immediately blocks login and all operations for every branch under that tenant.
- **FR-PLAT-05**: The platform admin shall be able to reactivate a suspended tenant.
- **FR-PLAT-06**: The platform admin shall be able to suspend a single branch within an active tenant, leaving the tenant's other branches unaffected.
- **FR-PLAT-07**: The platform admin shall be able to reactivate a suspended branch.
- **FR-PLAT-08**: The system shall log every platform-admin action that changes a tenant's branch limit, feature flags, or suspension state, including who made the change and when.
- **FR-PLAT-09**: The platform admin console shall display, per tenant, current branch count against `max_branches`, and the current state of every feature flag.

### 4.2 Tenant/branch management

- **FR-TEN-01**: A business owner shall be able to create a new branch only while the tenant's current branch count is below `max_branches`.
- **FR-TEN-02**: If a business owner attempts to exceed `max_branches`, the system shall reject the action with a clear message rather than allowing partial creation.
- **FR-TEN-03**: A suspended tenant shall not be able to log in or perform any action, and shall see a message indicating the account is suspended.
- **FR-TEN-04**: A branch that is suspended (while its tenant remains active) shall become read-only or inaccessible for POS, production, and inventory actions, while other branches of the same tenant continue to operate normally.
- **FR-TEN-05**: The business owner shall be able to view, but not directly edit, the tenant's current feature flags and branch limit.
- **FR-TEN-06**: The business owner shall be able to assign staff to one or more branches and switch between branches when viewing reports.

### 4.3 Feature gating enforcement

- **FR-GATE-01**: Every feature-gated module (wholesale, restaurant supply, trading goods, custom orders, multi-branch, inter-branch transfers, TRA fiscalization) shall check the tenant's feature flag both in the UI (hide/disable navigation) and at the server/request level (reject the action even if requested directly).
- **FR-GATE-02**: If `multi_branch` is disabled for a tenant, the system shall behave as a single-branch system regardless of the tenant's `max_branches` value (the flag governs whether branch-switching UI and multi-branch workflows are exposed at all).

### 4.4 Production

- **FR-PROD-01**: A produced-type product shall have exactly one active recipe defining its ingredients and expected yield.
- **FR-PROD-02**: Logging a production batch as complete shall deduct the recipe's ingredient quantities (scaled to actual output) from the branch's raw material stock.
- **FR-PROD-03**: Each production batch shall carry a status that progresses through planned → baking → cooling → ready (→ dispatched, for stock transferred to another branch).
- **FR-PROD-04**: Each production batch shall record an expiry/best-before date used for FIFO stock rotation in sales and transfers.

### 4.5 Inventory

- **FR-INV-01**: The system shall track raw material stock per branch and raise a low-stock alert when quantity on hand falls below the configured reorder threshold.
- **FR-INV-02**: The system shall track finished goods stock per branch, decremented automatically on sale and incremented on production or received stock transfer.
- **FR-INV-03**: A stock transfer between branches shall require a dispatch action at the sending branch and a received confirmation at the receiving branch before the receiving branch's stock is incremented.
- **FR-INV-04**: The system shall allow logging waste with a reason code and shall reflect the write-off in reporting.
- **FR-INV-05**: Trading goods shall be replenished through purchase orders against suppliers, not through the production/recipe workflow.

### 4.6 Sales / point of sale

- **FR-POS-01**: A sale shall be created against exactly one channel: retail, wholesale, restaurant, or custom.
- **FR-POS-02**: The unit price applied to each order line shall come from the price list matching the product and the order's channel.
- **FR-POS-03 (deferred)**: A retail sale shall generate a TRA VFD fiscal receipt when the `tra_fiscalization` feature flag is enabled for the tenant. **Not implemented in v1** — the flag exists but has no working integration behind it yet; it must default to off and remain non-selectable by tenant admins until the integration ships.
- **FR-POS-04**: In v1, the system shall support cash, card, and credit-account payment methods. Mobile money (ClickPesa, M-Pesa, Airtel) is a **deferred** payment method — the `payments.method` and `payments.provider` columns already accommodate it, but no provider integration or UI path exists until it is built in a later phase.
- **FR-POS-05**: A custom order shall support an optional deposit amount and a due date, and shall not be counted against same-day walk-in finished goods stock until production is scheduled against it.

### 4.7 Wholesale / restaurant supply

- **FR-WHS-01**: A client (wholesale or restaurant) shall belong to the tenant and shall be visible/orderable from any branch.
- **FR-WHS-02**: The system shall support recurring/standing orders for a client that generate new orders on a defined schedule.
- **FR-WHS-03**: The system shall track a client's outstanding balance against their credit limit and warn when a new order would exceed it.
- **FR-WHS-04**: The system shall generate delivery notes and periodic statements per client, including TIN details where applicable for B2B fiscal receipts.

### 4.8 Reporting

- **FR-REP-01**: The system shall report sales by channel, by branch, and by product type, for a selectable date range.
- **FR-REP-02**: The system shall report production yield (actual vs. planned quantity) and waste percentage per branch.
- **FR-REP-03**: An owner viewing reports across multiple branches shall be able to filter to "all branches" or a specific branch.

### 4.9 Roles and permissions

- **FR-RBAC-01**: The platform admin shall be able to define and edit platform-level roles and assign granular permissions to them, for platform-admin users.
- **FR-RBAC-02**: A tenant admin (business owner) shall be able to define custom roles within their tenant, assign granular permissions to each role, and assign one or more roles to a user, each optionally scoped to a specific branch.
- **FR-RBAC-03**: Permissions shall be granular and independently assignable (e.g. taking a sale, issuing a refund, viewing only one's own branch reports vs. all branches, managing wholesale clients) rather than bundled into a single fixed role per user.
- **FR-RBAC-04**: Each tenant shall be provisioned with default roles (owner, branch manager, cashier, production staff) and default permission sets on creation, which the tenant admin may edit, extend, or replace.
- **FR-RBAC-05**: A tenant admin shall not be able to grant a permission belonging to a module that is disabled for the tenant via feature flag (e.g. no "manage wholesale clients" permission can be granted while the tenant's `wholesale_module` flag is off).
- **FR-RBAC-06**: Removing a permission from a role shall take effect for every user holding that role without requiring the user to be edited individually.

### 4.10 Navigation configuration

- **FR-NAV-01**: The platform admin shall maintain the master catalog of menu items (`menu_items`) available anywhere in the system.
- **FR-NAV-02**: The platform admin shall control which menu items are available to a given tenant at all, kept consistent with that tenant's enabled feature flags — a tenant cannot be given menu access to a module it doesn't have enabled.
- **FR-NAV-03**: The tenant admin shall be able to control, per role, which of the tenant's available menu items are visible to users holding that role.
- **FR-NAV-04**: Menu availability and visibility changes shall take effect on next page load without requiring a code deployment.

### 4.11 Session handling

- **FR-SESSION-01**: When a request is made with an expired or invalid session (including an expired CSRF token), the system shall redirect the user to the login page with a plain "your session has expired, please log in again" message, rather than returning a raw HTTP 419 or other generic error page.
- **FR-SESSION-02**: This redirect behavior shall apply uniformly to full page loads and to Inertia/AJAX requests — an expired session during an in-app action shall not leave the user on a frozen or blank screen.
- **FR-SESSION-03**: Where practical, form/ticket state in progress at the moment of expiry (e.g. an open POS ticket) shall be recoverable after re-authentication, or the user shall be explicitly told it was not saved.

### 4.12 Deployment and asset-update handling

- **FR-DEPLOY-01**: The system shall expose a lightweight, versioned build identifier (e.g. from the Vite manifest) that the client can check against periodically or on navigation.
- **FR-DEPLOY-02**: When a deployment changes the build identifier while a user has the app open, the client shall detect the mismatch and prompt the user to refresh, rather than continuing to run against stale assets.
- **FR-DEPLOY-03**: If a stale asset reference fails to load after a deployment (the known Vite-hashing-on-zero-downtime-deploy failure mode already seen on other Mernet products), the system shall catch this failure and trigger a full reload rather than presenting a blank page or an unhandled JavaScript error.

---

## 5. Non-functional requirements

- **NFR-01 (Isolation):** No tenant shall be able to read or write another tenant's data; enforced at the database level via `stancl/tenancy` schema separation, not solely by application-level filtering.
- **NFR-02 (Branch isolation within a tenant):** Cross-branch data visibility shall only occur through explicit owner-level "all branches" views, never by default for branch-scoped roles.
- **NFR-03 (Suspension immediacy):** A tenant or branch suspension shall take effect for any new request immediately; already-open sessions shall be invalidated on their next request rather than persisting until natural expiry.
- **NFR-04 (Auditability):** All platform-admin actions affecting branch limits, feature flags, and suspensions shall be logged with actor and timestamp and shall not be editable after the fact.
- **NFR-05 (Deployment consistency):** The application shall deploy via Laravel Forge using the same zero-downtime pattern, PostgreSQL port conventions, and Vite asset-handling approach already established for NexStays and CRF-ERP on `mernet-server`.
- **NFR-06 (Concurrency safety):** Inventory-affecting operations (sales, production completion, stock transfers) shall be processed through queued jobs where concurrent updates to the same stock record are possible, to avoid lost-update race conditions.
- **NFR-07 (Localization):** Currency shall display in TZS by default; the system shall accommodate TRA VFD fiscal receipt formatting requirements.
- **NFR-08 (Performance):** POS product selection and ticket updates shall respond within normal interactive thresholds (sub-second) on the target VPS under expected concurrent branch load.
- **NFR-09 (Graceful session expiry):** No user-facing flow shall ever surface a raw framework error page (e.g. 419 Page Expired) for session/token expiry; all such cases resolve to a clean redirect to login.
- **NFR-10 (Deployment resilience):** A production deployment shall never leave an active user on a broken or blank page; stale-asset and stale-session states are both handled by prompting a reload rather than failing silently.
- **NFR-11 (Permission consistency):** Every permission-gated action shall be enforced identically at the UI layer (hidden/disabled) and the server/request layer (rejected), the same two-layer pattern used for feature-flag and branch-limit enforcement.

---

## 6. External interfaces

| Interface | Purpose | Status |
|---|---|---|
| TRA VFD | Fiscalization of retail (and where applicable, B2B) receipts. | Deferred — not implemented in v1 |
| ClickPesa | Mobile money payment collection. | Deferred — not implemented in v1 |
| M-Pesa / Airtel Money | Mobile money payment collection. | Deferred — not implemented in v1 |
| Laravel Forge | Deployment and server provisioning on `mernet-server`. | v1 |

---

## 7. Constraints

- Single Laravel application, default folder structure — no separate `frontend/` and `backend/` repositories or directories.
- Schema-per-tenant on a shared PostgreSQL instance, consistent with existing Mernet products.
- No fixed subscription "plan" table governs branch limits or feature flags — these are set per tenant directly by the platform admin, as specified in the PRD.

---

*See `oven-ledger-prd.md` for product rationale, scope, and phased roadmap.*
