import { getCurrentOrganization } from "@/lib/current-org";

export async function Topbar() {
  const organization = await getCurrentOrganization();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Current Organization</p>
          <h2 className="mt-1 text-lg font-bold">{organization.name}</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted">
            MVP Auth Mode
          </div>
          <div className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success ring-1 ring-success/30">
            Internal Admin
          </div>
        </div>
      </div>
    </header>
  );
}
