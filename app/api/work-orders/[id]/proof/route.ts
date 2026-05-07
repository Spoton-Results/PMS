import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { evaluateProofCompletion } from "@/lib/rules";

const proofSubmissionSchema = z.object({
  proofRequirementId: z.string().min(1),
  vendorId: z.string().min(1),
  fileUrl: z.string().optional(),
  textValue: z.string().optional(),
  checkboxValue: z.boolean().optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional()
});

async function evaluateWorkOrderProof(workOrderId: string) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      proofSubmissions: true
    }
  });

  if (!workOrder?.proofTemplateId) {
    return { complete: false, missing: ["No proof template attached"] };
  }

  const proofTemplate = await prisma.proofTemplate.findUnique({
    where: { id: workOrder.proofTemplateId },
    include: { requirements: true }
  });

  if (!proofTemplate) {
    return { complete: false, missing: ["Proof template not found"] };
  }

  const result = evaluateProofCompletion(
    proofTemplate.requirements.map((requirement) => ({
      id: requirement.id,
      label: requirement.label,
      required: requirement.required
    })),
    workOrder.proofSubmissions.map((submission) => ({
      proofRequirementId: submission.proofRequirementId
    }))
  );

  if (result.complete) {
    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { status: "AWAITING_APPROVAL" }
    });
  } else {
    await prisma.workOrder.update({
      where: { id: workOrderId },
      data: { status: "AWAITING_PROOF" }
    });
  }

  return result;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: {
      proofSubmissions: true
    }
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  let proofTemplate = null;
  if (workOrder.proofTemplateId) {
    proofTemplate = await prisma.proofTemplate.findUnique({
      where: { id: workOrder.proofTemplateId },
      include: { requirements: { orderBy: { sortOrder: "asc" } } }
    });
  }

  const result = await evaluateWorkOrderProof(params.id);

  return NextResponse.json({
    proofTemplate,
    submissions: workOrder.proofSubmissions,
    result
  });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = proofSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid proof submission payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const workOrder = await prisma.workOrder.findUnique({ where: { id: params.id } });

  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  const submission = await prisma.proofSubmission.create({
    data: {
      workOrderId: params.id,
      proofRequirementId: parsed.data.proofRequirementId,
      vendorId: parsed.data.vendorId,
      fileUrl: parsed.data.fileUrl,
      textValue: parsed.data.textValue,
      checkboxValue: parsed.data.checkboxValue,
      gpsLat: parsed.data.gpsLat,
      gpsLng: parsed.data.gpsLng
    }
  });

  const result = await evaluateWorkOrderProof(params.id);

  await prisma.auditEvent.create({
    data: {
      organizationId: workOrder.organizationId,
      actorType: "SYSTEM",
      entityType: "ProofSubmission",
      entityId: submission.id,
      action: "PROOF_SUBMITTED",
      afterJson: { submission, proofResult: result }
    }
  });

  return NextResponse.json({ submission, result }, { status: 201 });
}
