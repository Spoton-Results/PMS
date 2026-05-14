import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { evaluateProofCompletion } from "@/lib/rules";

const uploadedProofSchema = z.object({
  uploadAssetId: z.string().min(1),
  proofRequirementId: z.string().min(1),
  vendorId: z.string().min(1),
  textValue: z.string().optional(),
  checkboxValue: z.boolean().optional(),
  gpsLat: z.number().optional(),
  gpsLng: z.number().optional()
});

async function evaluateWorkOrderProof(workOrderId: string) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: { proofSubmissions: true }
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

  await prisma.workOrder.update({
    where: { id: workOrderId },
    data: { status: result.complete ? "AWAITING_APPROVAL" : "AWAITING_PROOF" }
  });

  return result;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const workOrder = await prisma.workOrder.findUnique({
    where: { id: params.id }
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = uploadedProofSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid uploaded proof payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const uploadAsset = await prisma.uploadAsset.findUnique({
    where: { id: parsed.data.uploadAssetId }
  });

  if (!uploadAsset) {
    return NextResponse.json({ error: "Upload asset not found" }, { status: 404 });
  }

  const proofSubmission = await prisma.proofSubmission.create({
    data: {
      workOrderId: workOrder.id,
      proofRequirementId: parsed.data.proofRequirementId,
      vendorId: parsed.data.vendorId,
      fileUrl: uploadAsset.fileUrl,
      fileKey: uploadAsset.storageKey,
      textValue: parsed.data.textValue,
      checkboxValue: parsed.data.checkboxValue,
      gpsLat: parsed.data.gpsLat,
      gpsLng: parsed.data.gpsLng
    }
  });

  const proofResult = await evaluateWorkOrderProof(workOrder.id);

  await prisma.auditEvent.create({
    data: {
      organizationId: workOrder.organizationId,
      actorType: "SYSTEM",
      entityType: "ProofSubmission",
      entityId: proofSubmission.id,
      action: "PROOF_CREATED_FROM_UPLOAD",
      afterJson: {
        uploadAssetId: uploadAsset.id,
        proofRequirementId: parsed.data.proofRequirementId,
        fileUrl: uploadAsset.fileUrl,
        proofResult
      }
    }
  });

  return NextResponse.json({ proofSubmission, proofResult }, { status: 201 });
}
