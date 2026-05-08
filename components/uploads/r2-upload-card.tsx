"use client";

import { useState } from "react";

export function R2UploadCard({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  const [filename, setFilename] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Idle");

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setFilename(file.name);
    setStatus("Preparing upload...");

    try {
      setTimeout(() => {
        setStatus("Ready for R2 upload flow");
      }, 800);
    } catch {
      setStatus("Upload failed");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>

      <label className="mt-4 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-border bg-background px-4 py-8 text-sm text-muted hover:border-foreground">
        <input type="file" className="hidden" onChange={handleFile} />
        Upload file
      </label>

      <div className="mt-4 rounded-xl border border-border bg-background p-3 text-sm">
        <p>Status: {status}</p>
        <p className="mt-1 text-muted break-all">
          {filename || "No file selected"}
        </p>
      </div>
    </div>
  );
}
