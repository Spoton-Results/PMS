import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AddDocumentForm, DocumentReviewButtons, ReevaluateVendorButton } from "./document-actions";
import { StripeConnectActions } from "./stripe-actions";

function statusClass(status: string) {
  if (status === "GREEN" || status === "READY" || status === "COMPLETE") return "bg-success/15 text-success ring-success/30";
  if (status === "YELLOW" || status === "PENDING" || status === "NOT_READY") return "bg-warning/15 text-warning ring-warning/30";
  return "bg-danger/15 text-danger ring-danger/30";
}

export default async function VendorDetailPage({ params }: { params: { id: string } }) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
      workOrders: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { submittedAt: "desc" } },
      payouts: { orderBy: { createdAt: "desc" } }
    }
  });

  if (!vendor) notFound();

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between border-b border-border pb-6">
          <div>
            <Link href="/vendors" className="text-sm text-muted hover:text-foreground">← Back to vendors</Link>
            <h1 className="mt-3 text-4xl font-bold">{vendor.legalName}</h1>
            <p className="mt-2 text-muted">{vendor.email}</p>
          </div>
          <span className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 ${statusClass(vendor.eligibilityStatus)}`}>
            {vendor.eligibilityStatus}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">Passport</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-muted">DBA</dt><dd>{vendor.dbaName || "Not set"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted">Contact</dt><dd>{vendor.contactName || "Not set"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted">Phone</dt><dd>{vendor.phone || "Not set"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted">Trade</dt><dd>{vendor.primaryTrade || "Not set"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted">Stripe onboarding</dt><dd><span className={`rounded-full px-2 py-1 text-xs ring-1 ${statusClass(vendor.stripeOnboardingStatus)}`}>{vendor.stripeOnboardingStatus}</span></dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted">Payout account</dt><dd><span className={`rounded-full px-2 py-1 text-xs ring-1 ${statusClass(vendor.payoutStatus)}`}>{vendor.payoutStatus}</span></dd></div>
              </dl>
              <div className="mt-5 rounded-xl border border-border bg-background p-4 text-sm text-muted">
                {vendor.eligibilityReason || "No eligibility reason recorded."}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">Payout onboarding</h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-background p-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted">Connect account</p>
                  <p className="mt-2 font-semibold">
                    {vendor.stripeConnectAccountId ? "Connected" : "Not created"}
                  </p>
                  <p className="mt-1 text-xs text-muted break-all">
                    {vendor.stripeConnectAccountId || "No Stripe Connect account yet."}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background p-4 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted">Payout readiness</p>
                  <p className="mt-2 font-semibold">{vendor.payoutStatus}</p>
                  <p className="mt-1 text-xs text-muted">
                    {vendor.payoutStatus === "READY"
                      ? "Vendor is eligible to receive payouts."
                      : "Vendor payouts are currently blocked or incomplete."}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <StripeConnectActions
                  vendorId={vendor.id}
                  hasStripeAccount={!!vendor.stripeConnectAccountId}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">Controls</h2>
              <div className="mt-4 grid gap-3">
                <ReevaluateVendorButton vendorId={vendor.id} />
                <button className="rounded-xl border border-border bg-background px-4 py-3 text-left text-sm">Suspend vendor</button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">Compliance documents</h2>
              <AddDocumentForm vendorId={vendor.id} />
              <div className="mt-4 space-y-3">
                {vendor.documents.length === 0 ? (
                  <p className="text-sm text-muted">No documents uploaded.</p>
                ) : (
                  vendor.documents.map((doc) => (
                    <div key={doc.id} className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{doc.documentType}</p>
                          <p className="text-xs text-muted">Expires: {doc.expirationDate ? doc.expirationDate.toDateString() : "No expiration"}</p>
                          <p className="mt-1 text-xs text-muted">Coverage: {doc.coverageAmount ? `$${doc.coverageAmount.toLocaleString()}` : "Not set"}</p>
                        </div>
                        <span className="text-muted">{doc.status}</span>
                      </div>
                      <DocumentReviewButtons documentId={doc.id} />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold">Recent work</h2>
              <div className="mt-4 space-y-3">
                {vendor.workOrders.length === 0 ? (
                  <p className="text-sm text-muted">No work orders assigned.</p>
                ) : (
                  vendor.workOrders.slice(0, 8).map((job) => (
                    <div key={job.id} className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{job.title}</p>
                        <span className="text-muted">{job.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">{job.jobCategory}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
