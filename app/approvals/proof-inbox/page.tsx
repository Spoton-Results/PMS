import Link from "next/link";
import { prisma } from "@/lib/db";

function badge(status: string) {
  const base = "rounded-full px-3 py-1 text-xs font-semibold ring-1";
  if (status === "APPROVED") return `${base} bg-success/15 text-success ring-success/30`;
  if (status === "PENDING") return `${base} bg-warning/15 text-warning ring-warning/30`;
  if (status === "REJECTED" || status === "REWORK_REQUESTED") return `${base} bg-danger/15 text-danger ring-danger/30`;
  return `${base} bg-white/10 text-muted ring-white/10`;
}

function isImage(url?: string | null) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
}

export default async function ProofApprovalInboxPage() {
  const pendingProof = await prisma.proofSubmission.findMany({
    where: { reviewStatus: "PENDING" },
    orderBy: { submittedAt: "asc" },
    include: {
      proofRequirement: true,
      workOrder: {
        include: {
          property: true,
          vendor: true
        }
      }
    }
  });

  const recentDecisions = await prisma.approval.findMany({
    where: { entityType: "PROOF_SUBMISSION" },
    orderBy: { decidedAt: "desc" },
    take: 20,
    include: {
      workOrder: {
        include: {
          property: true,
          vendor: true
        }
      }
    }
  });

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 border-b border-border pb-6">
          <Link href="/approvals" className="text-sm text-muted hover:text-foreground">← Back to approvals</Link>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-muted">Proof Approval Inbox</p>
          <h1 className="mt-3 text-4xl font-bold">Review submitted proof</h1>
          <p className="mt-3 max-w-3xl text-muted">
            Review field evidence, open the work order, and approve, reject, or request rework from the work order workflow.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Pending proof reviews</p>
            <p className="mt-3 text-3xl font-bold">{pendingProof.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Recent decisions</p>
            <p className="mt-3 text-3xl font-bold">{recentDecisions.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Queue type</p>
            <p className="mt-3 text-3xl font-bold">Proof</p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Pending proof queue</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {pendingProof.length === 0 ? <p className="text-sm text-muted">No pending proof reviews.</p> : null}
            {pendingProof.map((proof) => (
              <div key={proof.id} className="overflow-hidden rounded-2xl border border-border bg-background">
                {isImage(proof.fileUrl) ? (
                  <img src={proof.fileUrl || ""} alt={proof.proofRequirement.label} className="h-56 w-full object-cover" />
                ) : proof.fileUrl ? (
                  <div className="flex h-56 items-center justify-center bg-card text-sm text-muted">
                    <a href={proof.fileUrl} target="_blank" rel="noreferrer" className="underline">Open evidence file</a>
                  </div>
                ) : (
                  <div className="flex h-56 items-center justify-center bg-card text-sm text-muted">Structured proof</div>
                )}

                <div className="p-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{proof.proofRequirement.label}</p>
                      <p className="mt-1 text-muted">{proof.workOrder.title} · {proof.workOrder.property.name}</p>
                      <p className="mt-1 text-muted">Vendor: {proof.workOrder.vendor?.legalName || "Unknown"}</p>
                    </div>
                    <span className={badge(proof.reviewStatus)}>{proof.reviewStatus}</span>
                  </div>

                  {proof.textValue ? <p className="mt-3 rounded-xl border border-border bg-card p-3 text-muted">{proof.textValue}</p> : null}
                  {proof.fileKey ? <p className="mt-3 break-all text-xs text-muted">{proof.fileKey}</p> : null}

                  <Link href={`/work-orders/${proof.workOrderId}`} className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-xs font-semibold text-background">
                    Review on work order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-semibold">Recent proof decisions</h2>
          <div className="mt-4 space-y-3">
            {recentDecisions.length === 0 ? <p className="text-sm text-muted">No proof decisions yet.</p> : null}
            {recentDecisions.map((approval) => (
              <Link key={approval.id} href={approval.workOrderId ? `/work-orders/${approval.workOrderId}` : "/approvals"} className="block rounded-xl border border-border bg-background p-4 hover:border-white/30">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{approval.type}</p>
                    <p className="mt-1 text-sm text-muted">{approval.workOrder?.title || approval.entityId}</p>
                    {approval.decisionNote ? <p className="mt-1 text-sm text-muted">{approval.decisionNote}</p> : null}
                  </div>
                  <span className={badge(approval.status)}>{approval.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
