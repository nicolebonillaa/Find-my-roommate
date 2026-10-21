
import { useSyncExternalStore } from "react";

import {
  CURRENT_USER_ID,
  connections,
  dashboardStats,
  myProfile,
  recentActivity,
  requests,
  reviews,
  students,
  users,
} from "../data/mock";

import type {
  ActivityItem,
  Connection,
  PendingReview,
  PublishedReview,
  Review,
  ReviewScores,
  RoommateRequest,
  Student,
  User,
} from "../types";

const delay = <T,>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// Student profiles

export function getCurrentUser(): Promise<User> {
  return delay(users[CURRENT_USER_ID]);
}

export function getMyProfile(): Promise<Student> {
  return delay(myProfile);
}

export function getStudents(): Promise<Student[]> {
  return delay(students);
}

export function getStudent(
  id: string
): Promise<Student | undefined> {
  return delay(
    students.find((student) => student.userId === id)
  );
}

// Requests and connections

export interface RequestSnapshot {
  requests: RoommateRequest[];
  connections: Connection[];
}

type Listener = () => void;

const listeners = new Set<Listener>();

let requestSnapshot: RequestSnapshot = {
  requests: [...requests],
  connections: [...connections],
};

function subscribeToRequests(
  listener: Listener
): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getRequestSnapshot(): RequestSnapshot {
  return requestSnapshot;
}

function publishRequestChange(): void {
  requestSnapshot = {
    requests: [...requests],
    connections: [...connections],
  };

  listeners.forEach((listener) => listener());
}

export function useRequestData(): RequestSnapshot {
  return useSyncExternalStore(
    subscribeToRequests,
    getRequestSnapshot,
    getRequestSnapshot
  );
}

export function getIncomingRequests(): Promise<
  (RoommateRequest & { sender: User })[]
> {
  const list = requests
    .filter(
      (request) =>
        request.receiverId === CURRENT_USER_ID &&
        request.status === "pending"
    )
    .map((request) => ({
      ...request,
      sender: users[request.senderId],
    }))
    .filter((request) => Boolean(request.sender));

  return delay(list);
}

export function respondToRequest(
  id: string,
  action: "accepted" | "declined"
): Promise<void> {
  const request = requests.find(
    (item) =>
      item.id === id &&
      item.status === "pending"
  );

  if (
    request &&
    request.receiverId === CURRENT_USER_ID
  ) {
    request.status = action;

    if (action === "accepted") {
      const alreadyConnected = connections.some(
        (connection) =>
          connection.userIds.includes(
            request.senderId
          ) &&
          connection.userIds.includes(
            request.receiverId
          ) &&
          connection.status !== "closed"
      );

      if (!alreadyConnected) {
        connections.push({
          id: `conn-${request.id}`,
          userIds: [
            request.senderId,
            request.receiverId,
          ],
          confirmedBy: [],
          status: "awaiting_confirmation",
        });
      }
    }

    publishRequestChange();
  }

  return delay(undefined);
}

export function cancelOutgoingRequest(
  id: string
): boolean {
  const request = requests.find(
    (item) =>
      item.id === id &&
      item.senderId === CURRENT_USER_ID &&
      item.status === "pending"
  );

  if (!request) return false;

  request.status = "ended";

  publishRequestChange();

  return true;
}

export function confirmLivingTogether(
  id: string
): boolean {
  const connection = connections.find(
    (item) => item.id === id
  );

  if (
    !connection ||
    connection.status !== "awaiting_confirmation" ||
    !connection.userIds.includes(CURRENT_USER_ID)
  ) {
    return false;
  }

  if (
    !connection.confirmedBy.includes(CURRENT_USER_ID)
  ) {
    connection.confirmedBy.push(CURRENT_USER_ID);
  }

  const bothConfirmed = connection.userIds.every(
    (userId) =>
      connection.confirmedBy.includes(userId)
  );

  if (bothConfirmed) {
    connection.status = "review_open";

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    connection.reviewDeadline =
      deadline.toISOString();
  }

  publishRequestChange();

  return true;
}

export function endRoommateConnection(
  id: string
): boolean {
  const connection = connections.find(
    (item) =>
      item.id === id &&
      item.userIds.includes(CURRENT_USER_ID)
  );

  if (
    !connection ||
    connection.status === "closed"
  ) {
    return false;
  }

  // Confirmed review windows remain open.
  if (
    connection.status === "awaiting_confirmation"
  ) {
    connection.status = "closed";
  }

  publishRequestChange();

  return true;
}

