
import type { ReviewScores } from "../types";

export interface FirebaseReviewRecord {
  id: string;
  connectionId: string;
  reviewerId: string;
  reviewedUserId: string;
  scores: ReviewScores;
  positiveComment: string;
  futureRoommateComment?: string;
  status: "submitted" | "published" | "hidden";
  submittedAt?: unknown;
  publishedAt?: unknown;
}

export interface FirebasePendingReviewRecord {
  connectionId: string;
  otherUserId: string;
  reviewDeadline: unknown;
}

export function submitRoommateReview(data: {
  connectionId: string;
  scores: ReviewScores;
  positiveComment: string;
  futureRoommateComment?: string;
}): Promise<{
  success: boolean;
  status: "submitted";
  revealedAfterBothSubmit: boolean;
}>;

export function getMyReview(
  connectionId: string
): Promise<FirebaseReviewRecord | null>;

export function getReviewsByMe(): Promise<
  FirebaseReviewRecord[]
>;

export function getReviewsAboutMe(): Promise<
  FirebaseReviewRecord[]
>;

export function getPendingReviews(): Promise<
  FirebasePendingReviewRecord[]
>;