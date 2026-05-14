import { buildResult, ProofRequirementLike, ProofSubmissionLike, RuleLike } from "./types";

export function evaluateProofRequirements(input: {
  requirements: ProofRequirementLike[];
  submissions: ProofSubmissionLike[];
  rulebook?: RuleLike | null;
}) {
  const { requirements, submissions, rulebook } = input;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const blockingReasons: string[] = [];

  for (const requirement of requirements || []) {
    const matchingSubmissions = submissions.filter((submission) => submission.proofRequirementId === requirement.id);
    const hasSubmission = matchingSubmissions.length > 0;
    const hasApprovedSubmission = matchingSubmissions.some((submission) => submission.reviewStatus === "APPROVED");
    const hasRejectedSubmission = matchingSubmissions.some((submission) => submission.reviewStatus === "REJECTED" || submission.reviewStatus === "REWORK_REQUESTED");

    if (requirement.required && !hasSubmission) {
      blockingReasons.push(`Missing proof requirement: ${requirement.label}`);
      continue;
    }

    if (requirement.required && hasRejectedSubmission) {
      blockingReasons.push(`Proof rejected or rework requested: ${requirement.label}`);
    }

    if (requirement.required && hasSubmission && !hasApprovedSubmission) {
      warnings.push(`Proof submitted but not approved yet: ${requirement.label}`);
    }
  }

  if (rulebook?.requireGps) {
    const missingGps = submissions.some((submission) => submission.gpsLat == null || submission.gpsLng == null);
    if (missingGps) warnings.push("One or more proof submissions are missing GPS metadata");
  }

  if (rulebook?.requireSignature) {
    const hasSignature = requirements.some((requirement) => requirement.type === "SIGNATURE");
    if (!hasSignature) blockingReasons.push("Rulebook requires signature proof, but template has no signature requirement");
  }

  if (blockingReasons.length === 0 && warnings.length === 0) {
    reasons.push("All required proof has been submitted and approved");
  }

  return buildResult({ reasons, warnings, blockingReasons });
}
