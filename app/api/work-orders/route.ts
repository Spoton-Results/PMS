import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const createWorkOrderSchema = z.object({
  organizationId: z.string().min(1),
  propertyId: z.string().min(1),
  unitId: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  jobCategory: z.string().min(1),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "EMERGENCY"]).default("NORMAL"),
  nteAmount: z.number().int().optional(),
  approvedEstimateAmount: z.number().int().optional(),
  dueDate: z.string().optional(),
  slaDeadline: z.string().optional()
});

export async function GET() {
  const workOrders = await prisma.workOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      property: true,
      vendor: true,
      invoice: true,
      payout: true,
      proofSubmissions: true
    }
  });

  return NextResponse.json({ workOrders });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createWorkOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid work order payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const property = await prisma.property.findUnique({ where: { id: parsed.data.propertyId } });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const workOrder = await prisma.workOrder.create({
    data: {
      organizationId: parsed.data.organizationId,
      propertyId: parsed.data.propertyId,
      unitId: parsed.data.unitId,
      title: parsed.data.title,
      description: parsed.data.description,
      jobCategory: parsed.data.jobCategory,
      priority: parsed.data.priority,
      status: "UNASSIGNED",
      nteAmount: parsed.data.nteAmount,
      approvedEstimateAmount: parsed.data.approvedEstimateAmount,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      slaDeadline: parsed.data.slaDeadline ? new Date(parsed.data.slaDeadline) : null
    },
    include: {
      property: true,
      vendor: true
    }
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: parsed.data.organizationId,
      actorType: "SYSTEM",
      entityType: "WorkOrder",
      entityId: workOrder.id,
      action: "WORK_ORDER_CREATED",
      afterJson: workOrder
    }
  });

  return NextResponse.json({ workOrder }, { status: 201 });
}
