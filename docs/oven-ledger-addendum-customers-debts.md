# Addendum — Customers, Pre-Orders, Delivery, and Debt Tracking

**Project:** Oven Ledger
**Status:** Proposed addition — extends the original PRD/SRS without altering them
**Date:** 12 September 2026

---

## 1. Gaps identified

The original design tracks **wholesale/restaurant clients** (with a credit limit) and **custom orders** (celebration cakes, with a deposit and due date). It does not yet cover:

1. A general customer record for **retail** buyers — name, phone, delivery address — since retail sales were designed as anonymous at the counter.
2. **Pre-ordering** for any product on any channel — today, "order ahead with a deposit" only exists on the `custom` channel.
3. **Delivery details** — no address/contact/schedule is attached to an order anywhere in the current model.
4. A **running debt ledger** for customers — the current `clients` table has a `credit_limit` number, but no transaction history of charges and repayments, so there's no way to see how a balance got where it is or age it.
5. The **business's own debts** — money the business owes (suppliers, a loan, an owner's capital contribution/drawing) — which is a separate concern from what customers owe the business, and isn't modeled at all today.

---

## 2. Proposed additions

### 2.1 Customers (general, not just B2B)

Broaden the existing `clients` concept into a single `customers` table that covers retail, wholesale, and restaurant alike:

```
customers
  id, tenant-wide, name, phone, email (nullable),
  type (retail | wholesale | restaurant), tin_number (nullable),
  credit_limit (nullable), is_active

customer_addresses
  id, customer_id, label (e.g. "Home", "Restaurant kitchen"),
  address_text, phone, notes
```

- A retail sale may optionally be linked to a `customer_id` (for delivery or debt) or remain anonymous, as it does today.
- Wholesale/restaurant accounts work exactly as already specified — they're just `customers` with `type = wholesale/restaurant`.

### 2.2 Pre-orders and delivery, for any channel

Extend `orders` rather than keeping pre-ordering special-cased to `custom`:

```
orders
  ... existing fields ...
  is_pre_order (boolean)
  fulfillment_type (pickup | delivery)
  requested_fulfillment_at (datetime, nullable)
  delivery_address_id (nullable, references customer_addresses)
```

- Any order — a retail customer reserving 5 loaves for tomorrow morning, a restaurant's standing delivery, a wedding cake — uses the same `is_pre_order` / `requested_fulfillment_at` fields instead of three different mechanisms.
- Deposits already exist on `orders` (`deposit_amount`) and now apply uniformly to any pre-order, not just `custom`.

### 2.3 Customer debt ledger (receivables — what customers owe the business)

Replace the single `credit_limit` number with an actual transaction history:

```
customer_ledger_entries
  id, customer_id, order_id (nullable), branch_id,
  type (charge | payment), amount, balance_after, entry_date, notes
```

- A `charge` is created when an order is placed on credit; a `payment` is created when the customer pays down what they owe.
- `balance_after` gives an audit trail without recalculating history every time.
- Reporting: outstanding balance per customer, aging (how long a balance has been unpaid), and a statement view — all derivable from this table.

### 2.4 Business debt ledger (payables — what the business owes)

A separate, unrelated ledger for the business's own liabilities — supplier credit, loans, owner capital movements:

```
business_liabilities
  id, branch or tenant-wide, type (supplier_credit | loan | other),
  creditor_name, original_amount, balance_remaining, due_date (nullable),
  status (open | settled), notes

liability_payments
  id, business_liability_id, amount, paid_at, notes
```

- Covers, for example, an outstanding balance owed to a flour supplier, or a bank/microfinance loan taken out for equipment.
- Kept deliberately simple — this is debt tracking, not a full double-entry accounting system. If proper bookkeeping (P&L, balance sheet, chart of accounts) becomes a requirement, that's a bigger scope decision worth its own conversation rather than folding it in here.

### 2.5 Optional: owner capital/drawings

If useful, a lightweight record of money the owner puts into or takes out of the business, separate from operational sales/expenses:

```
owner_transactions
  id, type (capital_injection | drawing), amount, transacted_at, notes
```

This is a small addition and easy to leave out of v1 if it's not needed yet — flagging it here so it's a deliberate decision either way.

---

## 3. What this does not include

- Full double-entry bookkeeping (ledgers that balance against each other, a chart of accounts, financial statements). What's proposed here is enough to answer "who owes us what" and "what do we owe," not to replace an accountant or accounting software.
- Automated debt collection/reminders — could be a later phase (e.g. SMS reminder when a customer balance is overdue).
- Interest/penalty calculation on overdue balances — not included; add explicitly if the business needs it.

---

## 4. Suggested next step

If this direction looks right, I can fold `customers`, `customer_addresses`, the ledger tables, and the extended `orders` fields into the SRS data model as a versioned update (v1.1), and add corresponding `FR-CUST-*` / `FR-DEBT-*` requirements — same pattern as the earlier addendum, so the original SRS stays intact as the baseline.
