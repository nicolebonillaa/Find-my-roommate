import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";
import { getMyConnections } from "./connectionService";

function requireUser() {
  if (!auth.currentUser) {
    throw new Error("You must be signed in.");
  }

  return auth.currentUser;
}

function reviewIdFor(connectionId, reviewerId) {
  return `${connectionId}_${reviewerId}`;
}

export async function submitRoommateReview({
  connectionId,
  scores,
  positiveComment = "",
  futureRoommateComment = "",
}) {
  const user = requireUser();

  const connectionReference = doc(
    db,
    "connections",
    connectionId
  );

  const reviewReference = doc(
    db,
    "reviews",
    reviewIdFor(connectionId, user.uid)
  );

  const revealReference = doc(
    db,
    "reviewReveals",
    connectionId
  );

  return runTransaction(db, async (transaction) => {
    const connectionSnapshot = await transaction.get(
      connectionReference
    );

    if (!connectionSnapshot.exists()) {
      throw new Error("Connection was not found.");
    }

    const connection = connectionSnapshot.data();

    if (!connection.userIds?.includes(user.uid)) {
      throw new Error("You are not part of this connection.");
    }

    if (connection.status !== "review_open") {
      throw new Error("The review window is not open.");
    }

    const reviewedUserId = connection.userIds.find(
      (userId) => userId !== user.uid
    );

    if (!reviewedUserId) {
      throw new Error("The other roommate was not found.");
    }

    const existingReview = await transaction.get(
      reviewReference
    );

    if (existingReview.exists()) {
      throw new Error("You already submitted a review.");
    }

    const otherReviewReference = doc(
      db,
      "reviews",
      reviewIdFor(connectionId, reviewedUserId)
    );

    const otherReview = await transaction.get(
      otherReviewReference
    );

    transaction.set(reviewReference, {
      connectionId,
      reviewerId: user.uid,
      reviewedUserId,
      scores,
      positiveComment: positiveComment.trim(),
      futureRoommateComment: futureRoommateComment.trim(),
      status: "submitted",
      submittedAt: serverTimestamp(),
      publishedAt: null,
    });

    const otherReviewSubmitted =
      otherReview.exists() &&
      otherReview.data().status === "submitted";

    if (otherReviewSubmitted) {
      transaction.set(
        revealReference,
        {
          connectionId,
          otherReviewerId: reviewedUserId,
          reason: "both_submitted",
          publishedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    return {
      success: true,
      status: "submitted",
      revealedAfterBothSubmit: otherReviewSubmitted,
    };
  });
}

export async function getMyReview(connectionId) {
  const user = requireUser();

  const reviewSnapshot = await getDoc(
    doc(
      db,
      "reviews",
      reviewIdFor(connectionId, user.uid)
    )
  );

  if (!reviewSnapshot.exists()) {
    return null;
  }

  return {
    id: reviewSnapshot.id,
    ...reviewSnapshot.data(),
  };
}

export async function getReviewsByMe() {
  requireUser();

  const connections = await getMyConnections();
  const reviews = [];

  for (const connection of connections) {
    const review = await getMyReview(connection.id);

    if (review) {
      reviews.push(review);
    }
  }

  return reviews;
}

export async function getReviewsAboutMe() {
  const user = requireUser();
  const connections = await getMyConnections();
  const reviews = [];

  for (const connection of connections) {
    const otherUserId = connection.userIds?.find(
      (userId) => userId !== user.uid
    );

    if (!otherUserId) {
      continue;
    }

    try {
      const reviewSnapshot = await getDoc(
        doc(
          db,
          "reviews",
          reviewIdFor(connection.id, otherUserId)
        )
      );

      if (reviewSnapshot.exists()) {
        reviews.push({
          id: reviewSnapshot.id,
          ...reviewSnapshot.data(),
        });
      }
    } catch (error) {
      // Firestore correctly hides unrevealed reviews.
      // Ignore only that expected privacy error.
      if (error.code !== "permission-denied") {
        throw error;
      }
    }
  }

  return reviews;
}

export async function getPendingReviews() {
  const user = requireUser();
  const connections = await getMyConnections();
  const pendingReviews = [];

  for (const connection of connections) {
    if (connection.status !== "review_open") {
      continue;
    }

    const myReview = await getMyReview(connection.id);

    if (!myReview) {
      const otherUserId = connection.userIds?.find(
        (userId) => userId !== user.uid
      );

      if (otherUserId) {
        pendingReviews.push({
          connectionId: connection.id,
          otherUserId,
          reviewDeadline: connection.reviewDeadline || null,
        });
      }
    }
  }

  return pendingReviews;
}