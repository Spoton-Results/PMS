import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { evaluateVendorEligibility } from "@/lib/rules";

const createDocumentSchema = z.object({
  documentType: z.enum([
    "W9",
    "GENERAL_LIABILITY",
    "WORKERS_COMP",
    "BUSINESS_LICENSE",
    "TRADE_LICENSE",
    "COI",
    "OTHER"
  ]),
  fileUrl: z.string().min(1),
  expirationDate: z.string().optional(),
  coverageAmount: z.number().int().optional()
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
    },
    include: { documents: true }
  });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const documents = await prisma.vendorDocument.findMany({
    where: { vendorId: params.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ documents });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = createDocumentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid document payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: params.id } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const document = await prisma.vendorDocument.create({
    data: {
      vendorId: params.id,
      documentType: parsed.data.documentType,
      fileUrl: parsed.data.fileUrl,
      expirationDate: parsed.data.expirationDate ? new Date(parsed.data.expirationDate) : null,
      coverageAmount: parsed.data.coverageAmount,
      status: "PENDING"
    }
  });

  const updatedVendor = await reevaluateVendor(params.id);

  return NextResponse.json({ document, vendor: updatedVendor }, { status: 201 });
}
