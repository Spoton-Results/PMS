# Vendor Control OS

Vendor Control OS is a proof-to-pay vendor control layer for property operations.

It is designed to sit on top of existing property management and accounting systems. It does not replace tenant ledgers, rent collection, trust accounting, or resident portals.

## Core product rule

No eligible vendor, no assignment.  
No valid proof, no invoice approval.  
No green state, no payout.

## MVP modules

- Organization, portfolio, property, and unit structure
- Vendor passport
- Vendor compliance documents
- Green, yellow, and red vendor eligibility status
- Work orders
- Proof templates and proof submissions
- Invoice approval
- Payout readiness and payout holds
- Audit events
- Stripe Connect-ready fields

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Stripe Connect

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

## First build target

The first working version should let a property operator:

1. Create a vendor passport.
2. Upload and review compliance documents.
3. Evaluate vendor eligibility.
4. Create a work order.
5. Block red vendors from assignment.
6. Require a proof pack before approval.
7. Hold payout if proof, invoice, compliance, or Stripe onboarding is incomplete.
