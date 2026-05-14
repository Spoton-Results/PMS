type ProofItem = {
  id: string;
  fileUrl?: string | null;
  fileKey?: string | null;
  textValue?: string | null;
  checkboxValue?: boolean | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
  submittedAt: Date;
  proofRequirement?: {
    label: string;
    type: string;
    required: boolean;
  };
};

function isImage(url?: string | null) {
  if (!url) return false;
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
}

function isVideo(url?: string | null) {
  if (!url) return false;
  return /\.(mp4|webm|mov)$/i.test(url);
}

export function ProofGallery({ submissions }: { submissions: ProofItem[] }) {
  if (submissions.length === 0) {
    return <p className="text-sm text-muted">No proof submitted yet.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {submissions.map((submission) => (
        <div key={submission.id} className="overflow-hidden rounded-2xl border border-border bg-background">
          {isImage(submission.fileUrl) ? (
            <img src={submission.fileUrl || ""} alt={submission.proofRequirement?.label || "Proof image"} className="h-56 w-full object-cover" />
          ) : isVideo(submission.fileUrl) ? (
            <video src={submission.fileUrl || ""} controls className="h-56 w-full bg-black object-cover" />
          ) : submission.fileUrl ? (
            <div className="flex h-56 items-center justify-center bg-card p-6 text-center text-sm text-muted">
              <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="underline">Open uploaded file</a>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center bg-card p-6 text-center text-sm text-muted">
              Structured proof submitted
            </div>
          )}

          <div className="p-4 text-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{submission.proofRequirement?.label || "Proof item"}</p>
                <p className="mt-1 text-xs text-muted">
                  {submission.proofRequirement?.type || "UNKNOWN"} · {submission.proofRequirement?.required ? "Required" : "Optional"}
                </p>
              </div>
              <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success ring-1 ring-success/30">Submitted</span>
            </div>

            {submission.textValue ? <p className="mt-3 rounded-xl border border-border bg-card p-3 text-muted">{submission.textValue}</p> : null}
            {typeof submission.checkboxValue === "boolean" ? <p className="mt-3 text-muted">Checkbox: {submission.checkboxValue ? "Yes" : "No"}</p> : null}
            {submission.gpsLat && submission.gpsLng ? <p className="mt-3 text-muted">GPS: {submission.gpsLat}, {submission.gpsLng}</p> : null}
            {submission.fileKey ? <p className="mt-3 break-all text-xs text-muted">Key: {submission.fileKey}</p> : null}
            <p className="mt-3 text-xs text-muted">Submitted: {submission.submittedAt.toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
