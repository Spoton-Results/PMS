import { buildResult, InvoiceLike, PayoutLike, RuleLike, VendorLike, WorkOrderLike } from "./types";

export function evaluatePayoutRelease(input: {
  vendor: VendorLike;
  invoice: InvoiceLike;
  payout: PayoutLike;
  workOrder: WorkOrderLike;
  rulebook?: RuleLike | null;
}) {
  const { vendor, invoice, payout, workOrder, rulebook } = input;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const blockingReasons: string[] = [];

  const grossAmount = payout.grossAmount || invoice.invoiceAmount || 0;

  if (vendor.eligibilityStatus !== "GREEN") {
    blockingReasons.push("Vendor is not green eligible");
  }

  if (vendor.payoutStatus !== "READY") {
    blockingReasons.push("Vendor payout account is not ready");
  }

  if (vendor.stripeOnboardingStatus !== "COMPLETE") {
    blockingReasons.push("Stripe onboarding is not complete");
  }

  if (invoice.status !== "APPROVED") {
    blockingReasons.push("Invoice is not approved");
  }

  if (!["APPROVED", "INVOICE_SUBMITTED", "PAYOUT_READY"].includes(workOrder.status || "")) {
    blockingReasons.push("Work order is not approved for payout release");
  }

  if (workOrder.approvedEstimateAmount && grossAmount > workOrder.approvedEstimateAmount) {
    blockingReasons.push("Payout amount exceeds approved estimate");
  }

  if (workOrder.nteAmount && grossAmount > workOrder.nteAmount) {
    blockingReasons.push("Payout amount exceeds NTE amount");
  }

  if (rulebook?.payoutApprovalThreshold && grossAmount > rulebook.payoutApprovalThreshold) {
    warnings.push("Payout exceeds rulebook approval threshold");
  }

  if (rulebook?.autoReleasePayoutIfClean && blockingReasons.length === 0 && warnings.length === 0) {
    reasons.push("Payout can auto-release because all payout gates passed");
  }

  return buildResult({ reasons, warnings, blockingReasons });
}
