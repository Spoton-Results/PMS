import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const createVendorSchema = z.object({
  organizationId: z.string().min(1),
  legalName: z.string().min(2),
  dbaName: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  businessType: z.string().optional(),
  primaryTrade: z.string().optional(),
  serviceRegions: z.array(z.string()).optional(),
  serviceCategories: z.array(z.string()).optional()
});

export async function GET() {
  const vendors = await prisma.vendor.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      documents: true,
      workOrders: true,
      payouts: true
    }
  });

  return NextResponse.json({ vendors });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createVendorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid vendor payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const vendor = await prisma.vendor.create({
    data: {
      organizationId: parsed.data.organizationId,
      legalName: parsed.data.legalName,
      dbaName: parsed.data.dbaName,
      contactName: parsed.data.contactName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      businessType: parsed.data.businessType,
      primaryTrade: parsed.data.primaryTrade,
      serviceRegions: parsed.data.serviceRegions ?? [],
      serviceCategories: parsed.data.serviceCategories ?? [],
      eligibilityStatus: "RED",
      eligibilityReason: "Vendor has not completed compliance review."
    }
  });

  return NextResponse.json({ vendor }, { status: 201 });
}
