import Link from "next/link";
import { prisma } from "@/lib/db";

function statusBadge(status: string) {
  const base = "rounded-full px-3 py-1 text-xs font-semibold ring-1";
  if (["PAYOUT_READY", "PAID", "APPROVED"].includes(status)) return `${base} bg-success/15 text-success ring-success/30`;
  if (["PAYOUT_HOLD", "AWAITING_APPROVAL", "AWAITING_PROOF"].includes(status)) return `${base} bg-warning/15 text-warning ring-warning/30`;
  if (["REJECTED", "CANCELLED"].includes(status)) return `${base} bg-danger/15 text-danger ring-danger/30`;
  return `${base} bg-white/10 text-muted ring-white/10`;
}

export default async function WorkOrdersPage() {
  const workOrders = await prisma.workOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      property: true,
      vendor: true,
      proofSubmissions: true,
      invoice: true,
      payout: true
    }
  });

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Work Queue</p>
            <h1 className="mt-3 text-4xl font-bold">Work orders</h1>
            <p className="mt-3 max-w-2xl text-muted">
              Dispatch work, enforce assignment rules, and track proof-to-pay progress.
            </p>
          </div>
          <Link href="/work-orders/new" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-background">
            Create work order
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-4">Work</th>
                <th className="px-5 py-4">Property</th>
                <th className="px-5 py-4">Vendor</th>
                <th className="px-5 py-4">Priority</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">NTE</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted">
                    No work orders yet. Create the first work order to test assignment blocking.
                  </td>
                </tr>
              ) : (
                workOrders.map((workOrder) => (
                  <tr key={workOrder.id} className="border-t border-border">
                    <td className="px-5 py-4">
                      <Link href={`/work-orders/${workOrder.id}`} className="font-semibold hover:underline">
                        {workOrder.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted">{workOrder.jobCategory}</p>
                    </td>
                    <td className="px-5 py-4 text-muted">{workOrder.property.name}</td>
                    <td className="px-5 py-4 text-muted">{workOrder.vendor?.legalName || "Unassigned"}</td>
                    <td className="px-5 py-4 text-muted">{workOrder.priority}</td>
                    <td className="px-5 py-4"><span className={statusBadge(workOrder.status)}>{workOrder.status}</span></td>
                    <td className="px-5 py-4 text-muted">{workOrder.nteAmount ? `$${workOrder.nteAmount.toLocaleString()}` : "Not set"}</td>
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
