import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const uploadedDocumentSchema = z.object({
  uploadAssetId: z.string().min(1),
  documentType: z.enum([
    "W9",
    "GENERAL_LIABILITY",
    "WORKERS_COMP",
    "BUSINESS_LICENSE",
    "TRADE_LICENSE",
    "COI",
    "OTHER"
  ]),
  expirationDate: z.string().optional(),
  coverageAmount: z.number().int().optional()
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id }
  });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = uploadedDocumentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid uploaded document payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const uploadAsset = await prisma.uploadAsset.findUnique({
    where: { id: parsed.data.uploadAssetId }
  });

  if (!uploadAsset) {
    return NextResponse.json({ error: "Upload asset not found" }, { status: 404 });
  }

  const document = await prisma.vendorDocument.create({
    data: {
      vendorId: vendor.id,
      documentType: parsed.data.documentType,
      fileUrl: uploadAsset.fileUrl,
      fileKey: uploadAsset.storageKey,
      expirationDate: parsed.data.expirationDate
        ? new Date(parsed.data.expirationDate)
        : undefined,
      coverageAmount: parsed.data.coverageAmount
    }
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: vendor.organizationId,
      actorType: "SYSTEM",
      entityType: "VendorDocument",
      entityId: document.id,
      action: "DOCUMENT_CREATED_FROM_UPLOAD",
      afterJson: {
        uploadAssetId: uploadAsset.id,
        documentType: document.documentType,
        fileUrl: document.fileUrl
      }
    }
  });

  return NextResponse.json({ document }, { status: 201 });
}
