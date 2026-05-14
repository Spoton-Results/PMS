import { RuleLike, PropertyLike, WorkOrderLike } from "./types";

function scoreRulebook(rulebook: RuleLike, input: { property?: PropertyLike | null; workOrder?: WorkOrderLike | null; trade?: string | null }) {
  let score = 0;

  if (rulebook.active === false) return -1;
  if (rulebook.name) score += 1;

  if (rulebook.state && input.property?.state && rulebook.state === input.property.state) score += 10;
  if (rulebook.trade && input.trade && rulebook.trade === input.trade) score += 10;
  if (rulebook.jobCategory && input.workOrder?.jobCategory && rulebook.jobCategory === input.workOrder.jobCategory) score += 10;

  if (rulebook.isDefault) score += 2;

  return score;
}

export function matchBestRulebook(rulebooks: RuleLike[], input: { property?: PropertyLike | null; workOrder?: WorkOrderLike | null; trade?: string | null }) {
  const scored = rulebooks
    .map((rulebook) => ({ rulebook, score: scoreRulebook(rulebook, input) }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.rulebook || null;
}
