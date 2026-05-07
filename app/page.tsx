const stats = [
  { label: "Active Vendors", value: "128", detail: "97 green eligible" },
  { label: "Blocked Vendors", value: "19", detail: "Compliance or payout issue" },
  { label: "Open Work Orders", value: "342", detail: "41 at SLA risk" },
  { label: "Payout Holds", value: "$48,720", detail: "Blocked until proof or approval" }
];

const queues = [
  "Awaiting proof",
  "Awaiting approval",
  "Compliance review",
  "Invoice over NTE",
  "Payout ready",
  "Failed payouts"
];

export default function HomePage() {
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
            Core rule: no compliance, no proof, no payout.
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-5 shadow-xl shadow-black/10">
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-3 text-3xl font-bold">{stat.value}</p>
              <p className="mt-2 text-xs text-muted">{stat.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Operating control loop</h2>
            <div className="mt-6 grid gap-3 md:grid-cols-5">
              {["Vendor Passport", "Work Order", "Proof Pack", "Invoice Review", "Payout Release"].map((step, index) => (
                <div key={step} className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs text-muted">Step {index + 1}</p>
                  <p className="mt-2 font-semibold">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">Control queues</h2>
            <div className="mt-4 space-y-3">
              {queues.map((queue) => (
                <div key={queue} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
                  <span>{queue}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-muted">Open</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
