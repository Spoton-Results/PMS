import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { evaluatePayoutReadiness } from "@/lib/rules";

const reviewInvoiceSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reviewedBy: z.string().optional(),
  rejectionReason: z.string().optional()
});

async function createOrUpdatePayout(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      vendor: true,
      workOrder: {
        include: {
          proofSubmissions: true
        }
      }
    }
  });

  if (!invoice) return null;

  const proofComplete = invoice.workOrder.status === "AWAITING_APPROVAL" || invoice.workOrder.status === "APPROVED" || invoice.workOrder.status === "INVOICE_SUBMITTED" || invoice.workOrder.status === "PAYOUT_READY";

  const readiness = evaluatePayoutReadiness({
    vendor: {
      eligibilityStatus: invoice.vendor.eligibilityStatus,
      stripeOnboardingStatus: invoice.vendor.stripeOnboardingStatus
    },
    invoice: {
      status: invoice.status,
      invoiceAmount: invoice.invoiceAmount
    },
    workOrder: {
      approvedEstimateAmount: invoice.workOrder.approvedEstimateAmount,
      nteAmount: invoice.workOrder.nteAmount
    },
    proofComplete
  });

  const platformFee = Math.round(invoice.invoiceAmount * 0.01);
  const netVendorAmount = invoice.invoiceAmount - platformFee;

  const payout = await prisma.payout.upsert({
    where: { invoiceId: invoice.id },
    update: {
      grossAmount: invoice.invoiceAmount,
      platformFee,
      netVendorAmount,
      status: readiness.ready ? "READY" : "ON_HOLD",
      holdReason: readiness.holdReason
    },
    create: {
      invoiceId: invoice.id,
      workOrderId: invoice.workOrderId,
      vendorId: invoice.vendorId,
      grossAmount: invoice.invoiceAmount,
      platformFee,
      netVendorAmount,
      status: readiness.ready ? "READY" : "ON_HOLD",
      holdReason: readiness.holdReason
    }
  });

  await prisma.workOrder.update({
    where: { id: invoice.workOrderId },
    data: { status: readiness.ready ? "PAYOUT_READY" : "PAYOUT_HOLD" }
  });

  return { payout, readiness };
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const parsed = reviewInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid invoice review payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { workOrder: true }
  });

  if (!existing) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (parsed.data.action === "REJECT") {
    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        rejectionReason: parsed.data.rejectionReason,
        approvedBy: parsed.data.reviewedBy,
        approvedAt: new Date()
      }
    });

    await prisma.workOrder.update({
      where: { id: existing.workOrderId },
      data: { status: "REJECTED" }
    });

    await prisma.auditEvent.create({
      data: {
        organizationId: existing.workOrder.organizationId,
        actorType: "SYSTEM",
        entityType: "Invoice",
        entityId: invoice.id,
        action: "INVOICE_REJECTED",
        afterJson: invoice
      }
    });

    return NextResponse.json({ invoice });
  }

  const invoice = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      status: "APPROVED",
      approvedAmount: existing.invoiceAmount,
      approvedBy: parsed.data.reviewedBy,
      approvedAt: new Date()
    }
  });

  const payoutResult = await createOrUpdatePayout(invoice.id);

  await prisma.auditEvent.create({
    data: {
      organizationId: existing.workOrder.organizationId,
      actorType: "SYSTEM",
      entityType: "Invoice",
      entityId: invoice.id,
      action: "INVOICE_APPROVED",
      afterJson: { invoice, payoutResult }
    }
  });

  return NextResponse.json({ invoice, payout: payoutResult?.payout, readiness: payoutResult?.readiness });
}