export function getOtherRoommate(
  connection: Connection
): User | undefined {
  const otherId = connection.userIds.find(
    (id) => id !== CURRENT_USER_ID
  );

  return otherId
    ? users[otherId]
    : undefined;
}

export function getDaysRemaining(
  deadline?: string
): number {
  if (!deadline) return 0;

  const milliseconds =
    new Date(deadline).getTime() - Date.now();

  if (!Number.isFinite(milliseconds)) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil(
      milliseconds / (24 * 60 * 60 * 1000)
    )
  );
}

// Existing request simulation functions.
// Kept for compatibility with the current app.

export function simulateOtherConfirmation(): boolean {
  const connection = connections.find(
    (item) =>
      item.status === "awaiting_confirmation" &&
      item.userIds.includes(CURRENT_USER_ID)
  );

  if (!connection) return false;

  const otherId = connection.userIds.find(
    (id) => id !== CURRENT_USER_ID
  );

  if (
    otherId &&
    !connection.confirmedBy.includes(otherId)
  ) {
    connection.confirmedBy.push(otherId);
  }

  const bothConfirmed = connection.userIds.every(
    (id) => connection.confirmedBy.includes(id)
  );

  if (bothConfirmed) {
    connection.status = "review_open";

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    connection.reviewDeadline =
      deadline.toISOString();
  }

  publishRequestChange();

  return true;
}

export function simulateSentAccepted(): boolean {
  const request = requests.find(
    (item) =>
      item.senderId === CURRENT_USER_ID &&
      item.status === "pending"
  );

  if (!request) return false;

  request.status = "accepted";

  const alreadyConnected = connections.some(
    (connection) =>
      connection.status !== "closed" &&
      connection.userIds.includes(
        request.senderId
      ) &&
      connection.userIds.includes(
        request.receiverId
      )
  );

  if (!alreadyConnected) {
    connections.push({
      id: `conn-${request.id}`,
      userIds: [
        request.senderId,
        request.receiverId,
      ],
      confirmedBy: [],
      status: "awaiting_confirmation",
    });
  }

  publishRequestChange();

  return true;
}

export function simulateSentDeclined(): boolean {
  const request = requests.find(
    (item) =>
      item.senderId === CURRENT_USER_ID &&
      item.status === "pending"
  );

  if (!request) return false;

  request.status = "declined";

  publishRequestChange();

  return true;
}

// My Reviews

const reviewStorageKey =
  "roomiereport-local-reviews-v1";

const reviewListeners = new Set<Listener>();

let reviewRevision = 0;

// Restore locally submitted reviews after refreshing.
function loadLocalReviews(): void {
  if (typeof window === "undefined") return;

  try {
    const saved = JSON.parse(
      localStorage.getItem(reviewStorageKey) || "[]"
    ) as unknown;

    if (!Array.isArray(saved)) return;

    for (const item of saved) {
      if (
        typeof item !== "object" ||
        item === null
      ) {
        continue;
      }

      const review = item as Review;

      if (
        typeof review.id !== "string" ||
        typeof review.connectionId !== "string" ||
        review.reviewerId !== CURRENT_USER_ID ||
        !["submitted", "published"].includes(
          review.status
        )
      ) {
        continue;
      }

      // Keep existing mock data when IDs match.
      if (
        reviews.some(
          (existing) => existing.id === review.id
        )
      ) {
        continue;
      }

      reviews.push(review);
    }
  } catch {
    // Invalid browser data is ignored.
  }
}

loadLocalReviews();

function subscribeToReviews(
  listener: Listener
): () => void {
  reviewListeners.add(listener);

  return () => {
    reviewListeners.delete(listener);
  };
}

function getReviewSnapshot(): number {
  return reviewRevision;
}

function publishReviewChange(): void {
  reviewRevision += 1;

  reviewListeners.forEach(
    (listener) => listener()
  );
}

// My Reviews refreshes when a review changes.
export function useReviewRevision(): number {
  return useSyncExternalStore(
    subscribeToReviews,
    getReviewSnapshot,
    getReviewSnapshot
  );
}

function saveLocalReviews(): void {
  if (typeof window === "undefined") return;

  try {
    const myLocalReviews = reviews.filter(
      (review) =>
        review.reviewerId === CURRENT_USER_ID &&
        review.id.startsWith("review-")
    );

    localStorage.setItem(
      reviewStorageKey,
      JSON.stringify(myLocalReviews)
    );
  } catch {
    // The review stays in memory for this session.
  }
}

