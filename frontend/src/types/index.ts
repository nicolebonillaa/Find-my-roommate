// Types mirror the Firestore collections in the team guide.
// Field names match the backend plan so swapping in Firebase is easy.

export type VerificationStatus = "verified" | "pending";

export interface User {
  id: string;
  name: string;
  email: string; // never display other users' emails
  verificationStatus: VerificationStatus;
  avatarColor: string; // CSS gradient, used by <Avatar />
}

export interface LifestylePreferences {
  noise: string; // e.g. "Quiet on weekdays"
  cleanliness: string; // e.g. "Very important"
  guests: string; // e.g. "With notice"
  sleepSchedule: string; // e.g. "Early bird"
  sharedFood: string; // e.g. "Ask first"
  pets: string; // e.g. "Okay with cats"
}

export interface Profile {
  userId: string;
  bio: string;
  area: string; // e.g. "Matador Village"
  photoUrl?: string;
  tags: string[]; // e.g. ["Quiet", "Clean"]
  preferences: LifestylePreferences;
}

// A student as shown on cards: user + profile merged for the UI.
export interface Student extends Profile {
  user: User;
}

export type RequestStatus = "pending" | "accepted" | "declined" | "ended";

export interface RoommateRequest {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  status: RequestStatus;
  createdAt: string; // ISO string
}

export type ConnectionStatus =
  | "awaiting_confirmation" // accepted, but not both confirmed they lived together
  | "review_open" // both confirmed, review window running
  | "closed"; // window ended

export interface Connection {
  id: string;
  userIds: [string, string];
  confirmedBy: string[]; // userIds who confirmed they lived together
  status: ConnectionStatus;
  reviewDeadline?: string; // ISO string, set once both confirm
}

export type ReviewStatus = "submitted" | "published" | "hidden";

export interface ReviewScores {
  cleanlinessScore: number;
  communicationScore: number;
  noiseScore: number;
  paymentScore: number;
  privacyScore: number;
  responsibilityScore: number;
}

export interface Review extends ReviewScores {
  id: string;
  connectionId: string;
  reviewerId: string;
  reviewedUserId: string;
  positiveComment: string;
  futureRoommateComment?: string;
  status: ReviewStatus;
  submittedAt: string;
  publishedAt?: string;
}

export type ReportStatus = "open" | "hidden" | "dismissed";

// A published review plus the two people involved, for the My reviews page.
export type PublishedReview = Review & { reviewer: User; reviewedUser: User };

export interface Report {
  id: string;
  reviewId: string;
  reporterId: string;
  reason: string;
  explanation: string;
  status: ReportStatus;
}

// One row in the Dashboard "Recent activity" list. `kind` picks the icon.
export type ActivityKind = "accepted" | "published" | "request";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  time: string; // display text for now ("Today, 10:42 AM")
}

// What the "reviews waiting for you" card needs.
export interface PendingReview {
  connectionId: string;
  roommate: User;
  daysLeft: number;
  submittedCount: number; // 0-2, drives the progress bar
  youSubmitted: boolean; // false = it is your turn to write
}