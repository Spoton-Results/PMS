import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = headers().get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing Stripe webhook configuration" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object as Stripe.Account;

      const vendor = await prisma.vendor.findFirst({
        where: {
          stripeConnectAccountId: account.id
        }
      });

      if (!vendor) {
        break;
      }

      const onboardingComplete = account.details_submitted && account.payouts_enabled;
      const restricted = !!account.requirements?.disabled_reason;

      await prisma.vendor.update({
        where: { id: vendor.id },
        data: {
          stripeOnboardingStatus: onboardingComplete
            ? "COMPLETE"
            : restricted
              ? "RESTRICTED"
              : "PENDING",
          payoutStatus: onboardingComplete
            ? "READY"
            : restricted
              ? "RESTRICTED"
              : "NOT_READY",
          eligibilityStatus: onboardingComplete
            ? vendor.eligibilityStatus === "RED"
              ? "YELLOW"
              : "GREEN"
            : vendor.eligibilityStatus === "GREEN"
              ? "YELLOW"
              : vendor.eligibilityStatus,
          eligibilityReason: onboardingComplete
            ? null
            : account.requirements?.disabled_reason || "Stripe onboarding incomplete"
        }
      });

      await prisma.auditEvent.create({
        data: {
          organizationId: vendor.organizationId,
          actorType: "SYSTEM",
          entityType: "Vendor",
          entityId: vendor.id,
          action: "STRIPE_ACCOUNT_UPDATED",
          afterJson: {
            payoutsEnabled: account.payouts_enabled,
            chargesEnabled: account.charges_enabled,
            detailsSubmitted: account.details_submitted,
            requirements: account.requirements
          }
        }
      });

      break;
    }
  }

  return NextResponse.json({ received: true });
}
