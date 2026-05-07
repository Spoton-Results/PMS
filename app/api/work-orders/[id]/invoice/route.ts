import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const submitInvoiceSchema = z.object({
  vendorId: z.string().min(1),
  invoiceNumber: z.string().optional(),
  invoiceAmount: z.number().int().positive(),
  laborAmount: z.number().int().optional(),
  materialsAmount: z.number().int().optional()
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = submitInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid invoice payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: params.id },
    include: { vendor: true, proofSubmissions: true }
  });

  if (!workOrder) {
    return NextResponse.json({ error: "Work order not found" }, { status: 404 });
  }

  if (!workOrder.vendorId) {
    return NextResponse.json({ error: "Cannot submit invoice before assigning a vendor" }, { status: 409 });
  }

  if (workOrder.vendorId !== parsed.data.vendorId) {
    return NextResponse.json({ error: "Invoice vendor does not match assigned vendor" }, { status: 409 });
  }

  if (workOrder.status !== "AWAITING_APPROVAL" && workOrder.status !== "APPROVED" && workOrder.status !== "INVOICE_SUBMITTED") {
    return NextResponse.json(
      { error: "Invoice blocked until required proof is complete and work is awaiting approval" },
      { status: 409 }
    );
  }

  const approvedLimit = workOrder.approvedEstimateAmount ?? workOrder.nteAmount;
  const invoiceStatus = approvedLimit && parsed.data.invoiceAmount > approvedLimit ? "OVER_NTE" : "SUBMITTED";

  const invoice = await prisma.invoice.upsert({
    where: { workOrderId: workOrder.id },
    update: {
      invoiceNumber: parsed.data.invoiceNumber,
      invoiceAmount: parsed.data.invoiceAmount,
      laborAmount: parsed.data.laborAmount,
      materialsAmount: parsed.data.materialsAmount,
      status: invoiceStatus
    },
    create: {
      workOrderId: workOrder.id,
      vendorId: parsed.data.vendorId,
      invoiceNumber: parsed.data.invoiceNumber,
      invoiceAmount: parsed.data.invoiceAmount,
      laborAmount: parsed.data.laborAmount,
      materialsAmount: parsed.data.materialsAmount,
      status: invoiceStatus
    }
  });

  const updatedWorkOrder = await prisma.workOrder.update({
    where: { id: workOrder.id },
    data: { status: "INVOICE_SUBMITTED" },
    include: { property: true, vendor: true, invoice: true }
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: workOrder.organizationId,
      actorType: "SYSTEM",
      entityType: "Invoice",
      entityId: invoice.id,
      action: "INVOICE_SUBMITTED",
      afterJson: { invoice, workOrderStatus: updatedWorkOrder.status }
    }
  });

  return NextResponse.json({ invoice, workOrder: updatedWorkOrder }, { status: 201 });
}
