import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const attachProofTemplateSchema = z.object({
  proofTemplateId: z.string().min(1)
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = attachProofTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid proof template payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const proofTemplate = await prisma.proofTemplate.findUnique({
    where: { id: parsed.data.proofTemplateId }
  });

  if (!proofTemplate) {
    return NextResponse.json({ error: "Proof template not found" }, { status: 404 });
  }

  const workOrder = await prisma.workOrder.update({
    where: { id: params.id },
    data: {
      proofTemplateId: parsed.data.proofTemplateId,
      status: "AWAITING_PROOF"
    },
    include: {
      property: true,
      vendor: true
    }
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: workOrder.organizationId,
      actorType: "SYSTEM",
      entityType: "WorkOrder",
      entityId: workOrder.id,
      action: "PROOF_TEMPLATE_ATTACHED",
      afterJson: {
        proofTemplateId: parsed.data.proofTemplateId
      }
    }
  });

  return NextResponse.json({ workOrder });
}
