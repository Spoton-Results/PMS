import { buildResult, InvoiceLike, RuleLike, WorkOrderLike } from "./types";

export function evaluateInvoiceApproval(input: {
  invoice: InvoiceLike;
  workOrder: WorkOrderLike;
  rulebook?: RuleLike | null;
}) {
  const { invoice, workOrder, rulebook } = input;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const blockingReasons: string[] = [];

  const invoiceAmount = invoice.invoiceAmount || 0;

  if (invoice.status === "REJECTED") {
    blockingReasons.push("Invoice has been rejected");
  }

  if (workOrder.approvedEstimateAmount && invoiceAmount > workOrder.approvedEstimateAmount) {
    blockingReasons.push("Invoice exceeds approved estimate amount");
  }

  if (workOrder.nteAmount && invoiceAmount > workOrder.nteAmount) {
    blockingReasons.push("Invoice exceeds NTE amount");
  }

  if (rulebook?.invoiceApprovalThreshold && invoiceAmount > rulebook.invoiceApprovalThreshold) {
    warnings.push("Invoice exceeds rulebook approval threshold and requires review");
  }

  if (rulebook?.autoApproveInvoiceIfWithinNte && blockingReasons.length === 0) {
    reasons.push("Invoice can auto-approve because it is within NTE and rulebook allows it");
  }

  return buildResult({ reasons, warnings, blockingReasons });
}
