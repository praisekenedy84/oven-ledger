# Oven Ledger — Product Requirements Document (PRD)

**Product type:** Multi-tenant SaaS for bakeries, confectioneries, and pastry businesses
**Working name:** Oven Ledger
**Document version:** 1.0 (draft for scoping)
**Prepared for:** Mernet Technologies Company Limited

---

## 1. Overview

Oven Ledger is a multi-tenant platform that lets a bakery/confectionery business manage production and sell across multiple channels — retail counter, wholesale, restaurant/HoReCa supply, and custom orders — while also selling non-baked goods such as baking tools, instruments, and packaging.

Each business (tenant) can operate one or more branches. A platform-level admin (Mernet) provisions tenants, sets how many branches each tenant is allowed to operate, and controls which features are switched on for that tenant — independent of any fixed pricing package.

This follows the same architectural family as NexStays: Laravel monolith, `stancl/tenancy` schema-per-tenant on PostgreSQL, Redis, Nginx, deployed via Laravel Forge on Mernet's infrastructure.

---

## 2. Problem statement

Bakery and confectionery owners in Tanzania currently run retail, wholesale, and restaurant-supply sales side by side using manual books, generic POS software not built for perishable production, or spreadsheets. This causes:

- No link between what's produced and what's sold — stock counts drift, waste goes untracked.
- No differentiation between retail, wholesale, and restaurant pricing/terms in one system.
- No visibility across branches for owners running more than one outlet.
- No way to also manage the sale of baking tools/instruments in the same system as perishable goods.

---

## 3. Goals

1. Give a bakery owner one system to run production, inventory, and sales across retail, wholesale, and restaurant channels.
2. Support businesses with a single branch on day one, and multiple branches without re-architecture later.
3. Let Mernet, as the platform operator, onboard tenants, control how many branches each tenant may run, enable/disable specific features per tenant, and suspend a tenant or a specific branch when needed — all without being tied to fixed subscription packages.
4. Fit Tanzanian business practice: TZS pricing, TRA VFD fiscalization on receipts, mobile money at checkout (ClickPesa, M-Pesa, Airtel).

---

## 4. Users and roles

| Role | Level | Description |
|---|---|---|
| Platform admin | Platform | Mernet staff. Onboards tenants, sets branch limits, toggles feature flags, suspends tenants/branches, views cross-tenant usage. |
| Business owner | Tenant | Full access across all of the tenant's branches. Manages plan usage (within the limits the platform admin set), wholesale/restaurant accounts, staff, and reporting. |
| Branch manager | Branch | Full operational access scoped to their assigned branch(es): production, inventory, POS, staff. |
| Cashier / counter staff | Branch | POS access only. Can take retail sales and, if permitted, wholesale/restaurant sales at the counter. |
| Production staff | Branch | Records batches, marks status (baking/cooling/ready), logs raw-material usage and waste. |
| Wholesale/restaurant client | External | No login initially (v1); receives orders/invoices via the business. A client portal is a candidate for a later phase. |

---

## 5. Scope

### 5.1 In scope (v1)

- Multi-tenant onboarding and tenant lifecycle (active, suspended).
- Multi-branch support per tenant, with a platform-set branch limit per tenant.
- Platform admin console: tenant list, branch usage, feature flags, suspension controls.
- Product catalog supporting two product types: **produced goods** (recipe/BOM-based) and **trading goods** (procured tools/instruments/packaging).
- Recipe/BOM management and production batch tracking with expiry/best-before dates.
- Inventory management for raw materials, finished produced goods, and trading goods, including inter-branch stock transfers.
- Point of sale supporting retail, wholesale, and restaurant-supply channels with channel-specific pricing.
- Wholesale/restaurant client accounts: price lists, credit terms, standing/recurring orders, delivery notes, statements.
- Custom order workflow (e.g. celebration cakes) with deposits and a production due date.
- Waste/shrinkage logging.
- Reporting: sales by channel, sales by branch, production yield, waste, low-stock alerts.
- Cash and card payment methods at point of sale, with the payment model designed so mobile money and TRA VFD fiscalization can be switched on later without reworking the sale workflow.
- Granular, permission-based access control at platform, tenant, and branch levels — roles and their permissions are configurable by platform admins and tenant admins, not fixed in code.
- Configurable navigation: which menu items appear can be adjusted by the platform admin (per tenant) and by the tenant admin (per role), without a code change.

