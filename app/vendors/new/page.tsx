"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_ORGANIZATION_ID = "seed-org";

export default function NewVendorPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    const payload = {
      organizationId: DEFAULT_ORGANIZATION_ID,
      legalName: String(formData.get("legalName") || ""),
      dbaName: String(formData.get("dbaName") || "") || undefined,
      contactName: String(formData.get("contactName") || "") || undefined,
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || "") || undefined,
      primaryTrade: String(formData.get("primaryTrade") || "") || undefined,
      serviceRegions: String(formData.get("serviceRegions") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      serviceCategories: String(formData.get("serviceCategories") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    };

    const response = await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || "Could not create vendor passport.");
      setSaving(false);
      return;
    }

    router.push("/vendors");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8 border-b border-border pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Invite Vendor</p>
          <h1 className="mt-3 text-4xl font-bold">Create vendor passport</h1>
          <p className="mt-3 text-muted">
            New vendors start red until compliance documents and payout onboarding are reviewed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-5">
            <label className="grid gap-2 text-sm">
              Legal business name
              <input required name="legalName" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="ABC Plumbing LLC" />
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
              <input required name="email" type="email" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="vendor@example.com" />
            </label>

            <label className="grid gap-2 text-sm">
              Phone
              <input name="phone" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="555-555-5555" />
            </label>

            <label className="grid gap-2 text-sm">
              Primary trade
              <input name="primaryTrade" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="Plumbing" />
            </label>

            <label className="grid gap-2 text-sm">
              Service regions
              <input name="serviceRegions" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="UT, NV, AZ" />
            </label>

            <label className="grid gap-2 text-sm">
              Service categories
              <input name="serviceCategories" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="Plumbing, Emergency Repair" />
            </label>

            {error ? <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}

            <button disabled={saving} className="mt-2 rounded-xl bg-white px-5 py-3 font-semibold text-background disabled:opacity-60">
              {saving ? "Saving..." : "Save vendor passport"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
