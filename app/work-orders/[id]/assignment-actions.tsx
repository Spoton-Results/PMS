"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type VendorOption = {
  id: string;
  legalName: string;
  eligibilityStatus: string;
  primaryTrade?: string | null;
};

export function AssignVendorForm({ workOrderId, vendors }: { workOrderId: string; vendors: VendorOption[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      vendorId: String(formData.get("vendorId") || ""),
      allowYellowWithOverride: formData.get("allowYellowWithOverride") === "on",
      overrideReason: String(formData.get("overrideReason") || "") || undefined
    };

    const response = await fetch(`/api/work-orders/${workOrderId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.reason || result?.error || "Assignment blocked.");
      setSaving(false);
      return;
    }

    setMessage("Vendor assigned successfully.");
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-xl font-semibold">Assign vendor</h2>
      <div className="mt-4 grid gap-4">
        <label className="grid gap-2 text-sm">
          Vendor
          <select required name="vendorId" className="rounded-xl border border-border bg-background px-4 py-3 outline-none">
            <option value="">Select vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.legalName} — {vendor.eligibilityStatus} — {vendor.primaryTrade || "No trade"}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3 text-sm text-muted">
          <input name="allowYellowWithOverride" type="checkbox" />
          Allow yellow vendor with manager override
        </label>

        <label className="grid gap-2 text-sm">
          Override reason
          <input name="overrideReason" className="rounded-xl border border-border bg-background px-4 py-3 outline-none" placeholder="Emergency job, approved by regional manager" />
        </label>

        {error ? <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}
        {message ? <p className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{message}</p> : null}

        <button disabled={saving} className="rounded-xl bg-white px-5 py-3 font-semibold text-background disabled:opacity-60">
          {saving ? "Assigning..." : "Assign vendor"}
        </button>
      </div>
    </form>
  );
}