### 5.2 Out of scope (v1, candidate for later phases)

- Wholesale/restaurant client self-service portal.
- Online storefront / e-commerce ordering for retail customers.
- Delivery route optimization / rider tracking.
- Native mobile apps (v1 is web, responsive for tablet/POS use).
- Payroll/HR beyond basic staff-to-branch assignment.
- **TRA VFD fiscalization** — not implemented in v1. The receipt/order schema is designed to accommodate it later, but no live integration ships.
- **Mobile money payment integration** (ClickPesa, M-Pesa, Airtel) — not implemented in v1. Cash and card only at launch; the payment model is built to add providers later without restructuring orders.

---

## 6. Feature areas

### 6.1 Platform administration (super-admin, outside tenant context)

- Onboard a new tenant (business name, owner contact, initial branch).
- Set **`max_branches`** for a tenant as a free-form number chosen by the platform admin — not derived from a fixed package/plan tier.
- Enable or disable individual feature flags per tenant (e.g. wholesale module, restaurant-supply module, trading-goods module, custom orders, multi-branch itself).
- View each tenant's current branch usage against their limit (e.g. "3 of 5 branches used").
- **Suspend or reactivate a tenant** — suspending blocks all login and operations across every branch of that tenant, with a visible "Account suspended — contact support" state instead of a silent failure.
- **Suspend or reactivate a single branch** within an otherwise active tenant — the branch's POS/production/inventory become read-only or inaccessible while the rest of the tenant continues operating.
- Audit log of platform-admin actions (who changed what limit/flag/suspension, and when).

### 6.2 Tenant (business owner) administration

- Add a new branch, up to the platform-set limit. Attempting to exceed the limit shows a clear message and does not silently fail.
- View which features are enabled for the business (read-only from the tenant side — only the platform admin can change flags/limits).
- Manage staff and assign them to one or more branches.
- Manage wholesale/restaurant client accounts (shared across branches, not siloed per branch).
- Cross-branch reporting with a branch filter/switcher.

### 6.3 Production

- Recipe/BOM per produced item: ingredients, quantities, expected yield.
- Batch scheduling and status tracking (baking → cooling → ready).
- Automatic raw-material deduction from inventory when a batch is logged as produced.
- Expiry/best-before tracking per batch for FIFO stock rotation.

### 6.4 Inventory

- Two product types: produced (recipe-linked) and trading (procurement-linked).
- Raw material stock with reorder thresholds and low-stock alerts.
- Finished goods stock per branch.
- Supplier records and purchase orders for trading goods and raw materials.
- Inter-branch stock transfer with dispatch and received confirmation.
- Waste/shrinkage logging with reason codes (expired, damaged, given away).

### 6.5 Sales — point of sale

- Retail counter sale generating a standard (non-fiscal) receipt in v1; the receipt format anticipates TRA VFD fiscalization being switched on later via feature flag, without changing the sale workflow.
- Channel selector (retail / wholesale / restaurant) that applies the correct price list.
- Cash and card payment methods in v1. Mobile money (ClickPesa, M-Pesa, Airtel) is planned for a later phase — the payment model already supports adding new providers without restructuring orders or payments.
- Custom order intake with deposit and due date, separate from same-day walk-in stock.

### 6.6 Wholesale and restaurant supply

- Per-client price lists and, where agreed, credit terms.
- Standing/recurring orders (e.g. daily bread order for a supermarket).
- Delivery notes and periodic statements/invoices with TIN handling for B2B fiscal receipts.
- Outstanding balance and credit limit tracking per client.

