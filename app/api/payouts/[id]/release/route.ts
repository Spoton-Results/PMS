import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const releasePayoutSchema = z.object({
  releasedBy: z.string().optional()
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  const parsed = releasePayoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payout release payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payout = await prisma.payout.findUnique({
    where: { id: params.id },
    include: { workOrder: true }
  });

  if (!payout) {
    return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  }

  if (payout.status !== "READY") {
    return NextResponse.json(
      { error: "Payout is not ready for release", holdReason: payout.holdReason },
      { status: 409 }
    );
  }

  const releasedPayout = await prisma.payout.update({
    where: { id: payout.id },
    data: {
      status: "RELEASED",
      releasedBy: parsed.data.releasedBy || "MVP Admin",
      releasedAt: new Date()
    }
  });

  await prisma.workOrder.update({
    where: { id: payout.workOrderId },
    data: { status: "PAID" }
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: payout.workOrder.organizationId,
      actorType: "SYSTEM",
      entityType: "Payout",
      entityId: payout.id,
      action: "PAYOUT_RELEASED_MANUALLY",
      afterJson: releasedPayout
    }
  });

  return NextResponse.json({ payout: releasedPayout });
}
