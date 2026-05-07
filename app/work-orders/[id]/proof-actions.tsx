"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ProofTemplateOption = {
  id: string;
  name: string;
  jobCategory: string;
};

type ProofRequirement = {
  id: string;
  type: string;
  label: string;
  required: boolean;
};

type ProofSubmission = {
  proofRequirementId: string;
};

export function AttachProofTemplateForm({
  workOrderId,
  proofTemplates
}: {
  workOrderId: string;
  proofTemplates: ProofTemplateOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const proofTemplateId = String(formData.get("proofTemplateId") || "");

    const response = await fetch(`/api/work-orders/${workOrderId}/proof-template`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proofTemplateId })
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || "Could not attach proof template.");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-background p-4">
      <label className="grid gap-2 text-sm">
        Proof template
        <select required name="proofTemplateId" className="rounded-xl border border-border bg-card px-4 py-3 outline-none">
          <option value="">Select proof template</option>
          {proofTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} — {template.jobCategory}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <button disabled={saving} className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-background disabled:opacity-60">
        {saving ? "Attaching..." : "Attach proof template"}
      </button>
    </form>
  );
}

export function ProofSubmissionPanel({
  workOrderId,
  vendorId,
  requirements,
  submissions
}: {
  workOrderId: string;
  vendorId?: string | null;
  requirements: ProofRequirement[];
  submissions: ProofSubmission[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitProof(requirement: ProofRequirement) {
    if (!vendorId) {
      setError("Assign a vendor before submitting proof.");
      return;
    }

    setLoadingId(requirement.id);
    setError(null);

    const payload = {
      proofRequirementId: requirement.id,
      vendorId,
      fileUrl: requirement.type === "PHOTO" || requirement.type === "FILE" || requirement.type === "VIDEO" ? "manual-proof-record" : undefined,
      textValue: requirement.type === "TEXT" ? `Completed: ${requirement.label}` : undefined,
      checkboxValue: requirement.type === "CHECKBOX" ? true : undefined,
      gpsLat: requirement.type === "GPS" ? 37.0965 : undefined,
      gpsLng: requirement.type === "GPS" ? -113.5684 : undefined
    };

    const response = await fetch(`/api/work-orders/${workOrderId}/proof`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || "Could not submit proof.");
      setLoadingId(null);
      return;
    }

    setLoadingId(null);
    router.refresh();
  }

  const submittedIds = new Set(submissions.map((submission) => submission.proofRequirementId));

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}
      {requirements.map((requirement) => {
        const submitted = submittedIds.has(requirement.id);
        return (
          <div key={requirement.id} className="rounded-xl border border-border bg-background p-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{requirement.label}</p>
                <p className="mt-1 text-xs text-muted">{requirement.type}{requirement.required ? " · Required" : " · Optional"}</p>
              </div>
              <span className={submitted ? "text-success" : "text-warning"}>{submitted ? "Submitted" : "Missing"}</span>
            </div>
            {!submitted ? (
              <button onClick={() => submitProof(requirement)} disabled={loadingId === requirement.id} className="mt-3 rounded-lg border border-border px-3 py-2 text-xs disabled:opacity-60">
                {loadingId === requirement.id ? "Submitting..." : "Submit proof record"}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
