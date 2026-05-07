import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { canAssignVendorToWorkOrder } from "@/lib/rules";

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

  const vendor = await prisma.vendor.findUnique({ where: { id: parsed.data.vendorId } });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const decision = canAssignVendorToWorkOrder(
    {
      eligibilityStatus: vendor.eligibilityStatus,
      eligibilityReason: vendor.eligibilityReason,
      primaryTrade: vendor.primaryTrade,
      serviceRegions: vendor.serviceRegions
    },
    {
      jobCategory: workOrder.jobCategory,
      city: workOrder.property.city,
      state: workOrder.property.state,
      emergency: workOrder.priority === "EMERGENCY"
    },
    { allowYellowWithOverride: parsed.data.allowYellowWithOverride }
  );

  if (!decision.allowed) {
    await prisma.auditEvent.create({
      data: {
        organizationId: workOrder.organizationId,
        actorType: "SYSTEM",
        entityType: "WorkOrder",
        entityId: workOrder.id,
        action: "WORK_ORDER_ASSIGNMENT_BLOCKED",
        afterJson: {
          vendorId: vendor.id,
          reason: decision.reason,
          requiresOverride: decision.requiresOverride
        }
      }
    });

    return NextResponse.json(
      {
        error: "Assignment blocked",
        reason: decision.reason,
        requiresOverride: decision.requiresOverride
      },
      { status: 409 }
    );
  }

  const updatedWorkOrder = await prisma.workOrder.update({
    where: { id: workOrder.id },
    data: {
      vendorId: vendor.id,
      status: "ASSIGNED"
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
      action: parsed.data.allowYellowWithOverride ? "WORK_ORDER_ASSIGNED_WITH_OVERRIDE" : "WORK_ORDER_ASSIGNED",
      afterJson: {
        vendorId: vendor.id,
        decision,
        overrideReason: parsed.data.overrideReason
      }
    }
  });

  return NextResponse.json({ workOrder: updatedWorkOrder, decision });
}
