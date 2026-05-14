import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const reviewProofSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_REWORK"]),
  reviewedBy: z.string().optional(),
  note: z.string().optional()
});

function mapActionToStatus(action: "APPROVE" | "REJECT" | "REQUEST_REWORK") {
  if (action === "APPROVE") return "APPROVED";
  if (action === "REJECT") return "REJECTED";
  return "REWORK_REQUESTED";
}

function mapActionToApprovalStatus(action: "APPROVE" | "REJECT" | "REQUEST_REWORK") {
  if (action === "APPROVE") return "APPROVED";
  if (action === "REJECT") return "REJECTED";
  return "REWORK_REQUESTED";
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = reviewProofSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid proof review payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const proofSubmission = await prisma.proofSubmission.findUnique({
    where: { id: params.id },
    include: {
      workOrder: true,
      proofRequirement: true
    }
  });

  if (!proofSubmission) {
    return NextResponse.json({ error: "Proof submission not found" }, { status: 404 });
  }

  const reviewStatus = mapActionToStatus(parsed.data.action);
  const approvalStatus = mapActionToApprovalStatus(parsed.data.action);

  const updatedProofSubmission = await prisma.proofSubmission.update({
    where: { id: proofSubmission.id },
    data: {
      reviewStatus,
      reviewedBy: parsed.data.reviewedBy || "MVP Admin",
      reviewedAt: new Date(),
      reviewNote: parsed.data.note
    },
    include: {
      proofRequirement: true
    }
  });

  const approval = await prisma.approval.create({
    data: {
      organizationId: proofSubmission.workOrder.organizationId,
      workOrderId: proofSubmission.workOrderId,
      entityType: "PROOF_SUBMISSION",
      entityId: proofSubmission.id,
      type: parsed.data.action === "REQUEST_REWORK" ? "REWORK" : "PROOF_REVIEW",
      status: approvalStatus,
      requestedBy: "SYSTEM",
      decidedBy: parsed.data.reviewedBy || "MVP Admin",
      decidedAt: new Date(),
      decisionNote: parsed.data.note,
      metadata: {
        proofRequirementId: proofSubmission.proofRequirementId,
        proofRequirementLabel: proofSubmission.proofRequirement.label,
        action: parsed.data.action
      }
    }
  });

  if (parsed.data.action === "REQUEST_REWORK") {
    await prisma.workOrder.update({
      where: { id: proofSubmission.workOrderId },
      data: { status: "REWORK_REQUESTED" }
    });
  } else if (parsed.data.action === "REJECT") {
    await prisma.workOrder.update({
      where: { id: proofSubmission.workOrderId },
      data: { status: "AWAITING_PROOF" }
    });
  } else {
    const allSubmissions = await prisma.proofSubmission.findMany({
      where: { workOrderId: proofSubmission.workOrderId }
    });

    const hasBlockingReview = allSubmissions.some((submission) =>
      ["REJECTED", "REWORK_REQUESTED"].includes(submission.reviewStatus)
    );

    if (!hasBlockingReview) {
      await prisma.workOrder.update({
        where: { id: proofSubmission.workOrderId },
        data: { status: "AWAITING_APPROVAL" }
      });
    }
  }

  await prisma.auditEvent.create({
    data: {
      organizationId: proofSubmission.workOrder.organizationId,
      actorType: "SYSTEM",
      entityType: "ProofSubmission",
      entityId: proofSubmission.id,
      action: `PROOF_${approvalStatus}`,
      afterJson: {
        proofSubmission: updatedProofSubmission,
        approval
      }
    }
  });

  return NextResponse.json({ proofSubmission: updatedProofSubmission, approval });
}
