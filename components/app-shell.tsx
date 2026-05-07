import Link from "next/link";

const navItems = [
  { href: "/", label: "Dashboard", description: "Portfolio control" },
  { href: "/vendors", label: "Vendors", description: "Vendor passports" },
  { href: "/work-orders", label: "Work Orders", description: "Dispatch queue" },
  { href: "/approvals", label: "Approvals", description: "Review center" },
  { href: "/payouts", label: "Payouts", description: "Money control" },
  { href: "/compliance", label: "Compliance", description: "Risk center" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-border bg-card/80 px-5 py-5 lg:min-h-screen lg:border-b-0 lg:border-r lg:py-6">
        <Link href="/" className="block rounded-2xl border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Vendor Control OS</p>
          <p className="mt-2 text-lg font-bold">Proof-to-pay</p>
          <p className="mt-1 text-xs text-muted">Control layer for property vendor operations</p>
        </Link>

        <nav className="mt-6 grid gap-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-xl border border-transparent px-4 py-3 transition hover:border-border hover:bg-background">
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="mt-1 block text-xs text-muted">{item.description}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-border bg-background p-4 text-xs text-muted">
          <p className="font-semibold text-foreground">Control rule</p>
          <p className="mt-2">No compliance → no assignment.</p>
          <p>No proof → no approval.</p>
          <p>No green state → no payout.</p>
        </div>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
