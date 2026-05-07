export type VendorEligibilityStatus = "GREEN" | "YELLOW" | "RED";
export type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
export type DocumentType = "W9" | "GENERAL_LIABILITY" | "WORKERS_COMP" | "BUSINESS_LICENSE" | "TRADE_LICENSE" | "COI" | "OTHER";

export type VendorDocumentInput = {
  documentType: DocumentType;
  status: DocumentStatus;
  expirationDate?: Date | string | null;
};

export type StripeAccountInput = {
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsPastDue?: string[];
};

export function evaluateVendorEligibility(
  documents: VendorDocumentInput[],
  stripeAccount?: StripeAccountInput | null
): { status: VendorEligibilityStatus; reason: string; issues: string[] } {
  const issues: string[] = [];

  const hasApprovedW9 = documents.some(
    (doc) => doc.documentType === "W9" && doc.status === "APPROVED"
  );

  if (!hasApprovedW9) {
    issues.push("Missing approved W-9");
  }

  const expiredDocs = documents.filter((doc) => {
    if (!doc.expirationDate) return false;
    return new Date(doc.expirationDate) < new Date();
  });

  if (expiredDocs.length > 0) {
    issues.push("One or more compliance documents are expired");
  }

  if (!stripeAccount) {
    issues.push("Stripe payout account has not been created");
  } else {
    if (!stripeAccount.detailsSubmitted) {
      issues.push("Stripe onboarding is incomplete");
    }

    if (!stripeAccount.payoutsEnabled) {
      issues.push("Stripe payouts are not enabled");
    }

    if (stripeAccount.requirementsPastDue?.length) {
      issues.push("Stripe account has past-due requirements");
    }
  }

  if (issues.length === 0) {
    return {
      status: "GREEN",
      reason: "Vendor is eligible for assignment, invoicing, and payout.",
      issues
    };
  }

  if (issues.length === 1) {
    return {
      status: "YELLOW",
      reason: issues[0],
      issues
    };
  }

  return {
    status: "RED",
    reason: issues.join("; "),
    issues
  };
}
