import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { evaluateAssignmentEligibility, matchBestRulebook } from "@/lib/rule-engine";

const assignVendorSchema = z.object({
  vendorId: z.string().min(1),
  allowYellowWithOverride: z.boolean().optional(),
  overrideReason: z.string().optional()
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = assignVendorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid assignment payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: { property: true }
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: parsed.data.vendorId },
    include: { documents: true }
  });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const rulebooks = await prisma.rulebook.findMany({
    where: {
      organizationId: workOrder.organizationId,
      active: true,
      OR: [
        { propertyId: workOrder.propertyId },
        { portfolioId: workOrder.property.portfolioId },
        { isDefault: true }
      ]
    }
  });

  const rulebook = matchBestRulebook(rulebooks, {
    property: workOrder.property,
    workOrder,
    trade: vendor.primaryTrade
  });

  const decision = evaluateAssignmentEligibility({
    vendor,
    property: workOrder.property,
    workOrder,
    rulebook,
    allowYellowOverride: parsed.data.allowYellowWithOverride
  });

  if (!decision.allowed) {
    await prisma.auditEvent.create({
      data: {
        organizationId: workOrder.organizationId,
        actorType: "SYSTEM",
        entityType: "WorkOrder",
        entityId: workOrder.id,
        action: "WORK_ORDER_ASSIGNMENT_BLOCKED_BY_RULE_ENGINE",
        afterJson: {
          vendorId: vendor.id,
          rulebookId: rulebook?.id,
          decision
        }
      }
    });

    return NextResponse.json(
      {
        error: "Assignment blocked by rule engine",
        decision,
        rulebook
      },
      { status: 409 }
    );
  }

  const updatedWorkOrder = await prisma.workOrder.update({
    where: { id: workOrder.id },
    data: {
      vendorId: vendor.id,
      status: "ASSIGNED",
      proofTemplateId: workOrder.proofTemplateId || rulebook?.requiredProofTemplateId || undefined
    },
    include: {
      property: true,
      vendor: true
    }
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: workOrder.organizationId,
      actorType: parsed.data.allowYellowWithOverride ? "OVERRIDE" : "SYSTEM",
      entityType: "WorkOrder",
      entityId: workOrder.id,
      action: parsed.data.allowYellowWithOverride ? "WORK_ORDER_ASSIGNED_WITH_RULE_OVERRIDE" : "WORK_ORDER_ASSIGNED_BY_RULE_ENGINE",
      afterJson: {
        vendorId: vendor.id,
        rulebookId: rulebook?.id,
        decision,
        overrideReason: parsed.data.overrideReason
      }
    }
  });

  return NextResponse.json({ workOrder: updatedWorkOrder, decision, rulebook });
}
