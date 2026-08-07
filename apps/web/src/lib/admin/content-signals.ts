export type PriorityTier = "urgent" | "elevated" | "normal";

export interface ContentPriority {
  score: number; // 0-100
  tier: PriorityTier;
  factors: string[];
}

interface ContentSignalInput {
  status?: string;
  createdAt: Date;
  businessRiskScore?: number;
  businessPriorViolations?: number;
  authorPriorViolations?: number;
}

export function computeContentPriority(input: ContentSignalInput): ContentPriority {
  const {
    status,
    createdAt,
    businessRiskScore = 0,
    businessPriorViolations = 0,
    authorPriorViolations = 0,
  } = input;

  let score = 0;
  const factors: string[] = [];

  // PENDING status (once reviews switch to pending by default)
  if (status === "PENDING") {
    score += 40;
    factors.push("pending_review");
  }

  // High business risk
  if (businessRiskScore >= 8) {
    score += 25;
    factors.push("high_risk_business");
  } else if (businessRiskScore >= 6) {
    score += 15;
    factors.push("elevated_risk_business");
  }

  // Prior violations on this business
  if (businessPriorViolations >= 3) {
    score += 20;
    factors.push("repeat_offender");
  } else if (businessPriorViolations > 0) {
    score += 10;
    factors.push("prior_violations");
  }

  // Author violations
  if (authorPriorViolations >= 2) {
    score += 10;
    factors.push("author_violations");
  }

  // Recency
  const now = new Date();
  const ageMs = now.getTime() - new Date(createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  const ageMinutes = ageMs / (1000 * 60);

  if (ageMinutes < 120) {
    // Brand new (< 2 hours)
    score += 10;
    factors.push("very_recent");
  } else if (ageHours < 24) {
    // Recent (< 24 hours)
    score += 5;
    factors.push("recent");
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine tier
  let tier: PriorityTier = "normal";
  if (score >= 70) {
    tier = "urgent";
  } else if (score >= 40) {
    tier = "elevated";
  }

  return { score, tier, factors };
}

export function getTierColor(tier: PriorityTier): string {
  switch (tier) {
    case "urgent":
      return "border-l-red-500 bg-red-50 dark:bg-red-900/20";
    case "elevated":
      return "border-l-orange-500 bg-orange-50 dark:bg-orange-900/20";
    case "normal":
      return "border-l-gray-300 bg-gray-50 dark:bg-gray-900/20";
  }
}

export function getTierLabel(tier: PriorityTier): string {
  switch (tier) {
    case "urgent":
      return "Urgent";
    case "elevated":
      return "Elevated";
    case "normal":
      return "Normal";
  }
}
