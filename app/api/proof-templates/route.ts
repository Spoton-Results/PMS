import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const proofRequirementSchema = z.object({
  type: z.enum(["PHOTO", "VIDEO", "CHECKBOX", "TEXT", "NUMBER", "SIGNATURE", "GPS", "FILE"]),
  label: z.string().min(2),
  required: z.boolean().default(true),
  sortOrder: z.number().int().default(0)
});

const createProofTemplateSchema = z.object({
  organizationId: z.string().min(1),
  jobCategory: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  requirements: z.array(proofRequirementSchema).min(1)
});

export async function GET() {
  const proofTemplates = await prisma.proofTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: { requirements: { orderBy: { sortOrder: "asc" } } }
  });

  return NextResponse.json({ proofTemplates });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createProofTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid proof template payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const proofTemplate = await prisma.proofTemplate.create({
    data: {
      organizationId: parsed.data.organizationId,
      jobCategory: parsed.data.jobCategory,
      name: parsed.data.name,
      description: parsed.data.description,
      requirements: {
        create: parsed.data.requirements.map((requirement, index) => ({
          type: requirement.type,
          label: requirement.label,
          required: requirement.required,
          sortOrder: requirement.sortOrder ?? index
        }))
      }
    },
    include: { requirements: { orderBy: { sortOrder: "asc" } } }
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: parsed.data.organizationId,
      actorType: "SYSTEM",
      entityType: "ProofTemplate",
      entityId: proofTemplate.id,
      action: "PROOF_TEMPLATE_CREATED",
      afterJson: proofTemplate
    }
  });

  return NextResponse.json({ proofTemplate }, { status: 201 });
}
