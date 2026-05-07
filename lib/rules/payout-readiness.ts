export type VendorForPayout = {
  eligibilityStatus: "GREEN" | "YELLOW" | "RED";
  stripeOnboardingStatus: "NOT_STARTED" | "PENDING" | "COMPLETE" | "RESTRICTED";
};

export type InvoiceForPayout = {
  status: "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "OVER_NTE" | "PAYOUT_READY" | "PAYOUT_HOLD" | "PAID";
  invoiceAmount: number;
};

export type WorkOrderForPayout = {
  approvedEstimateAmount?: number | null;
  nteAmount?: number | null;
};

export function evaluatePayoutReadiness(input: {
  vendor: VendorForPayout;
  invoice: InvoiceForPayout;
  workOrder: WorkOrderForPayout;
  proofComplete: boolean;
}): { ready: boolean; status: "READY" | "ON_HOLD"; holdReason: string | null; holdReasons: string[] } {
  const holdReasons: string[] = [];
  const { vendor, invoice, workOrder, proofComplete } = input;

  if (vendor.eligibilityStatus !== "GREEN") {
    holdReasons.push("Vendor is not green eligible");
  }

  if (vendor.stripeOnboardingStatus !== "COMPLETE") {
    holdReasons.push("Stripe onboarding is incomplete");
  }

  if (!proofComplete) {
    holdReasons.push("Required proof pack is incomplete");
  }

  if (invoice.status !== "APPROVED") {
    holdReasons.push("Invoice is not approved");
  }

  const approvedLimit = workOrder.approvedEstimateAmount ?? workOrder.nteAmount;
  if (approvedLimit && invoice.invoiceAmount > approvedLimit) {
    holdReasons.push("Invoice exceeds approved amount or NTE");
  }

  if (holdReasons.length > 0) {
    return {
      ready: false,
      status: "ON_HOLD",
      holdReason: holdReasons.join("; "),
      holdReasons
    };
  }

  return {
    ready: true,
    status: "READY",
    holdReason: null,
    holdReasons: []
  };
}
