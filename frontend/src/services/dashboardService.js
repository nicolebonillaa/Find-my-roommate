import { auth } from "../firebase";

import {
  getIncomingRequests,
  getOutgoingRequests,
} from "./requestService";

import { getMyConnections } from "./connectionService";

import {
  getPendingReviews,
  getReviewsByMe,
  getReviewsAboutMe,
} from "./reviewService";

function requireUser() {
  if (!auth.currentUser) {
    throw new Error("You must be signed in.");
  }

  return auth.currentUser;
}

function convertTimestamp(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  return value;
}

export async function getDashboardStats() {
  requireUser();

  const [
    incomingRequests,
    outgoingRequests,
    connections,
    pendingReviews,
    reviewsByMe,
    reviewsAboutMe,
  ] = await Promise.all([
    getIncomingRequests(),
    getOutgoingRequests(),
    getMyConnections(),
    getPendingReviews(),
    getReviewsByMe(),
    getReviewsAboutMe(),
  ]);

  const pendingRequests = incomingRequests.filter(
    (request) => request.status === "pending"
  );

  const activeConnections = connections.filter(
    (connection) => connection.status !== "closed"
  );

  return {
    pendingRequests: pendingRequests.length,
    outgoingRequests: outgoingRequests.filter(
      (request) => request.status === "pending"
    ).length,
    activeConnections: activeConnections.length,
    pendingReviews: pendingReviews.length,
    reviewsWritten: reviewsByMe.length,
    reviewsReceived: reviewsAboutMe.length,
  };
}

export async function getRecentActivity() {
  requireUser();

  const [
    incomingRequests,
    outgoingRequests,
    connections,
    reviewsByMe,
  ] = await Promise.all([
    getIncomingRequests(),
    getOutgoingRequests(),
    getMyConnections(),
    getReviewsByMe(),
  ]);

  const activity = [];

  for (const request of incomingRequests) {
    activity.push({
      id: `incoming-${request.id}`,
      type: "incoming_request",
      status: request.status,
      date: convertTimestamp(
        request.respondedAt || request.createdAt
      ),
      data: request,
    });
  }

  for (const request of outgoingRequests) {
    activity.push({
      id: `outgoing-${request.id}`,
      type: "outgoing_request",
      status: request.status,
      date: convertTimestamp(
        request.respondedAt || request.createdAt
      ),
      data: request,
    });
  }

  for (const connection of connections) {
    activity.push({
      id: `connection-${connection.id}`,
      type: "connection",
      status: connection.status,
      date: convertTimestamp(connection.createdAt),
      data: connection,
    });
  }

  for (const review of reviewsByMe) {
    activity.push({
      id: `review-${review.id}`,
      type: "review_submitted",
      status: review.status,
      date: convertTimestamp(review.submittedAt),
      data: review,
    });
  }

  return activity
    .filter((item) => item.date)
    .sort(
      (first, second) =>
        new Date(second.date) - new Date(first.date)
    )
    .slice(0, 10);
}