import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function HomePage() {
  const [vendors, workOrders, payouts, invoices, documents] = await Promise.all([
    prisma.vendor.findMany({ include: { documents: true } }),
    prisma.workOrder.findMany(),
    prisma.payout.findMany(),
    prisma.invoice.findMany(),
    prisma.vendorDocument.findMany()
  ]);

  const greenVendors = vendors.filter((vendor) => vendor.eligibilityStatus === "GREEN").length;
  const blockedVendors = vendors.filter((vendor) => vendor.eligibilityStatus === "RED").length;
  const openWorkOrders = workOrders.filter((workOrder) => !["PAID", "REJECTED", "CANCELLED"].includes(workOrder.status)).length;
  const awaitingProof = workOrders.filter((workOrder) => workOrder.status === "AWAITING_PROOF").length;
  const awaitingApproval = workOrders.filter((workOrder) => workOrder.status === "AWAITING_APPROVAL").length;
  const invoiceReview = invoices.filter((invoice) => ["SUBMITTED", "UNDER_REVIEW", "OVER_NTE"].includes(invoice.status)).length;
  const payoutReady = payouts.filter((payout) => payout.status === "READY").length;
  const payoutHolds = payouts.filter((payout) => payout.status === "ON_HOLD");
  const payoutHoldAmount = payoutHolds.reduce((sum, payout) => sum + payout.grossAmount, 0);
  const expiringOrExpiredDocs = documents.filter((doc) => doc.status === "EXPIRED" || doc.status === "REJECTED").length;

  const stats = [
    { label: "Active Vendors", value: vendors.length.toString(), detail: `${greenVendors} green eligible`, href: "/vendors" },
    { label: "Blocked Vendors", value: blockedVendors.toString(), detail: "Compliance or payout issue", href: "/compliance" },
    { label: "Open Work Orders", value: openWorkOrders.toString(), detail: `${awaitingProof} awaiting proof`, href: "/work-orders" },
    { label: "Payout Holds", value: `$${payoutHoldAmount.toLocaleString()}`, detail: `${payoutHolds.length} payout(s) blocked`, href: "/payouts" }
  ];

  const queues = [
    { label: "Awaiting proof", count: awaitingProof, href: "/work-orders" },
    { label: "Awaiting approval", count: awaitingApproval, href: "/approvals" },
    { label: "Compliance review", count: expiringOrExpiredDocs, href: "/compliance" },
    { label: "Invoice review", count: invoiceReview, href: "/approvals" },
    { label: "Payout ready", count: payoutReady, href: "/payouts" },
    { label: "Payout holds", count: payoutHolds.length, href: "/payouts" }
  ];

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Vendor Control OS</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Proof-to-pay control tower</h1>
            <p className="mt-3 max-w-3xl text-base text-muted">
              Control vendor eligibility, required proof, invoice approval, and payout release in one operating layer.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted">
            Live MVP dashboard connected to vendor, work, invoice, payout, and compliance records.
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.label} href={stat.href} className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/10 transition hover:border-white/30">
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-3 text-3xl font-bold">{stat.value}</p>
              <p className="mt-2 text-xs text-muted">{stat.detail}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Operating control loop</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-5">
              {[
                { label: "Vendor Passport", href: "/vendors" },
                { label: "Work Order", href: "/work-orders" },
                { label: "Proof Pack", href: "/work-orders" },
                { label: "Invoice Review", href: "/approvals" },
                { label: "Payout Release", href: "/payouts" }
              ].map((step, index) => (
                <Link key={step.label} href={step.href} className="rounded-xl border border-border bg-background p-4 transition hover:border-white/30">
                  <p className="text-xs text-muted">Step {index + 1}</p>
                  <p className="mt-2 font-semibold">{step.label}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Control queues</h2>
            <div className="mt-4 space-y-3">
              {queues.map((queue) => (
                <Link key={queue.label} href={queue.href} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 transition hover:border-white/30">
                  <span>{queue.label}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-muted">{queue.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
