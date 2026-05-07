import Link from "next/link";
import { prisma } from "@/lib/db";

function badge(status: string) {
  const base = "rounded-full px-3 py-1 text-xs font-semibold ring-1";
  if (["READY", "RELEASED", "PAID"].includes(status)) return `${base} bg-success/15 text-success ring-success/30`;
  if (["ON_HOLD", "NOT_READY"].includes(status)) return `${base} bg-warning/15 text-warning ring-warning/30`;
  if (["FAILED", "CANCELLED"].includes(status)) return `${base} bg-danger/15 text-danger ring-danger/30`;
  return `${base} bg-white/10 text-muted ring-white/10`;
}

export default async function PayoutsPage() {
  const payouts = await prisma.payout.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      vendor: true,
      invoice: true,
      workOrder: { include: { property: true } }
    }
  });

  const ready = payouts.filter((payout) => payout.status === "READY");
  const onHold = payouts.filter((payout) => payout.status === "ON_HOLD");
  const released = payouts.filter((payout) => payout.status === "RELEASED" || payout.status === "PAID");
  const totalReady = ready.reduce((sum, payout) => sum + payout.grossAmount, 0);
  const totalHeld = onHold.reduce((sum, payout) => sum + payout.grossAmount, 0);
  const totalFees = payouts.reduce((sum, payout) => sum + payout.platformFee, 0);

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 border-b border-border pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Payout Control Center</p>
          <h1 className="mt-3 text-4xl font-bold">Payouts</h1>
          <p className="mt-3 max-w-3xl text-muted">
            Track ready payouts, blocked payouts, released payouts, and fee capture from approved vendor spend.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Ready payouts</p>
            <p className="mt-3 text-3xl font-bold">${totalReady.toLocaleString()}</p>
            <p className="mt-2 text-xs text-muted">{ready.length} payout(s)</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Held payouts</p>
            <p className="mt-3 text-3xl font-bold">${totalHeld.toLocaleString()}</p>
            <p className="mt-2 text-xs text-muted">{onHold.length} payout(s)</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Released</p>
            <p className="mt-3 text-3xl font-bold">{released.length}</p>
            <p className="mt-2 text-xs text-muted">Manual MVP releases</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Platform fees</p>
            <p className="mt-3 text-3xl font-bold">${totalFees.toLocaleString()}</p>
            <p className="mt-2 text-xs text-muted">Modeled at 1%</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-4">Payout</th>
                <th className="px-5 py-4">Vendor</th>
                <th className="px-5 py-4">Work order</th>
                <th className="px-5 py-4">Gross</th>
                <th className="px-5 py-4">Fee</th>
                <th className="px-5 py-4">Net</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    No payouts yet. Approve an invoice to create payout readiness.
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="border-t border-border">
                    <td className="px-5 py-4">
                      <Link href={`/work-orders/${payout.workOrderId}`} className="font-semibold hover:underline">
                        {payout.holdReason ? "Blocked payout" : "Payout"}
                      </Link>
                      {payout.holdReason ? <p className="mt-1 max-w-sm text-xs text-warning">{payout.holdReason}</p> : null}
                    </td>
                    <td className="px-5 py-4 text-muted">{payout.vendor.legalName}</td>
                    <td className="px-5 py-4 text-muted">{payout.workOrder.title}</td>
                    <td className="px-5 py-4 text-muted">${payout.grossAmount.toLocaleString()}</td>
                    <td className="px-5 py-4 text-muted">${payout.platformFee.toLocaleString()}</td>
                    <td className="px-5 py-4 text-muted">${payout.netVendorAmount.toLocaleString()}</td>
                    <td className="px-5 py-4"><span className={badge(payout.status)}>{payout.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
