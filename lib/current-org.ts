import { prisma } from "@/lib/db";

export const DEFAULT_ORG_ID = "seed-org";

export async function getCurrentOrganization() {
  let organization = await prisma.organization.findUnique({
    where: { id: DEFAULT_ORG_ID }
  });

  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        id: DEFAULT_ORG_ID,
        name: "Demo Property Operator"
      }
    });
  }

  return organization;
}

export async function getCurrentOrganizationId() {
  const organization = await getCurrentOrganization();
  return organization.id;
}
