# Issue / Fix Note — Tenant Access via a Single Shared Subdomain

**Project:** Oven Ledger
**Status:** Decision made — supersedes SRS §2.2 as originally written
**Date:** 12 September 2026

---

## Issue

The SRS originally assumed the standard `stancl/tenancy` pattern of **one subdomain per tenant** (e.g. `kilimani-bakehouse.mernettechnologies.com`, `sunrise-cakes.mernettechnologies.com`), with the tenant resolved from the subdomain on every request.

## Decision

We will **not** issue a subdomain per tenant. All tenants access Oven Ledger through **one shared Mernet subdomain**:

```
oven.mernettechnologies.com
```

Every business logs in at the same URL. There is no `<business>.mernettechnologies.com` per tenant.

## Why

- One subdomain means one SSL certificate and one DNS entry to manage, instead of provisioning a new subdomain (and cert) every time a tenant is onboarded.
- Simpler for tenants to remember and share internally — one URL for the whole product, not a different link per business.
- Removes a manual onboarding step (subdomain/DNS setup) from getting a new tenant live.

## What this changes technically

Tenant resolution can no longer rely on the domain/subdomain, since every tenant hits the same host. `stancl/tenancy` needs to resolve the tenant a different way:

- **Resolution point:** after login, not from the request domain. A user's account is tied to exactly one tenant; once they authenticate, the tenant is resolved from the user record and set for the rest of the session.
- **Login screen:** a single shared login page at `oven.mernettechnologies.com`. No "enter your business's subdomain first" step.
- **Platform admin access:** the platform admin console lives on the same shared domain, under a distinct route/guard (e.g. `oven.mernettechnologies.com/platform-admin`), separate from tenant login.
- **Central vs. tenant routing:** still split as before (central/landlord routes vs. tenant-scoped routes) — the difference is only in *how* the tenant is identified, not in the schema-per-tenant data isolation, which is unchanged.

## What stays the same

- Schema-per-tenant isolation in PostgreSQL — unaffected. This is purely about how the tenant is *identified*, not how its data is stored or separated.
- All other architecture from the SRS (Laravel default structure, Redis, Nginx, Forge deployment) is unchanged.

## Action items

- [x] Update `stancl/tenancy` config from domain/subdomain identification to a login-based (session) tenant resolver.
- [x] Remove any DNS/subdomain provisioning step from the tenant-onboarding flow.
- [x] Add a tenant-mismatch safeguard: if a user's session somehow points at a tenant they don't belong to, deny and force re-login rather than trusting the session blindly.