// Used only for local preview behavior.
// Real publication must happen in the backend.
function publishCompletedReviewPair(
  connectionId: string
): void {
  const connection = connections.find(
    (item) => item.id === connectionId
  );

  if (!connection) return;

  const submitted = reviews.filter(
    (review) =>
      review.connectionId === connectionId &&
      review.status === "submitted"
  );

  const bothSubmitted = connection.userIds.every(
    (userId) =>
      submitted.some(
        (review) => review.reviewerId === userId
      )
  );

  if (!bothSubmitted) return;

  const now = new Date().toISOString();

  submitted.forEach((review) => {
    review.status = "published";
    review.publishedAt = now;
  });
}

// Submit one review for a confirmed connection.
export async function submitRoommateReview(
  connectionId: string,
  details: ReviewScores & {
    positiveComment: string;
    futureRoommateComment?: string;
  }
): Promise<void> {
  const connection = connections.find(
    (item) => item.id === connectionId
  );

  if (
    !connection ||
    connection.status !== "review_open" ||
    !connection.userIds.includes(CURRENT_USER_ID)
  ) {
    throw new Error(
      "This connection is not open for reviews."
    );
  }

  const bothConfirmed = connection.userIds.every(
    (id) =>
      connection.confirmedBy.includes(id)
  );

  if (!bothConfirmed) {
    throw new Error(
      "Both roommates must confirm living together first."
    );
  }

  const deadlineTime = connection.reviewDeadline
    ? new Date(
        connection.reviewDeadline
      ).getTime()
    : NaN;

  if (
    !Number.isFinite(deadlineTime) ||
    Date.now() >= deadlineTime
  ) {
    throw new Error(
      "The review submission window has ended."
    );
  }

  const alreadySubmitted = reviews.some(
    (review) =>
      review.connectionId === connectionId &&
      review.reviewerId === CURRENT_USER_ID
  );

  if (alreadySubmitted) {
    throw new Error(
      "You already submitted a review for this connection."
    );
  }

  const values = [
    details.cleanlinessScore,
    details.noiseScore,
    details.communicationScore,
    details.privacyScore,
    details.responsibilityScore,
    details.paymentScore,
  ];

  const invalidScores = values.some(
    (value) =>
      !Number.isInteger(value) ||
      value < 1 ||
      value > 5
  );

  if (invalidScores) {
    throw new Error(
      "Please rate all six categories from 1 to 5."
    );
  }

  if (
    details.positiveComment.trim().length < 10
  ) {
    throw new Error(
      "Please write at least 10 characters about what went well."
    );
  }

  const otherId = connection.userIds.find(
    (id) => id !== CURRENT_USER_ID
  );

  if (!otherId) {
    throw new Error(
      "The other roommate could not be found."
    );
  }

  const now = new Date().toISOString();

  const review: Review = {
    id: `review-${connectionId}-${CURRENT_USER_ID}`,
    connectionId,
    reviewerId: CURRENT_USER_ID,
    reviewedUserId: otherId,

    cleanlinessScore: details.cleanlinessScore,
    noiseScore: details.noiseScore,
    communicationScore:
      details.communicationScore,
    privacyScore: details.privacyScore,
    responsibilityScore:
      details.responsibilityScore,
    paymentScore: details.paymentScore,

    positiveComment:
      details.positiveComment.trim(),
    futureRoommateComment:
      details.futureRoommateComment?.trim() ||
      undefined,

    status: "submitted",
    submittedAt: now,
  };

  reviews.push(review);

  // Local demonstration when both review records exist.
  publishCompletedReviewPair(connectionId);

  saveLocalReviews();
  publishReviewChange();

  return delay(undefined);
}

// Reviews still awaiting publication.
export function getPendingReviews(): Promise<
  PendingReview[]
> {
  const list: PendingReview[] = [];

  for (const connection of connections) {
    if (
      connection.status !== "review_open" ||
      !connection.userIds.includes(
        CURRENT_USER_ID
      ) ||
      !connection.reviewDeadline
    ) {
      continue;
    }

    const roommate = getOtherRoommate(
      connection
    );

    if (!roommate) continue;

    const connectionReviews = reviews.filter(
      (review) =>
        review.connectionId === connection.id &&
        review.status !== "hidden"
    );

    const youSubmitted =
      connectionReviews.some(
        (review) =>
          review.reviewerId === CURRENT_USER_ID
      );

    const deadlineTime = new Date(
      connection.reviewDeadline
    ).getTime();

    const expired =
      !Number.isFinite(deadlineTime) ||
      Date.now() >= deadlineTime;

    const allSubmitted = connection.userIds.every(
      (id) =>
        connectionReviews.some(
          (review) =>
            review.reviewerId === id
        )
    );

    if (expired || allSubmitted) {
      continue;
    }

    list.push({
      connectionId: connection.id,
      roommate,
      daysLeft: getDaysRemaining(
        connection.reviewDeadline
      ),
      submittedCount:
        connectionReviews.length,
      youSubmitted,
    });
  }

  return delay(list);
}

