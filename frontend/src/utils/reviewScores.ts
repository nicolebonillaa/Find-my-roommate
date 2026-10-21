import type { ReviewScores } from "../types";

// Average of the six category scores, e.g. 4.4.
export function overallScore(scores: ReviewScores): number {
  const values = [
    scores.cleanlinessScore,
    scores.communicationScore,
    scores.noiseScore,
    scores.paymentScore,
    scores.privacyScore,
    scores.responsibilityScore,
  ];
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}