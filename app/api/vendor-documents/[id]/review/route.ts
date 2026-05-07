import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { evaluateVendorEligibility } from "@/lib/rules";

const reviewDocumentSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "EXPIRED"]),
  reviewedBy: z.string().optional(),
  rejectionReason: z.string().optional()
});

async function reevaluateVendor(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: { documents: true }
  });

  if (!vendor) return null;

  const result = evaluateVendorEligibility(
    vendor.documents.map((doc) => ({
      documentType: doc.documentType,
      status: doc.status,
      expirationDate: doc.expirationDate
    })),
    {
      payoutsEnabled: vendor.payoutStatus === "READY",
      detailsSubmitted: vendor.stripeOnboardingStatus === "COMPLETE",
      requirementsPastDue: []
    }
  );

  return prisma.vendor.update({
    where: { id: vendorId },
    data: {
      eligibilityStatus: result.status,
      eligibilityReason: result.reason
    }
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = reviewDocumentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid review payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.vendorDocument.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const document = await prisma.vendorDocument.update({
    where: { id: params.id },
    data: {
      status: parsed.data.status,
      reviewedBy: parsed.data.reviewedBy,
      reviewedAt: new Date(),
      rejectionReason: parsed.data.rejectionReason
    }
  });

  const vendor = await reevaluateVendor(document.vendorId);

  await prisma.auditEvent.create({
    data: {
      organizationId: vendor?.organizationId ?? "unknown",
      actorType: "SYSTEM",
      entityType: "VendorDocument",
      entityId: document.id,
      action: `DOCUMENT_${parsed.data.status}`,
      afterJson: document
    }
  });

  return NextResponse.json({ document, vendor });
}