### 6.7 Reporting

- Sales by channel, by branch, by product type (produced vs. trading).
- Production yield vs. planned, and waste percentage.
- Low-stock and reorder alerts.
- Wholesale/restaurant account statements.

### 6.8 Roles, permissions, and navigation

- Permissions are granular (e.g. "take a sale" is separate from "issue a refund"; "view own branch reports" is separate from "view all-branch reports") rather than a single fixed role per user.
- The platform admin defines and edits roles/permissions for platform-admin users, and can restrict which permissions a tenant's custom roles are allowed to include (kept consistent with that tenant's enabled feature flags).
- Each tenant ships with sensible default roles (owner, branch manager, cashier, production staff) that the tenant admin can edit, extend, or replace with their own custom roles and permission sets — they are not forced to build permissions from nothing.
- A user can hold a role tenant-wide or scoped to a specific branch.
- Which menu items appear is configurable at two levels: the platform admin controls what's available to a tenant at all (in step with that tenant's feature flags), and the tenant admin controls, per role, which of those available items are visible to that role. Neither requires a code change or deployment to take effect.

### 6.9 Session and deployment reliability

- An expired session sends the user to the login page with a clear message — never a raw error page (e.g. a 419) or a screen the user can't act on.
- Where practical, an in-progress action interrupted by session expiry (such as an open POS ticket) is recoverable after logging back in, or the user is clearly told it wasn't saved.
- When a new version of the app is deployed while someone has it open, the system detects this and prompts them to refresh, instead of leaving them on a stale page that silently fails or shows a blank screen.

---

## 7. Feature gating model (summary — full detail in SRS)

Feature access is **not tied to a fixed subscription package**. Each tenant has:

- A **branch limit** (a number set directly by the platform admin, per tenant).
- A set of **feature flags** (on/off), set directly by the platform admin, per tenant.

There is no intermediate "plan" that bundles these — the platform admin can give any combination of branch count and features to any tenant individually.

---

## 8. Success metrics

- Time from tenant onboarding to first recorded sale.
- Reduction in reported stock discrepancies/waste after adoption (business-reported, qualitative in v1).
- Number of branches successfully operating under one tenant without data leakage across branches.
- Platform admin able to suspend a tenant/branch and see the effect take hold within the same session (no stale access).

---

## 9. Assumptions and constraints

- Single VPS deployment pattern consistent with Mernet's other products (`mernet-server`, Laravel Forge, PostgreSQL, Redis, Nginx).
- Laravel default application structure (no separate frontend/backend repositories or folders) — Blade/Inertia views live inside the same Laravel app.
- Tanzanian market first; currency TZS; TRA fiscalization required for retail receipts.
- Internet connectivity at branches is assumed but not guaranteed to be constant — offline/degraded-connectivity handling for POS is a candidate for a later phase, not v1.

---

## 10. Phased roadmap (indicative)

| Phase | Focus |
|---|---|
| Phase 1 | Single-branch core: catalog (produced + trading), production/BOM, inventory, POS (retail + wholesale + restaurant channels, cash/card only), basic reporting. |
| Phase 2 | Granular roles/permissions and configurable navigation menus, plus standard session-expiry and deployment-update handling. |
| Phase 3 | Multi-branch: branch entity, inter-branch transfers, cross-branch reporting, branch-scoped staff and roles. |
| Phase 4 | Platform admin console: tenant onboarding, branch limits, feature flags, tenant/branch suspension, audit log. |
| Phase 5 | Wholesale/restaurant depth: standing orders, statements, credit limits. |
| Phase 6 | Payments and compliance: mobile money integration (ClickPesa, M-Pesa, Airtel), TRA VFD fiscalization. |
| Phase 7 (candidate) | Client self-service portal, online storefront, offline POS mode. |

---

*Companion document: `oven-ledger-srs.md` (Software Requirements Specification) — data model, functional requirements, and architecture detail.*
