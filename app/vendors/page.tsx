import Link from "next/link";
import { prisma } from "@/lib/db";

function statusClass(status: string) {
  if (status === "GREEN") return "bg-success/15 text-success ring-success/30";
  if (status === "YELLOW") return "bg-warning/15 text-warning ring-warning/30";
  return "bg-danger/15 text-danger ring-danger/30";
}

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      documents: true,
      workOrders: true,
      payouts: true
    }
  });

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Vendor Passport Index</p>
            <h1 className="mt-3 text-4xl font-bold">Vendor control</h1>
            <p className="mt-3 max-w-2xl text-muted">
              Search and review vendor eligibility, compliance documents, payout readiness, and operating risk.
            </p>
          </div>
          <Link href="/vendors/new" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-background">
            Invite vendor
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-4">Vendor</th>
                <th className="px-5 py-4">Trade</th>
                <th className="px-5 py-4">Eligibility</th>
                <th className="px-5 py-4">Docs</th>
                <th className="px-5 py-4">Open Jobs</th>
                <th className="px-5 py-4">Payout Holds</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted">
                    No vendors yet. Invite your first vendor to create a passport.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => {
                  const openJobs = vendor.workOrders.filter((job) => !["PAID", "CANCELLED", "REJECTED"].includes(job.status)).length;
                  const payoutHolds = vendor.payouts.filter((payout) => payout.status === "ON_HOLD").length;

                  return (
                    <tr key={vendor.id} className="border-t border-border">
                      <td className="px-5 py-4">
                        <Link href={`/vendors/${vendor.id}`} className="font-semibold hover:underline">
                          {vendor.legalName}
                        </Link>
                        <p className="mt-1 text-xs text-muted">{vendor.email}</p>
                      </td>
                      <td className="px-5 py-4 text-muted">{vendor.primaryTrade || "Not set"}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusClass(vendor.eligibilityStatus)}`}>
                          {vendor.eligibilityStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted">{vendor.documents.length}</td>
                      <td className="px-5 py-4 text-muted">{openJobs}</td>
                      <td className="px-5 py-4 text-muted">{payoutHolds}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
