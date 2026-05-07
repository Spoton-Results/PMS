"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const documentTypes = [
  "W9",
  "GENERAL_LIABILITY",
  "WORKERS_COMP",
  "BUSINESS_LICENSE",
  "TRADE_LICENSE",
  "COI",
  "OTHER"
];

export function AddDocumentForm({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const coverageRaw = String(formData.get("coverageAmount") || "");

    const payload = {
      documentType: String(formData.get("documentType")),
      fileUrl: String(formData.get("fileUrl") || "manual-record"),
      expirationDate: String(formData.get("expirationDate") || "") || undefined,
      coverageAmount: coverageRaw ? Number(coverageRaw) : undefined
    };

    const response = await fetch(`/api/vendors/${vendorId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || "Could not add document.");
      setSaving(false);
      return;
    }

    event.currentTarget.reset();
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 rounded-xl border border-border bg-background p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-xs text-muted">
          Document type
          <select name="documentType" className="rounded-lg border border-border bg-card px-3 py-2 text-foreground">
            {documentTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-xs text-muted">
          Expiration date
          <input name="expirationDate" type="date" className="rounded-lg border border-border bg-card px-3 py-2 text-foreground" />
        </label>
        <label className="grid gap-2 text-xs text-muted">
          File URL
          <input name="fileUrl" className="rounded-lg border border-border bg-card px-3 py-2 text-foreground" placeholder="https://..." />
        </label>
        <label className="grid gap-2 text-xs text-muted">
          Coverage amount
          <input name="coverageAmount" type="number" className="rounded-lg border border-border bg-card px-3 py-2 text-foreground" placeholder="1000000" />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <button disabled={saving} className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-background disabled:opacity-60">
        {saving ? "Adding..." : "Add document record"}
      </button>
    </form>
  );
}

export function DocumentReviewButtons({ documentId }: { documentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function review(status: "APPROVED" | "REJECTED" | "EXPIRED") {
    setLoading(status);
    await fetch(`/api/vendor-documents/${documentId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewedBy: "MVP Admin" })
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button onClick={() => review("APPROVED")} disabled={!!loading} className="rounded-lg border border-success/30 px-3 py-1 text-xs text-success">Approve</button>
      <button onClick={() => review("REJECTED")} disabled={!!loading} className="rounded-lg border border-danger/30 px-3 py-1 text-xs text-danger">Reject</button>
      <button onClick={() => review("EXPIRED")} disabled={!!loading} className="rounded-lg border border-warning/30 px-3 py-1 text-xs text-warning">Mark expired</button>
    </div>
  );
}

export function ReevaluateVendorButton({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function reevaluate() {
    setLoading(true);
    await fetch(`/api/vendors/${vendorId}/reevaluate`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button onClick={reevaluate} disabled={loading} className="rounded-xl border border-border bg-background px-4 py-3 text-left text-sm disabled:opacity-60">
      {loading ? "Re-evaluating..." : "Re-evaluate eligibility"}
    </button>
  );
}
