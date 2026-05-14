import { evaluateVendorEligibility } from "./evaluate-vendor-eligibility";
import { buildResult, PropertyLike, RuleLike, VendorLike, WorkOrderLike } from "./types";

export function evaluateAssignmentEligibility(input: {
  vendor: VendorLike | null | undefined;
  property?: PropertyLike | null;
  workOrder: WorkOrderLike;
  rulebook?: RuleLike | null;
  allowYellowOverride?: boolean;
}) {
  const { vendor, property, workOrder, rulebook, allowYellowOverride } = input;
  const vendorCheck = evaluateVendorEligibility(vendor, rulebook);
  const reasons = [...vendorCheck.reasons];
  const warnings = [...vendorCheck.warnings];
  const blockingReasons = [...vendorCheck.blockingReasons];

  if (!vendor) return buildResult({ blockingReasons });

  if (rulebook?.trade && vendor.primaryTrade && vendor.primaryTrade !== rulebook.trade) {
    blockingReasons.push(`Vendor trade ${vendor.primaryTrade} does not match required trade ${rulebook.trade}`);
  }

  if (rulebook?.jobCategory && workOrder.jobCategory && workOrder.jobCategory !== rulebook.jobCategory) {
    warnings.push(`Work order category ${workOrder.jobCategory} differs from rulebook category ${rulebook.jobCategory}`);
  }

  if (rulebook?.state && property?.state && property.state !== rulebook.state) {
    warnings.push(`Property state ${property.state} differs from rulebook state ${rulebook.state}`);
  }

  if (workOrder.priority === "EMERGENCY" && rulebook?.emergencyBypassEstimate) {
    reasons.push("Emergency job may bypass estimate approval under rulebook");
  }

  if (vendor.eligibilityStatus === "YELLOW" && !rulebook?.allowYellowVendorOverride && !allowYellowOverride) {
    blockingReasons.push("Yellow vendor requires override, but override is not allowed");
  }

  if (vendor.eligibilityStatus === "YELLOW" && (rulebook?.allowYellowVendorOverride || allowYellowOverride)) {
    warnings.push("Yellow vendor assigned with allowed override");
  }

  return buildResult({ reasons, warnings, blockingReasons });
}
