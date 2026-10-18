import {
  CURRENT_USER_ID,
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
  PendingReview,
  Review,
  RoommateRequest,
  Student,
  User,
} from "../types";

const delay = <T,>(value: T, ms = 150): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

export function getCurrentUser(): Promise<User> {
  return delay(users[CURRENT_USER_ID]);
}

export function getMyProfile(): Promise<Student> {
  return delay(myProfile);
}

export function getStudents(): Promise<Student[]> {
  return delay(students);
}

export function getStudent(id: string): Promise<Student | undefined> {
  return delay(students.find((s) => s.userId === id));
}

export function getIncomingRequests(): Promise<
  (RoommateRequest & { sender: User })[]
> {
  const list = requests
    .filter((r) => r.receiverId === CURRENT_USER_ID && r.status === "pending")
    .map((r) => ({ ...r, sender: users[r.senderId] }));
  return delay(list);
}

export function respondToRequest(
  id: string,
  action: "accepted" | "declined"
): Promise<void> {
  const req = requests.find((r) => r.id === id);
  if (req) req.status = action;
  return delay(undefined);
}

export function getPendingReviews(): Promise<PendingReview[]> {
  return delay(pendingReviews);
}

export function getMyPublishedReviews(): Promise<
  (Review & { reviewedUser: User })[]
> {
  const list = reviews
    .filter((r) => r.status === "published")
    .map((r) => ({ ...r, reviewedUser: users[r.reviewedUserId] }));
  return delay(list);
}

export function getDashboardStats() {
  return delay(dashboardStats);
}

export function getRecentActivity() {
  return delay(recentActivity);
}
