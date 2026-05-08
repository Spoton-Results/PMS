"use client";

export function UploadStatusCard({
  title,
  status
}: {
  title: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
        {status}
      </div>
    </div>
  );
}
