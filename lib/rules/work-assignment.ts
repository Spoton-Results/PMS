export type VendorForAssignment = {
  eligibilityStatus: "GREEN" | "YELLOW" | "RED";
  eligibilityReason?: string | null;
  primaryTrade?: string | null;
  serviceRegions?: string[];
};

export type WorkOrderForAssignment = {
  jobCategory: string;
  city?: string | null;
  state?: string | null;
  emergency?: boolean;
};

export function canAssignVendorToWorkOrder(
  vendor: VendorForAssignment,
  workOrder: WorkOrderForAssignment,
  options?: { allowYellowWithOverride?: boolean }
): { allowed: boolean; reason: string; requiresOverride: boolean } {
  if (vendor.eligibilityStatus === "RED") {
    return {
      allowed: false,
      reason: vendor.eligibilityReason || "Vendor is red and cannot receive new assignments.",
      requiresOverride: false
    };
  }

  if (vendor.eligibilityStatus === "YELLOW" && !options?.allowYellowWithOverride) {
    return {
      allowed: false,
      reason: "Vendor is yellow and requires manager override before assignment.",
      requiresOverride: true
    };
  }

  if (vendor.primaryTrade && vendor.primaryTrade !== workOrder.jobCategory) {
    return {
      allowed: false,
      reason: "Vendor trade does not match the work order category.",
      requiresOverride: true
    };
  }

  return {
    allowed: true,
    reason: "Vendor can be assigned to this work order.",
    requiresOverride: vendor.eligibilityStatus === "YELLOW"
  };
}
