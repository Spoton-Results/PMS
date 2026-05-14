import { buildResult, RuleLike, VendorLike } from "./types";

function isExpired(date?: Date | string | null) {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

export function evaluateVendorEligibility(vendor: VendorLike | null | undefined, rulebook?: RuleLike | null) {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const blockingReasons: string[] = [];

  if (!vendor) {
    return buildResult({ blockingReasons: ["Vendor missing"] });
  }

  if (vendor.eligibilityStatus === "RED") {
    blockingReasons.push(vendor.eligibilityReason || "Vendor is RED");
  }

  if (rulebook?.blockedVendorIds?.includes(vendor.id)) {
    blockingReasons.push("Vendor blocked by rulebook");
  }

  if (vendor.payoutStatus !== "READY") {
    warnings.push("Vendor payout account is not ready");
  }

  const documents = vendor.documents || [];
  const requiredDocs = rulebook?.requiredDocumentTypes || [];

  for (const requiredType of requiredDocs) {
    const approvedDoc = documents.find((doc) =>
      doc.documentType === requiredType &&
      doc.status === "APPROVED" &&
      !isExpired(doc.expirationDate)
    );

    if (!approvedDoc) {
      blockingReasons.push(`Missing valid required document: ${requiredType}`);
    }
  }

  if (rulebook?.requiredInsuranceCoverage) {
    const insuranceDocs = documents.filter((doc) =>
      ["GENERAL_LIABILITY", "WORKERS_COMP", "COI"].includes(doc.documentType) &&
      doc.status === "APPROVED" &&
      !isExpired(doc.expirationDate)
    );

    const hasRequiredCoverage = insuranceDocs.some((doc) =>
      typeof doc.coverageAmount === "number" &&
      doc.coverageAmount >= (rulebook.requiredInsuranceCoverage || 0)
    );

    if (!hasRequiredCoverage) {
      blockingReasons.push(`Insurance coverage below required amount: ${rulebook.requiredInsuranceCoverage}`);
    }
  }

  if (rulebook?.preferredVendorIds?.includes(vendor.id)) {
    reasons.push("Vendor is preferred by rulebook");
  }

  return buildResult({ reasons, warnings, blockingReasons });
}
