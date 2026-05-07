export default function NewVendorPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8 border-b border-border pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Invite Vendor</p>
          <h1 className="mt-3 text-4xl font-bold">Create vendor passport</h1>
          <p className="mt-3 text-muted">
            This is the first screen for adding vendors. The form posts to /api/vendors once an organization exists.
          </p>
        </div>

        <form className="rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-5">
            <label className="grid gap-2 text-sm">
              Legal business name
              <input name="legalName" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="ABC Plumbing LLC" />
            </label>

            <label className="grid gap-2 text-sm">
              DBA name
              <input name="dbaName" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="ABC Plumbing" />
            </label>

            <label className="grid gap-2 text-sm">
              Contact name
              <input name="contactName" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="Jane Smith" />
            </label>

            <label className="grid gap-2 text-sm">
              Email
              <input name="email" type="email" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="vendor@example.com" />
            </label>

            <label className="grid gap-2 text-sm">
              Phone
              <input name="phone" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="555-555-5555" />
            </label>

            <label className="grid gap-2 text-sm">
              Primary trade
              <input name="primaryTrade" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="Plumbing" />
            </label>

            <button type="button" className="mt-2 rounded-xl bg-white px-5 py-3 font-semibold text-background">
              Save vendor passport
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
