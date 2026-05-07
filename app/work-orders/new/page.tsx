"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_ORGANIZATION_ID = "seed-org";
const DEFAULT_PROPERTY_ID = "seed-property";

export default function NewWorkOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const nteRaw = String(formData.get("nteAmount") || "");
    const approvedRaw = String(formData.get("approvedEstimateAmount") || "");

    const payload = {
      organizationId: DEFAULT_ORGANIZATION_ID,
      propertyId: DEFAULT_PROPERTY_ID,
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || "") || undefined,
      jobCategory: String(formData.get("jobCategory") || ""),
      priority: String(formData.get("priority") || "NORMAL"),
      nteAmount: nteRaw ? Number(nteRaw) : undefined,
      approvedEstimateAmount: approvedRaw ? Number(approvedRaw) : undefined,
      dueDate: String(formData.get("dueDate") || "") || undefined
    };

    const response = await fetch("/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || "Could not create work order.");
      setSaving(false);
      return;
    }

    router.push("/work-orders");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section className="mx-auto max-w-3xl">
        <div className="mb-8 border-b border-border pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Create Work Order</p>
          <h1 className="mt-3 text-4xl font-bold">New work order</h1>
          <p className="mt-3 text-muted">
            MVP mode uses the seeded demo property. Property selection comes after the core control loop is working.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6">
          <div className="grid gap-5">
            <label className="grid gap-2 text-sm">
              Title
              <input required name="title" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="Kitchen sink leak" />
            </label>

            <label className="grid gap-2 text-sm">
              Job category
              <input required name="jobCategory" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="Plumbing" />
            </label>

            <label className="grid gap-2 text-sm">
              Description
              <textarea name="description" className="min-h-28 rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="Describe scope, access notes, and constraints." />
            </label>

            <label className="grid gap-2 text-sm">
              Priority
              <select name="priority" className="rounded-xl border border-border bg-background px-4 py-3 outline-none">
                <option value="LOW">LOW</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="EMERGENCY">EMERGENCY</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              NTE amount
              <input name="nteAmount" type="number" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="500" />
            </label>

            <label className="grid gap-2 text-sm">
              Approved estimate amount
              <input name="approvedEstimateAmount" type="number" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="450" />
            </label>

            <label className="grid gap-2 text-sm">
              Due date
              <input name="dueDate" type="date" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" />
            </label>

            {error ? <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}

            <button disabled={saving} className="mt-2 rounded-xl bg-white px-5 py-3 font-semibold text-background disabled:opacity-60">
              {saving ? "Creating..." : "Create work order"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
