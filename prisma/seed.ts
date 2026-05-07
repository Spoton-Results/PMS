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

  const plumbingTemplate = await prisma.proofTemplate.upsert({
    where: { id: "seed-proof-plumbing" },
    update: {},
    create: {
      id: "seed-proof-plumbing",
      organizationId: organization.id,
      jobCategory: "Plumbing",
      name: "Plumbing Repair Proof Pack",
      description: "Required proof for plumbing repairs before invoice approval.",
      requirements: {
        create: [
          { type: "PHOTO", label: "Before photo", required: true, sortOrder: 1 },
          { type: "PHOTO", label: "After photo", required: true, sortOrder: 2 },
          { type: "TEXT", label: "Repair summary", required: true, sortOrder: 3 },
          { type: "CHECKBOX", label: "Leak tested and confirmed complete", required: true, sortOrder: 4 }
        ]
      }
    }
  });

  await prisma.proofTemplate.upsert({
    where: { id: "seed-proof-turn-clean" },
    update: {},
    create: {
      id: "seed-proof-turn-clean",
      organizationId: organization.id,
      jobCategory: "Turn Cleaning",
      name: "Turn Cleaning Proof Pack",
      description: "Required proof for unit turns and cleaning completion.",
      requirements: {
        create: [
          { type: "PHOTO", label: "Kitchen after photo", required: true, sortOrder: 1 },
          { type: "PHOTO", label: "Bathroom after photo", required: true, sortOrder: 2 },
          { type: "PHOTO", label: "Living area after photo", required: true, sortOrder: 3 },
          { type: "CHECKBOX", label: "Trash removed", required: true, sortOrder: 4 },
          { type: "TEXT", label: "Completion note", required: true, sortOrder: 5 }
        ]
      }
    }
  });

  await prisma.workOrder.upsert({
    where: { id: "seed-work-plumbing" },
    update: {},
    create: {
      id: "seed-work-plumbing",
      organizationId: organization.id,
      propertyId: "seed-property",
      vendorId: "seed-vendor-green",
      title: "Kitchen sink leak",
      description: "Repair leaking kitchen sink and submit required proof before invoice approval.",
      jobCategory: "Plumbing",
      priority: "HIGH",
      status: "AWAITING_PROOF",
      nteAmount: 500,
      approvedEstimateAmount: 450,
      proofTemplateId: plumbingTemplate.id
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
