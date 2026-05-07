export type ProofRequirementInput = {
  id: string;
  label: string;
  required: boolean;
};

export type ProofSubmissionInput = {
  proofRequirementId: string;
};

export function evaluateProofCompletion(
  requirements: ProofRequirementInput[],
  submissions: ProofSubmissionInput[]
): { complete: boolean; missing: string[] } {
  const missing = requirements
    .filter((requirement) => requirement.required)
    .filter((requirement) => {
      return !submissions.some(
        (submission) => submission.proofRequirementId === requirement.id
      );
    })
    .map((requirement) => requirement.label);

  return {
    complete: missing.length === 0,
    missing
  };
}
