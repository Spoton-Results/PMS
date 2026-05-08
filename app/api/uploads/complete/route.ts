import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const completeUploadSchema = z.object({
  organizationId: z.string().min(1),
  vendorId: z.string().optional(),
  workOrderId: z.string().optional(),
  invoiceId: z.string().optional(),
  purpose: z.enum(["VENDOR_DOCUMENT", "PROOF_MEDIA", "INVOICE_ATTACHMENT"]),
  storageKey: z.string().min(1),
  fileUrl: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().optional(),
  createdBy: z.string().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = completeUploadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid completed upload payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const uploadAsset = await prisma.uploadAsset.create({
    data: {
      organizationId: parsed.data.organizationId,
      vendorId: parsed.data.vendorId,
      workOrderId: parsed.data.workOrderId,
      invoiceId: parsed.data.invoiceId,
      purpose: parsed.data.purpose,
      storageKey: parsed.data.storageKey,
      fileUrl: parsed.data.fileUrl,
      filename: parsed.data.filename,
      contentType: parsed.data.contentType,
      sizeBytes: parsed.data.sizeBytes,
      createdBy: parsed.data.createdBy || "MVP Admin"
    }
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: parsed.data.organizationId,
      actorType: "SYSTEM",
      entityType: "UploadAsset",
      entityId: uploadAsset.id,
      action: "UPLOAD_ASSET_CREATED",
      afterJson: uploadAsset
    }
  });

  return NextResponse.json({ uploadAsset }, { status: 201 });
}
