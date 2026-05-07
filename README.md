# Vendor Control OS

Vendor Control OS is a proof-to-pay vendor control layer for property operations.

It is designed to sit on top of existing property management and accounting systems. It does not replace tenant ledgers, rent collection, trust accounting, or resident portals.

## Core product rule

No eligible vendor, no assignment.  
No valid proof, no invoice approval.  
No green state, no payout.

## Current MVP modules

- Shared command-center navigation shell
- Live dashboard metrics
- Organization, portfolio, property, and unit structure
- Vendor passport index and detail pages
- Vendor compliance document records
- Document approval, rejection, expiration, and eligibility recalculation
- Green, yellow, and red vendor eligibility status
- Work order creation and dispatch queue
- Assignment gate that blocks red vendors and requires override for yellow vendors
- Proof templates and proof submissions
- Proof completeness evaluation
- Invoice submission, review, approval, and rejection
- Payout readiness checks and payout holds
- Manual payout release for MVP
- Approval, payout, and compliance command centers
- Audit events
- Stripe Connect-ready fields

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Stripe Connect-ready architecture

## Local setup

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Add your PostgreSQL database URL to `.env`.

Generate Prisma client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate
```

Seed demo data:

```bash
npm run prisma:seed
```

Run type and rule checks:

```bash
npm run check
```

Start development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

Health check:

```txt
http://localhost:3000/api/health
```

## App routes

```txt
/                 Dashboard
/vendors          Vendor Passport Index
/vendors/new      Create Vendor Passport
/vendors/[id]     Vendor Passport Detail
/work-orders      Work Queue
/work-orders/new  Create Work Order
/work-orders/[id] Work Order Detail
/approvals        Approval Center
/payouts          Payout Control Center
/compliance       Compliance Command Center
```

## API routes

```txt
GET  /api/health
POST /api/bootstrap
GET  /api/vendors
POST /api/vendors
GET  /api/vendors/[id]/documents
POST /api/vendors/[id]/documents
PATCH /api/vendor-documents/[id]/review
POST /api/vendors/[id]/reevaluate
GET  /api/work-orders
POST /api/work-orders
POST /api/work-orders/[id]/assign
PATCH /api/work-orders/[id]/proof-template
GET  /api/work-orders/[id]/proof
POST /api/work-orders/[id]/proof
POST /api/work-orders/[id]/invoice
PATCH /api/invoices/[id]/review
POST /api/payouts/[id]/release
GET  /api/proof-templates
POST /api/proof-templates
```

## Demo flow

1. Seed the database.
2. Open `/vendors` and review green/red vendors.
3. Open `/work-orders` and create or open a work order.
4. Try assigning a red vendor and confirm the assignment is blocked.
5. Assign a green vendor.
6. Submit all required proof items.
7. Submit an invoice.
8. Approve the invoice.
9. Confirm payout becomes READY or ON_HOLD with a reason.
10. Release a READY payout manually.

## Next build target

The next major layer should be authentication and organization scoping. MVP pages currently use seeded demo organization records so the proof-to-pay control loop can be built and tested quickly.
