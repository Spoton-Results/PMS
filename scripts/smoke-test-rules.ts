import {
  canAssignVendorToWorkOrder,
  evaluatePayoutReadiness,
  evaluateProofCompletion,
  evaluateVendorEligibility
} from "../lib/rules";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

const redVendor = evaluateVendorEligibility([], null);
assert(redVendor.status === "RED", "Vendor without docs and Stripe should be RED");

const greenVendor = evaluateVendorEligibility(
  [{ documentType: "W9", status: "APPROVED", expirationDate: null }],
  { payoutsEnabled: true, detailsSubmitted: true, requirementsPastDue: [] }
);
assert(greenVendor.status === "GREEN", "Vendor with approved W9 and ready Stripe should be GREEN");

const blockedAssignment = canAssignVendorToWorkOrder(
  { eligibilityStatus: "RED", eligibilityReason: "Expired insurance", primaryTrade: "Plumbing", serviceRegions: ["UT"] },
  { jobCategory: "Plumbing", state: "UT" }
);
assert(blockedAssignment.allowed === false, "RED vendor assignment should be blocked");

const proofResult = evaluateProofCompletion(
  [
    { id: "before", label: "Before photo", required: true },
    { id: "after", label: "After photo", required: true }
  ],
  [{ proofRequirementId: "before" }]
);
assert(proofResult.complete === false, "Proof should be incomplete when required item is missing");
assert(proofResult.missing.includes("After photo"), "Missing proof should identify After photo");

const payoutHold = evaluatePayoutReadiness({
  vendor: { eligibilityStatus: "GREEN", stripeOnboardingStatus: "COMPLETE" },
  invoice: { status: "APPROVED", invoiceAmount: 600 },
  workOrder: { approvedEstimateAmount: 500, nteAmount: 500 },
  proofComplete: true
});
assert(payoutHold.ready === false, "Payout should hold when invoice exceeds approved amount");

const payoutReady = evaluatePayoutReadiness({
  vendor: { eligibilityStatus: "GREEN", stripeOnboardingStatus: "COMPLETE" },
  invoice: { status: "APPROVED", invoiceAmount: 450 },
  workOrder: { approvedEstimateAmount: 500, nteAmount: 500 },
  proofComplete: true
});
assert(payoutReady.ready === true, "Payout should be ready when all gates pass");

console.log("Rule smoke tests passed.");
