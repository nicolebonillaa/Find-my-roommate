
import {
  doc,
  getDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";

import {
  getMyReview,
  getReviewsAboutMe,
  submitRoommateReview,
} from "./reviewService";

import {
  reportReview as sendFirebaseReport,
} from "./reportService";

import { loadRoommateData } from "./firebaseRoommates";

import type {
  PendingReview,
  PublishedReview,
  ReviewScores,
  User,
} from "../types";

import type {
  FirebaseReviewRecord,
} from "./reviewService";

export interface FirebaseReviewData {
  pending: PendingReview[];
  aboutMe: PublishedReview[];
  byMe: PublishedReview[];
}

const DEFAULT_AVATAR_COLOR = "#3461e8";

/* Convert Firestore dates */

function toISO(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return "";
}

/* Find a roommate's display information */

function getUser(
  userId: string,
  users: Record<string, User>
): User {
  return (
    users[userId] || {
      id: userId,
      name: "CSUN Student",
      email: "",
      verificationStatus: "verified",
      avatarColor: DEFAULT_AVATAR_COLOR,
    }
  );
}

/* Check the seven-day deadline */

function deadlinePassed(deadline?: string): boolean {
  if (!deadline) return false;

  const time = new Date(deadline).getTime();

  return Number.isFinite(time) && time <= Date.now();
}

function daysLeft(deadline?: string): number {
  if (!deadline) return 0;

  const time = new Date(deadline).getTime();

  if (!Number.isFinite(time)) return 0;

  return Math.max(
    0,
    Math.ceil(
      (time - Date.now()) /
        (24 * 60 * 60 * 1000)
    )
  );
}

/* Check if both reviews can be revealed */

async function hasReviewReveal(
  connectionId: string
): Promise<boolean> {
  const snapshot = await getDoc(
    doc(db, "reviewReveals", connectionId)
  );

  return snapshot.exists();
}

/* Convert Firebase scores to the UI format */

function toPublishedReview(
  record: FirebaseReviewRecord,
  users: Record<string, User>
): PublishedReview {
  const scores: ReviewScores = record.scores;

  return {
    id: record.id,
    connectionId: record.connectionId,
    reviewerId: record.reviewerId,
    reviewedUserId: record.reviewedUserId,

    cleanlinessScore: scores.cleanlinessScore,
    noiseScore: scores.noiseScore,
    communicationScore: scores.communicationScore,
    privacyScore: scores.privacyScore,
    responsibilityScore: scores.responsibilityScore,
    paymentScore: scores.paymentScore,

    positiveComment: record.positiveComment || "",
    futureRoommateComment:
      record.futureRoommateComment || "",

    status: "published",
    submittedAt: toISO(record.submittedAt),
    publishedAt:
      toISO(record.publishedAt) ||
      toISO(record.submittedAt),

    reviewer: getUser(record.reviewerId, users),
    reviewedUser: getUser(
      record.reviewedUserId,
      users
    ),
  };
}

/* Handle missing private review documents */

async function loadOwnReview(
  connectionId: string
): Promise<FirebaseReviewRecord | null> {
  try {
    return await getMyReview(connectionId);
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error
        ? String(error.code)
        : "";

    // Some rules deny reads of review documents
    // that have not been created yet.
    if (code.includes("permission-denied")) {
      return null;
    }

    throw error;
  }
}

/* Load the current student's review data */

export async function getFirebaseReviewData(): Promise<FirebaseReviewData> {
  const current = auth.currentUser;

  if (!current || !current.emailVerified) {
    throw new Error(
      "Please sign in with a verified CSUN account."
    );
  }

  const [roommateData, aboutRecords] =
    await Promise.all([
      loadRoommateData(),
      getReviewsAboutMe(),
    ]);

  const { connections, students } = roommateData;

  const pending: PendingReview[] = [];
  const aboutMe: PublishedReview[] = [];
  const byMe: PublishedReview[] = [];

  const myReviews = await Promise.all(
    connections.map((connection) =>
      loadOwnReview(connection.id)
    )
  );

  const revealStates = await Promise.all(
    connections.map(async (connection) => {
      if (!connection.reviewDeadline) {
        return false;
      }

      if (deadlinePassed(connection.reviewDeadline)) {
        return true;
      }

      return hasReviewReveal(connection.id);
    })
  );

  const revealedConnections = new Set<string>();

  connections.forEach((connection, index) => {
    if (revealStates[index]) {
      revealedConnections.add(connection.id);
    }

    const otherId = connection.userIds.find(
      (id) => id !== current.uid
    );

    if (!otherId) return;

    const ownReview = myReviews[index];
    const revealed = revealStates[index];

    if (ownReview && revealed) {
      byMe.push(
        toPublishedReview(ownReview, students)
      );
    }

    if (
      connection.status !== "review_open" ||
      !connection.reviewDeadline ||
      deadlinePassed(connection.reviewDeadline) ||
      revealed
    ) {
      return;
    }

    pending.push({
      connectionId: connection.id,
      roommate: getUser(otherId, students),
      daysLeft: daysLeft(connection.reviewDeadline),
      youSubmitted: Boolean(ownReview),
      submittedCount: ownReview ? 1 : 0,
    });
  });

  /* The backend only returns reviews we may read */

  for (const review of aboutRecords) {
    if (
      revealedConnections.has(review.connectionId)
    ) {
      aboutMe.push(
        toPublishedReview(review, students)
      );
    }
  }

  return {
    pending,
    aboutMe,
    byMe,
  };
}

/* Submit one private review */

export async function submitFirebaseReview(data: {
  connectionId: string;
  scores: ReviewScores;
  positiveComment: string;
  futureRoommateComment?: string;
}) {
  return submitRoommateReview(data);
}

/* Report a published review */

export async function reportFirebaseReview(
  reviewId: string,
  reason: string
): Promise<void> {
  const reasons: Record<string, string> = {
    Harassment: "harassment",
    "False information": "false_information",
    "Personal details": "inappropriate_content",
    Other: "other",
  };

  const firebaseReason = reasons[reason] || "other";

  await sendFirebaseReport({
    reviewId,
    reason: firebaseReason,
    explanation: `Reported for: ${reason}.`,
  });
}