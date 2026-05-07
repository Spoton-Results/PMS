import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AssignVendorForm } from "./assignment-actions";

function statusBadge(status: string) {
  const base = "rounded-full px-3 py-1 text-xs font-semibold ring-1";
  if (["PAYOUT_READY", "PAID", "APPROVED"].includes(status)) return `${base} bg-success/15 text-success ring-success/30`;
  if (["PAYOUT_HOLD", "AWAITING_APPROVAL", "AWAITING_PROOF"].includes(status)) return `${base} bg-warning/15 text-warning ring-warning/30`;
  if (["REJECTED", "CANCELLED"].includes(status)) return `${base} bg-danger/15 text-danger ring-danger/30`;
  return `${base} bg-white/10 text-muted ring-white/10`;
}

export default async function WorkOrderDetailPage({ params }: { params: { id: string } }) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      property: true,
      vendor: true,
      proofSubmissions: true,
      invoice: true,
      payout: true
    }
  });

  if (!workOrder) notFound();

  const vendors = await prisma.vendor.findMany({
    where: { organizationId: workOrder.organizationId },
    orderBy: [{ eligibilityStatus: "asc" }, { legalName: "asc" }]
  });

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between border-b border-border pb-6">
          <div>
            <Link href="/work-orders" className="text-sm text-muted hover:text-foreground">← Back to work orders</Link>
            <h1 className="mt-3 text-4xl font-bold">{workOrder.title}</h1>
            <p className="mt-2 text-muted">{workOrder.property.name} · {workOrder.jobCategory}</p>
          </div>
          <span className={statusBadge(workOrder.status)}>{workOrder.status}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">Work details</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-muted">Property</dt><dd>{workOrder.property.name}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted">Priority</dt><dd>{workOrder.priority}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted">NTE</dt><dd>{workOrder.nteAmount ? `$${workOrder.nteAmount.toLocaleString()}` : "Not set"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted">Approved estimate</dt><dd>{workOrder.approvedEstimateAmount ? `$${workOrder.approvedEstimateAmount.toLocaleString()}` : "Not set"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted">Due date</dt><dd>{workOrder.dueDate ? workOrder.dueDate.toDateString() : "Not set"}</dd></div>
              </dl>
              <div className="mt-5 rounded-xl border border-border bg-background p-4 text-sm text-muted">
                {workOrder.description || "No description recorded."}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">Assigned vendor</h2>
              {workOrder.vendor ? (
                <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm">
                  <Link href={`/vendors/${workOrder.vendor.id}`} className="font-semibold hover:underline">
                    {workOrder.vendor.legalName}
                  </Link>
                  <p className="mt-1 text-muted">{workOrder.vendor.primaryTrade || "No trade set"}</p>
                  <p className="mt-1 text-muted">Eligibility: {workOrder.vendor.eligibilityStatus}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">No vendor assigned yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <AssignVendorForm workOrderId={workOrder.id} vendors={vendors} />

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">Proof-to-pay state</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted">Proof submissions</p>
                  <p className="mt-2 text-2xl font-bold">{workOrder.proofSubmissions.length}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted">Invoice</p>
                  <p className="mt-2 text-sm font-semibold">{workOrder.invoice?.status || "Not submitted"}</p>
                </div>
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted">Payout</p>
                  <p className="mt-2 text-sm font-semibold">{workOrder.payout?.status || "Not ready"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
