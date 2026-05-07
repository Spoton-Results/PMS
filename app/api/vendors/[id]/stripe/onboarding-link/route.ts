import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAppUrl, getStripe } from "@/lib/stripe";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const vendor = await prisma.vendor.findUnique({ where: { id: params.id } });

  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  if (!vendor.stripeConnectAccountId) {
    return NextResponse.json({ error: "Vendor does not have a Stripe Connect account yet" }, { status: 409 });
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  const accountLink = await stripe.accountLinks.create({
    account: vendor.stripeConnectAccountId,
    refresh_url: `${appUrl}/vendors/${vendor.id}`,
    return_url: `${appUrl}/vendors/${vendor.id}`,
    type: "account_onboarding"
  });

  await prisma.auditEvent.create({
    data: {
      organizationId: vendor.organizationId,
      actorType: "SYSTEM",
      entityType: "Vendor",
      entityId: vendor.id,
      action: "STRIPE_ONBOARDING_LINK_CREATED",
      afterJson: {
        stripeConnectAccountId: vendor.stripeConnectAccountId
      }
    }
  });

  return NextResponse.json({
    onboardingUrl: accountLink.url,
    expiresAt: accountLink.expires_at
  });
}
