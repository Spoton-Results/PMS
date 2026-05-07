"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function SubmitInvoiceForm({ workOrderId, vendorId }: { workOrderId: string; vendorId?: string | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    if (!vendorId) {
      setError("Assign a vendor before submitting an invoice.");
      setSaving(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const payload = {
      vendorId,
      invoiceNumber: String(formData.get("invoiceNumber") || "") || undefined,
      invoiceAmount: Number(formData.get("invoiceAmount") || 0),
      laborAmount: formData.get("laborAmount") ? Number(formData.get("laborAmount")) : undefined,
      materialsAmount: formData.get("materialsAmount") ? Number(formData.get("materialsAmount")) : undefined
    };

    const response = await fetch(`/api/work-orders/${workOrderId}/invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || "Could not submit invoice.");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-background p-4">
      <h3 className="font-semibold">Submit invoice</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-xs text-muted">
          Invoice number
          <input name="invoiceNumber" className="rounded-lg border border-border bg-card px-3 py-2 text-foreground" placeholder="INV-1001" />
        </label>
        <label className="grid gap-2 text-xs text-muted">
          Invoice amount
          <input required name="invoiceAmount" type="number" className="rounded-lg border border-border bg-card px-3 py-2 text-foreground" placeholder="450" />
        </label>
        <label className="grid gap-2 text-xs text-muted">
          Labor amount
          <input name="laborAmount" type="number" className="rounded-lg border border-border bg-card px-3 py-2 text-foreground" placeholder="300" />
        </label>
        <label className="grid gap-2 text-xs text-muted">
          Materials amount
          <input name="materialsAmount" type="number" className="rounded-lg border border-border bg-card px-3 py-2 text-foreground" placeholder="150" />
        </label>
      </div>
      {error ? <p className="mt-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}
      <button disabled={saving} className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-background disabled:opacity-60">
        {saving ? "Submitting..." : "Submit invoice"}
      </button>
    </form>
  );
}

export function InvoiceReviewButtons({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function review(action: "APPROVE" | "REJECT") {
    setLoading(action);
    setError(null);

    const response = await fetch(`/api/invoices/${invoiceId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reviewedBy: "MVP Admin" })
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || "Could not review invoice.");
      setLoading(null);
      return;
    }

    setLoading(null);
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {error ? <p className="w-full text-sm text-danger">{error}</p> : null}
      <button onClick={() => review("APPROVE")} disabled={!!loading} className="rounded-lg border border-success/30 px-3 py-2 text-xs text-success disabled:opacity-60">
        {loading === "APPROVE" ? "Approving..." : "Approve invoice"}
      </button>
      <button onClick={() => review("REJECT")} disabled={!!loading} className="rounded-lg border border-danger/30 px-3 py-2 text-xs text-danger disabled:opacity-60">
        {loading === "REJECT" ? "Rejecting..." : "Reject invoice"}
      </button>
    </div>
  );
}

export function ReleasePayoutButton({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function release() {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/payouts/${payoutId}/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ releasedBy: "MVP Admin" })
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.holdReason || result?.error || "Could not release payout.");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mt-3">
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
      <button onClick={release} disabled={loading} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-background disabled:opacity-60">
        {loading ? "Releasing..." : "Release payout manually"}
      </button>
    </div>
  );
}
