import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const vendor = await prisma.vendor.findUnique({ where: { id: params.id } });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  if (vendor.stripeConnectAccountId) {
    return NextResponse.json({
      vendor,
      stripeConnectAccountId: vendor.stripeConnectAccountId,
      reused: true
    });
  }

  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: vendor.email,
    business_type: "company",
    capabilities: {
      transfers: { requested: true }
    },
    metadata: {
      vendorId: vendor.id,
      organizationId: vendor.organizationId
    }
  });

  const updatedVendor = await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      stripeConnectAccountId: account.id,
      stripeOnboardingStatus: "PENDING",
      payoutStatus: "NOT_READY",
      eligibilityStatus: vendor.eligibilityStatus === "GREEN" ? "YELLOW" : vendor.eligibilityStatus,
      eligibilityReason: vendor.eligibilityStatus === "GREEN"
        ? "Stripe onboarding pending; payout account is not ready."
        : vendor.eligibilityReason
    }
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: vendor.organizationId,
      actorType: "SYSTEM",
      entityType: "Vendor",
      entityId: vendor.id,
      action: "STRIPE_CONNECT_ACCOUNT_CREATED",
      afterJson: {
        stripeConnectAccountId: account.id,
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        detailsSubmitted: account.details_submitted
      }
    }
  });

  return NextResponse.json({
    vendor: updatedVendor,
    stripeConnectAccountId: account.id,
    reused: false
  }, { status: 201 });
}
