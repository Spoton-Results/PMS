import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  const organization = await prisma.organization.upsert({
    where: { id: "seed-org" },
    update: {},
    create: {
      id: "seed-org",
      name: "Demo Property Operator"
    }
  });

  const portfolio = await prisma.portfolio.upsert({
    where: { id: "seed-portfolio" },
    update: {},
    create: {
      id: "seed-portfolio",
      organizationId: organization.id,
      name: "Demo Portfolio"
    }
  });

  const property = await prisma.property.upsert({
    where: { id: "seed-property" },
    update: {},
    create: {
      id: "seed-property",
      organizationId: organization.id,
      portfolioId: portfolio.id,
      name: "Cedar Ridge Apartments",
      address: "100 Main Street",
      city: "St. George",
      state: "UT",
      zip: "84770"
    }
  });

  return NextResponse.json({
    organization,
    portfolio,
    property
  });
}
