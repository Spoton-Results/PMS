import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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

  await prisma.property.upsert({
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

  await prisma.vendor.upsert({
    where: { id: "seed-vendor-green" },
    update: {},
    create: {
      id: "seed-vendor-green",
      organizationId: organization.id,
      legalName: "Summit Plumbing LLC",
      dbaName: "Summit Plumbing",
      contactName: "Alex Rivera",
      email: "alex@summitplumbing.example",
      phone: "555-100-2000",
      primaryTrade: "Plumbing",
      serviceRegions: ["UT"],
      serviceCategories: ["Plumbing", "Emergency Repair"],
      eligibilityStatus: "GREEN",
      eligibilityReason: "Vendor is eligible for assignment, invoicing, and payout.",
      stripeOnboardingStatus: "COMPLETE",
      payoutStatus: "READY"
    }
  });

  await prisma.vendor.upsert({
    where: { id: "seed-vendor-red" },
    update: {},
    create: {
      id: "seed-vendor-red",
      organizationId: organization.id,
      legalName: "Desert Turn Services LLC",
      dbaName: "Desert Turn Services",
      contactName: "Maria Chen",
      email: "maria@desertturn.example",
      phone: "555-300-4000",
      primaryTrade: "Turn Cleaning",
      serviceRegions: ["UT"],
      serviceCategories: ["Turn Cleaning", "Trash Out"],
      eligibilityStatus: "RED",
      eligibilityReason: "Missing approved W-9; Stripe onboarding is incomplete.",
      stripeOnboardingStatus: "PENDING",
      payoutStatus: "NOT_READY"
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
