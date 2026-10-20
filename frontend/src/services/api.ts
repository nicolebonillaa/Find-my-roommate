
import { useSyncExternalStore } from "react";

import {
  CURRENT_USER_ID,
  connections,
  dashboardStats,
  myProfile,
  pendingReviews,
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
  Review,
  RoommateRequest,
  Student,
  User,
} from "../types";

const delay = <T,>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// Existing profile and dashboard services

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
  return delay(students.find((s) => s.userId === id));
}

export function getPendingReviews(): Promise<PendingReview[]> {
  return delay(pendingReviews);
}

export function getMyPublishedReviews(): Promise<
  (Review & { reviewedUser: User })[]
> {
  const list = reviews
    .filter((r) => r.status === "published")
    .map((r) => ({
      ...r,
      reviewedUser: users[r.reviewedUserId],
    }));

  return delay(list);
}

export function getDashboardStats() {
  return delay(dashboardStats);
}

export function getRecentActivity(): Promise<ActivityItem[]> {
  return delay(recentActivity);
}

// Shared mock request state.
// Uses the existing arrays from mock.ts.
//
// The snapshot is replaced after changes so React
// can update Requests and Topbar together.

export interface RequestSnapshot {
  requests: RoommateRequest[];
  connections: Connection[];
}

const listeners = new Set<() => void>();

function makeSnapshot(): RequestSnapshot {
  return {
    requests: requests.map((r) => ({ ...r })),
    connections: connections.map((c) => ({
      ...c,
      confirmedBy: [...c.confirmedBy],
    })),
  };
}

let snapshot = makeSnapshot();

function subscribeRequests(callback: () => void) {
  listeners.add(callback);

  return () => {
    listeners.delete(callback);
  };
}

function getRequestSnapshot() {
  return snapshot;
}

function publishRequestChanges() {
  snapshot = makeSnapshot();
  listeners.forEach((callback) => callback());
}

export function useRequestData(): RequestSnapshot {
  return useSyncExternalStore(
    subscribeRequests,
    getRequestSnapshot,
    getRequestSnapshot
  );
}

// Existing incoming request service, preserved.

export function getIncomingRequests(): Promise<
  (RoommateRequest & { sender: User })[]
> {
  const list = requests
    .filter(
      (r) =>
        r.receiverId === CURRENT_USER_ID &&
        r.status === "pending"
    )
    .map((r) => ({
      ...r,
      sender: users[r.senderId],
    }));

  return delay(list);
}

// Accept or decline an incoming request.

export function respondToRequest(
  id: string,
  action: "accepted" | "declined"
): Promise<void> {
  const req = requests.find(
    (r) =>
      r.id === id &&
      r.receiverId === CURRENT_USER_ID &&
      r.status === "pending"
  );

  if (!req) {
    return Promise.reject(
      new Error("This request is no longer available.")
    );
  }

  req.status = action;

  if (action === "accepted") {
    const connectionId = `connection-${req.id}`;

    if (!connections.some((c) => c.id === connectionId)) {
      connections.push({
        id: connectionId,
        userIds: [req.senderId, req.receiverId],
        confirmedBy: [],
        status: "awaiting_confirmation",
      });
    }
  }

  publishRequestChanges();

  return delay(undefined);
}

// Cancel one of Maya's outgoing requests.

export function cancelOutgoingRequest(id: string) {
  const req = requests.find(
    (r) =>
      r.id === id &&
      r.senderId === CURRENT_USER_ID &&
      r.status === "pending"
  );

  if (!req) return;

  req.status = "ended";
  publishRequestChanges();
}

// Confirm that Maya lived with this roommate.

export function confirmLivingTogether(id: string) {
  const conn = connections.find(
    (c) =>
      c.id === id &&
      c.userIds.includes(CURRENT_USER_ID) &&
      c.status === "awaiting_confirmation"
  );

  if (!conn) return;

  if (!conn.confirmedBy.includes(CURRENT_USER_ID)) {
    conn.confirmedBy.push(CURRENT_USER_ID);
  }

  if (conn.userIds.every((id) => conn.confirmedBy.includes(id))) {
    conn.status = "review_open";

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);

    conn.reviewDeadline = deadline.toISOString();
  }

  publishRequestChanges();
}

// End a connection outside an active review window.
// An open review window is left intact.

export function endRoommateConnection(id: string): boolean {
  const conn = connections.find(
    (c) =>
      c.id === id &&
      c.userIds.includes(CURRENT_USER_ID)
  );

  if (!conn || conn.status !== "awaiting_confirmation") {
    return false;
  }

  conn.status = "closed";
  publishRequestChanges();
  return true;
}

// Helpers used by Requests and Topbar.

export function getOtherRoommate(
  connection: Connection
): User | undefined {
  const otherId = connection.userIds.find(
    (id) => id !== CURRENT_USER_ID
  );

  return otherId ? users[otherId] : undefined;
}

export function getDaysRemaining(
  deadline?: string
): number {
  if (!deadline) return 7;

  return Math.max(
    0,
    Math.ceil(
      (new Date(deadline).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    )
  );
}

// Mockup testing buttons.
// These simulate actions by another student.
// Remove before connecting the real backend.

export function simulateOtherConfirmation() {
  const conn = connections.find(
    (c) =>
      c.status === "awaiting_confirmation" &&
      c.confirmedBy.includes(CURRENT_USER_ID) &&
      !c.userIds.every((id) => c.confirmedBy.includes(id))
  );

  if (!conn) return false;

  const otherId = conn.userIds.find(
    (id) => id !== CURRENT_USER_ID
  );

  if (!otherId) return false;

  conn.confirmedBy.push(otherId);
  conn.status = "review_open";

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 7);
  conn.reviewDeadline = deadline.toISOString();

  publishRequestChanges();
  return true;
}

export function simulateSentAccepted() {
  const req = requests.find(
    (r) =>
      r.senderId === CURRENT_USER_ID &&
      r.status === "pending"
  );

  if (!req) return false;

  req.status = "accepted";

  connections.push({
    id: `connection-${req.id}`,
    userIds: [req.senderId, req.receiverId],
    confirmedBy: [],
    status: "awaiting_confirmation",
  });

  publishRequestChanges();
  return true;
}

export function simulateSentDeclined() {
  const pending = requests.filter(
    (r) =>
      r.senderId === CURRENT_USER_ID &&
      r.status === "pending"
  );

  const last = pending[pending.length - 1];

  if (!last) return false;

  last.status = "declined";
  publishRequestChanges();
  return true;
}
