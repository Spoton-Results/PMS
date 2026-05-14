export type RuleSeverity = "GREEN" | "YELLOW" | "RED";

export type RuleEvaluationResult = {
  allowed: boolean;
  severity: RuleSeverity;
  reasons: string[];
  blockingReasons: string[];
  warnings: string[];
};

export type RuleLike = {
  id?: string;
  name?: string;
  trade?: string | null;
  jobCategory?: string | null;
  state?: string | null;
  requiredDocumentTypes?: string[];
  requiredInsuranceCoverage?: number | null;
  requiredProofTemplateId?: string | null;
  requireBeforePhotos?: boolean;
  requireAfterPhotos?: boolean;
  requireSignature?: boolean;
  requireGps?: boolean;
  estimateApprovalThreshold?: number | null;
  invoiceApprovalThreshold?: number | null;
  payoutApprovalThreshold?: number | null;
  emergencyBypassEstimate?: boolean;
  allowYellowVendorOverride?: boolean;
  autoApproveProofIfComplete?: boolean;
  autoApproveInvoiceIfWithinNte?: boolean;
  autoReleasePayoutIfClean?: boolean;
  preferredVendorIds?: string[];
  blockedVendorIds?: string[];
  active?: boolean;
};

export type VendorLike = {
  id: string;
  eligibilityStatus?: string | null;
  eligibilityReason?: string | null;
  payoutStatus?: string | null;
  stripeOnboardingStatus?: string | null;
  primaryTrade?: string | null;
  serviceRegions?: string[];
  serviceCategories?: string[];
  documents?: Array<{
    documentType: string;
    status: string;
    expirationDate?: Date | string | null;
    coverageAmount?: number | null;
  }>;
};

export type PropertyLike = {
  id: string;
  state?: string | null;
};

export type WorkOrderLike = {
  id?: string;
  jobCategory?: string | null;
  priority?: string | null;
  status?: string | null;
  nteAmount?: number | null;
  approvedEstimateAmount?: number | null;
};

export type InvoiceLike = {
  id?: string;
  status?: string | null;
  invoiceAmount?: number | null;
  approvedAmount?: number | null;
};

export type PayoutLike = {
  id?: string;
  status?: string | null;
  grossAmount?: number | null;
};

export type ProofRequirementLike = {
  id: string;
  label: string;
  required: boolean;
  type?: string;
};

export type ProofSubmissionLike = {
  proofRequirementId: string;
  reviewStatus?: string | null;
  fileUrl?: string | null;
  gpsLat?: number | null;
  gpsLng?: number | null;
};

export function buildResult(input: {
  reasons?: string[];
  blockingReasons?: string[];
  warnings?: string[];
}): RuleEvaluationResult {
  const reasons = input.reasons || [];
  const blockingReasons = input.blockingReasons || [];
  const warnings = input.warnings || [];

  return {
    allowed: blockingReasons.length === 0,
    severity: blockingReasons.length > 0 ? "RED" : warnings.length > 0 ? "YELLOW" : "GREEN",
    reasons,
    blockingReasons,
    warnings
  };
}