// Published reviews written by the current user.
export function getMyPublishedReviews(): Promise<
  (Review & { reviewedUser: User })[]
> {
  const list = reviews
    .filter(
      (review) =>
        review.status === "published" &&
        review.reviewerId === CURRENT_USER_ID
    )
    .map((review) => ({
      ...review,
      reviewedUser:
        users[review.reviewedUserId],
    }));

  return delay(list);
}

function withReviewPeople(
  review: Review
): PublishedReview {
  return {
    ...review,
    reviewer: users[review.reviewerId],
    reviewedUser:
      users[review.reviewedUserId],
  };
}

// Published reviews about the current user.
export function getReviewsAboutMe(): Promise<
  PublishedReview[]
> {
  const list = reviews
    .filter(
      (review) =>
        review.status === "published" &&
        review.reviewedUserId === CURRENT_USER_ID
    )
    .map(withReviewPeople);

  return delay(list);
}

// Published reviews written by the current user.
export function getReviewsByMe(): Promise<
  PublishedReview[]
> {
  const list = reviews
    .filter(
      (review) =>
        review.status === "published" &&
        review.reviewerId === CURRENT_USER_ID
    )
    .map(withReviewPeople);

  return delay(list);
}

// Mock reporting until Firebase is connected.
export function reportReview(
  reviewId: string,
  reason: string
): Promise<void> {
  void reviewId;
  void reason;

  return delay(undefined);
}

// Dashboard

export function getDashboardStats() {
  return delay(dashboardStats);
}

export function getRecentActivity(): Promise<
  ActivityItem[]
> {
  return delay(recentActivity);
}


// Send a roommate request from a student profile.
export function sendRoommateRequest(
  receiverId: string,
  message: string
): Promise<void> {
  if (receiverId === CURRENT_USER_ID) {
    return Promise.reject(
      new Error("You cannot send a request to yourself.")
    );
  }

  const studentExists = students.some(
    (student) => student.userId === receiverId
  );

  if (!studentExists) {
    return Promise.reject(
      new Error("This student profile is not available.")
    );
  }

  if (message.trim().length < 10) {
    return Promise.reject(
      new Error("Please write at least 10 characters.")
    );
  }

  const existingRequest = requests.some(
    (request) =>
      request.status === "pending" &&
      (
        (request.senderId === CURRENT_USER_ID &&
          request.receiverId === receiverId) ||
        (request.senderId === receiverId &&
          request.receiverId === CURRENT_USER_ID)
      )
  );

  const existingConnection = connections.some(
    (connection) =>
      connection.status !== "closed" &&
      connection.userIds.includes(CURRENT_USER_ID) &&
      connection.userIds.includes(receiverId)
  );

  if (existingRequest || existingConnection) {
    return Promise.reject(
      new Error(
        "You already have a pending request or connection with this student."
      )
    );
  }

  requests.push({
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    senderId: CURRENT_USER_ID,
    receiverId,
    message: message.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  publishRequestChange();

  return delay(undefined);
}

// Read published reviews only for accepted connections.
// This is a mock authorization check until Firebase is connected.
export function getAuthorizedPublishedReviewsForStudent(
  studentId: string
): Promise<Review[]> {
  const acceptedRequest = requests.some(
    (request) =>
      request.status === "accepted" &&
      (
        (request.senderId === CURRENT_USER_ID &&
          request.receiverId === studentId) ||
        (request.senderId === studentId &&
          request.receiverId === CURRENT_USER_ID)
      )
  );

  const activeConnection = connections.some(
    (connection) =>
      connection.status !== "closed" &&
      connection.userIds.includes(CURRENT_USER_ID) &&
      connection.userIds.includes(studentId)
  );

  if (!acceptedRequest && !activeConnection) {
    return Promise.resolve([]);
  }

  const published = reviews.filter(
    (review) =>
      review.reviewedUserId === studentId &&
      review.status === "published"
  );

  return delay(published);
}