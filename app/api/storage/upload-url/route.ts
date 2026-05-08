import { NextResponse } from "next/server";
import { z } from "zod";
import { buildStorageKey, createPresignedUploadUrl, getPublicFileUrl } from "@/lib/r2";

const uploadRequestSchema = z.object({
  organizationId: z.string().min(1),
  entityId: z.string().min(1),
  purpose: z.enum(["vendor-document", "proof-media", "invoice-attachment"]),
  filename: z.string().min(1),
  contentType: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = uploadRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid upload request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const key = buildStorageKey(parsed.data);
  const uploadUrl = await createPresignedUploadUrl({
    key,
    contentType: parsed.data.contentType
  });

  return NextResponse.json({
    key,
    uploadUrl,
    fileUrl: getPublicFileUrl(key)
  });
}
