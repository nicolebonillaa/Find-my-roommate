import type {
  ActivityItem,
  Connection,
  PendingReview,
  Review,
  RoommateRequest,
  Student,
  User,
} from "../types/index";

// Fake data matching the designs. Replace with Firebase later.

export const users: Record<string, User> = {
  maya: {
    id: "maya",
    name: "Maya Rivera",
    email: "maya.rivera@my.csun.edu",
    verificationStatus: "verified",
    avatarColor: "linear-gradient(135deg, #f7a35c, #e8795f)",
  },
  alex: {
    id: "alex",
    name: "Alex Rivera",
    email: "alex.rivera@my.csun.edu",
    verificationStatus: "verified",
    avatarColor: "linear-gradient(135deg, #a5b4fc, #818cf8)",
  },
  jordan: {
    id: "jordan",
    name: "Jordan Smith",
    email: "jordan.smith@my.csun.edu",
    verificationStatus: "verified",
    avatarColor: "linear-gradient(135deg, #f7a35c, #e8795f)",
  },
  kayla: {
    id: "kayla",
    name: "Kayla Martinez",
    email: "kayla.martinez@my.csun.edu",
    verificationStatus: "verified",
    avatarColor: "linear-gradient(135deg, #6fd3a0, #3fae7a)",
  },
  diego: {
    id: "diego",
    name: "Diego Nguyen",
    email: "diego.nguyen@my.csun.edu",
    verificationStatus: "verified",
    avatarColor: "linear-gradient(135deg, #b794f6, #8b5cf6)",
  },
  priya: {
    id: "priya",
    name: "Priya Shah",
    email: "priya.shah@my.csun.edu",
    verificationStatus: "verified",
    avatarColor: "linear-gradient(135deg, #f58fb1, #d9487d)",
  },
};

export const CURRENT_USER_ID = "maya";

export const students: Student[] = [
  {
    userId: "jordan",
    user: users.jordan,
    bio: "Quiet on weekdays, guests with notice.",
    area: "Matador Village",
    tags: ["Quiet", "Clean", "Reliable"],
    preferences: {
      noise: "Quiet",
      cleanliness: "Very important",
      guests: "With notice",
      sleepSchedule: "Early bird",
      sharedFood: "Ask first",
      pets: "No pets",
    },
  },
  {
    userId: "kayla",
    user: users.kayla,
    bio: "Friendly and organized, flexible on noise.",
    area: "North Hills",
    tags: ["Friendly", "Organized", "Flexible"],
    preferences: {
      noise: "Flexible",
      cleanliness: "Very important",
      guests: "Ask first",
      sleepSchedule: "Night owl",
      sharedFood: "Share okay",
      pets: "Okay with cats",
    },
  },
  {
    userId: "diego",
    user: users.diego,
    bio: "Early riser, respectful of shared space.",
    area: "Reseda",
    tags: ["Early riser", "Respectful", "Student"],
    preferences: {
      noise: "Quiet",
      cleanliness: "Moderate",
      guests: "With notice",
      sleepSchedule: "Early bird",
      sharedFood: "Ask first",
      pets: "No pets",
    },
  },
];

// The logged-in user's own profile (Maya).
export const myProfile: Student = {
  userId: "maya",
  user: users.maya,
  bio: "Computer Science student at CSUN. I like a clean shared space, clear communication, and a calm home during the week.",
  area: "Northridge",
  tags: [],
  preferences: {
    cleanliness: "Very important",
    noise: "Quiet on weekdays",
    guests: "With notice",
    sleepSchedule: "Early bird",
    sharedFood: "Ask first",
    pets: "Okay with cats",
  },
};

export const requests: RoommateRequest[] = [
  {
    id: "req1",
    senderId: "jordan",
    receiverId: "maya",
    message: "I think we lived in the same apartment complex.",
    status: "pending",
    createdAt: "2026-10-12T14:11:00",
  },
  {
    id: "req2",
    senderId: "priya",
    receiverId: "maya",
    message: "Would you like to connect and exchange roommate reviews?",
    status: "pending",
    createdAt: "2026-10-13T09:30:00",
  },
];

export const connections: Connection[] = [
  {
    id: "conn1",
    userIds: ["maya", "alex"],
    confirmedBy: ["maya", "alex"],
    status: "review_open",
    reviewDeadline: "2026-10-21T23:59:00",
  },
];

// A published review about Maya's roommate (shown in My reviews).
export const reviews: Review[] = [
  {
    id: "rev1",
    connectionId: "conn0",
    reviewerId: "maya",
    reviewedUserId: "alex",
    cleanlinessScore: 4.5,
    communicationScore: 4.0,
    noiseScore: 3.5,
    paymentScore: 5.0,
    privacyScore: 4.0,
    responsibilityScore: 4.5,
    positiveComment: "Alex was reliable with bills and respectful of my belongings.",
    status: "published",
    submittedAt: "2026-10-14T16:20:00",
    publishedAt: "2026-10-15T16:20:00",
  },
];

export const pendingReviews: PendingReview[] = [
  {
    connectionId: "conn1",
    roommate: users.alex,
    daysLeft: 4,
    submittedCount: 1,
  },
];

export const dashboardStats = {
  profileViews: { value: 24, note: "+8 this week" },
  pendingRequests: { value: 2, note: "1 needs your reply" },
  publishedReviews: { value: 3, note: "From verified roommates" },
  trustScore: { value: 4.8, note: "Based on your history" },
};

export const recentActivity: ActivityItem[] = [
  { id: "a1", kind: "accepted", title: "Alex accepted your request", time: "Today, 10:42 AM" },
  { id: "a2", kind: "published", title: "Your review was published", time: "Yesterday, 4:20 PM" },
  { id: "a3", kind: "request", title: "Jordan sent you a request", time: "Monday, 2:11 PM" },
];