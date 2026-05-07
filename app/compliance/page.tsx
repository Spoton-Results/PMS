import Link from "next/link";
import { prisma } from "@/lib/db";

function statusClass(status: string) {
  if (status === "GREEN" || status === "APPROVED") return "bg-success/15 text-success ring-success/30";
  if (status === "YELLOW" || status === "PENDING") return "bg-warning/15 text-warning ring-warning/30";
  return "bg-danger/15 text-danger ring-danger/30";
}

export default async function CompliancePage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: [{ eligibilityStatus: "desc" }, { legalName: "asc" }],
    include: { documents: true, payouts: true, workOrders: true }
  });

  const documents = await prisma.vendorDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: { vendor: true }
  });

  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const blockedVendors = vendors.filter((vendor) => vendor.eligibilityStatus === "RED");
  const yellowVendors = vendors.filter((vendor) => vendor.eligibilityStatus === "YELLOW");
  const missingW9Vendors = vendors.filter((vendor) => !vendor.documents.some((doc) => doc.documentType === "W9" && doc.status === "APPROVED"));
  const expiringDocs = documents.filter((doc) => doc.expirationDate && doc.expirationDate <= thirtyDaysFromNow && doc.expirationDate >= now);
  const expiredDocs = documents.filter((doc) => doc.status === "EXPIRED" || (doc.expirationDate && doc.expirationDate < now));

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 border-b border-border pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Compliance Command Center</p>
          <h1 className="mt-3 text-4xl font-bold">Vendor compliance</h1>
          <p className="mt-3 max-w-3xl text-muted">
            Control vendor eligibility, missing documents, expiring insurance, and payout blockers before work is assigned.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Blocked vendors</p>
            <p className="mt-3 text-3xl font-bold">{blockedVendors.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Conditional vendors</p>
            <p className="mt-3 text-3xl font-bold">{yellowVendors.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Missing W-9</p>
            <p className="mt-3 text-3xl font-bold">{missingW9Vendors.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Expiring docs</p>
            <p className="mt-3 text-3xl font-bold">{expiringDocs.length}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">Expired docs</p>
            <p className="mt-3 text-3xl font-bold">{expiredDocs.length}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Blocked and conditional vendors</h2>
            <div className="mt-4 space-y-3">
              {[...blockedVendors, ...yellowVendors].length === 0 ? <p className="text-sm text-muted">No blocked or conditional vendors.</p> : null}
              {[...blockedVendors, ...yellowVendors].map((vendor) => (
                <Link key={vendor.id} href={`/vendors/${vendor.id}`} className="block rounded-xl border border-border bg-background p-4 hover:border-white/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{vendor.legalName}</p>
                      <p className="mt-1 text-sm text-muted">{vendor.eligibilityReason || "No reason recorded"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClass(vendor.eligibilityStatus)}`}>{vendor.eligibilityStatus}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Document risks</h2>
            <div className="mt-4 space-y-3">
              {[...expiredDocs, ...expiringDocs].length === 0 ? <p className="text-sm text-muted">No expired or expiring documents.</p> : null}
              {[...expiredDocs, ...expiringDocs].map((doc) => (
                <Link key={doc.id} href={`/vendors/${doc.vendorId}`} className="block rounded-xl border border-border bg-background p-4 hover:border-white/30">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold">{doc.vendor.legalName}</p>
                      <p className="mt-1 text-sm text-muted">{doc.documentType} · Expires {doc.expirationDate ? doc.expirationDate.toDateString() : "No expiration"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClass(doc.status)}`}>{doc.status}</span>
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
