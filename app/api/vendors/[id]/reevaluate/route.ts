import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateVendorEligibility } from "@/lib/rules";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: { documents: true }
  });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

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

  const updatedVendor = await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      eligibilityStatus: result.status,
      eligibilityReason: result.reason
    },
    include: { documents: true }
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: vendor.organizationId,
      actorType: "SYSTEM",
      entityType: "Vendor",
      entityId: vendor.id,
      action: "VENDOR_ELIGIBILITY_REEVALUATED",
      afterJson: {
        status: result.status,
        reason: result.reason,
        issues: result.issues
      }
    }
  });

  return NextResponse.json({ vendor: updatedVendor, result });
}
