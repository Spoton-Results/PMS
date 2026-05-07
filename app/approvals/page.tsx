import Link from "next/link";
import { prisma } from "@/lib/db";

function badge(status: string) {
  const base = "rounded-full px-3 py-1 text-xs font-semibold ring-1";
  if (["APPROVED", "READY", "PAYOUT_READY"].includes(status)) return `${base} bg-success/15 text-success ring-success/30`;
  if (["OVER_NTE", "PAYOUT_HOLD", "AWAITING_APPROVAL", "SUBMITTED"].includes(status)) return `${base} bg-warning/15 text-warning ring-warning/30`;
  if (["REJECTED", "FAILED", "CANCELLED"].includes(status)) return `${base} bg-danger/15 text-danger ring-danger/30`;
  return `${base} bg-white/10 text-muted ring-white/10`;
}

export default async function ApprovalsPage() {
  const workOrdersAwaitingApproval = await prisma.workOrder.findMany({
    where: { status: "AWAITING_APPROVAL" },
    orderBy: { updatedAt: "desc" },
    include: { property: true, vendor: true, invoice: true, payout: true }
  });

  const invoicesNeedingReview = await prisma.invoice.findMany({
    where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "OVER_NTE"] } },
    orderBy: { submittedAt: "desc" },
    include: { workOrder: { include: { property: true } }, vendor: true, payout: true }
  });

  const payoutExceptions = await prisma.payout.findMany({
    where: { status: "ON_HOLD" },
    orderBy: { updatedAt: "desc" },
    include: { workOrder: { include: { property: true } }, vendor: true, invoice: true }
  });

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 border-b border-border pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Approval Center</p>
          <h1 className="mt-3 text-4xl font-bold">Approval command queue</h1>
          <p className="mt-3 max-w-3xl text-muted">
            Review completed work, invoice exceptions, and payout holds from one operating inbox.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Work awaiting approval</p>
            <p className="mt-3 text-3xl font-bold">{workOrdersAwaitingApproval.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Invoices needing review</p>
            <p className="mt-3 text-3xl font-bold">{invoicesNeedingReview.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Payout exceptions</p>
            <p className="mt-3 text-3xl font-bold">{payoutExceptions.length}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Completed work awaiting approval</h2>
            <div className="mt-4 space-y-3">
              {workOrdersAwaitingApproval.length === 0 ? <p className="text-sm text-muted">No completed work awaiting approval.</p> : null}
              {workOrdersAwaitingApproval.map((workOrder) => (
                <Link key={workOrder.id} href={`/work-orders/${workOrder.id}`} className="block rounded-xl border border-border bg-background p-4 hover:border-white/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{workOrder.title}</p>
                      <p className="mt-1 text-sm text-muted">{workOrder.property.name} · {workOrder.vendor?.legalName || "Unassigned"}</p>
                    </div>
                    <span className={badge(workOrder.status)}>{workOrder.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Invoices needing review</h2>
            <div className="mt-4 space-y-3">
              {invoicesNeedingReview.length === 0 ? <p className="text-sm text-muted">No invoices need review.</p> : null}
              {invoicesNeedingReview.map((invoice) => (
                <Link key={invoice.id} href={`/work-orders/${invoice.workOrderId}`} className="block rounded-xl border border-border bg-background p-4 hover:border-white/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">${invoice.invoiceAmount.toLocaleString()} · {invoice.vendor.legalName}</p>
                      <p className="mt-1 text-sm text-muted">{invoice.workOrder.title} · {invoice.workOrder.property.name}</p>
                    </div>
                    <span className={badge(invoice.status)}>{invoice.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Payout exceptions</h2>
            <div className="mt-4 space-y-3">
              {payoutExceptions.length === 0 ? <p className="text-sm text-muted">No payout exceptions.</p> : null}
              {payoutExceptions.map((payout) => (
                <Link key={payout.id} href={`/work-orders/${payout.workOrderId}`} className="block rounded-xl border border-border bg-background p-4 hover:border-white/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">${payout.grossAmount.toLocaleString()} · {payout.vendor.legalName}</p>
                      <p className="mt-1 text-sm text-warning">{payout.holdReason || "No hold reason recorded"}</p>
                    </div>
                    <span className={badge(payout.status)}>{payout.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
