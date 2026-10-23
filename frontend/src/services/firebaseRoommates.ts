
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  collection,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "../firebase";

import {
  getIncomingRequests,
  getOutgoingRequests,
  sendRoommateRequest,
  respondToRequest,
  cancelOutgoingRequest,
} from "./requestService";

import {
  getMyConnections,
  confirmLivingTogether,
  endRoommateConnection,
} from "./connectionService";

import {
  getStudents as loadFirebaseStudents,
  getStudent as loadFirebaseStudent,
} from "./profileService";

import type {
  Connection,
  LifestylePreferences,
  RoommateRequest,
  Student,
  User,
} from "../types";

const defaultPreferences: LifestylePreferences = {
  cleanliness: "Not specified",
  noise: "Not specified",
  guests: "Not specified",
  sleepSchedule: "Not specified",
  sharedFood: "Not specified",
  pets: "Not specified",
};

interface RawProfile {
  id?: string;
  userId?: string;
  displayName?: string;
  bio?: string;
  avatarColor?: string;
  photoUrl?: string;
  preferences?: Partial<LifestylePreferences>;
}

interface RawRequest {
  id: string;
  senderId: string;
  receiverId: string;
  message?: string;
  status: RoommateRequest["status"];
  createdAt?: unknown;
}

interface RawConnection {
  id: string;
  userIds: string[];
  confirmedBy?: string[];
  status: Connection["status"];
  reviewDeadline?: unknown;
}

export interface RoommateData {
  requests: RoommateRequest[];
  connections: Connection[];
  students: Record<string, User>;
}

/* Convert Firebase timestamps to strings */

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

  return new Date().toISOString();
}

/* Convert Firebase profiles to student data */

function profileToStudent(raw: RawProfile): Student {
  const id = raw.userId || raw.id || "";

  return {
    userId: id,

    user: {
      id,
      name: raw.displayName || "CSUN Student",
      email: "",
      verificationStatus: "verified",
      avatarColor: raw.avatarColor || "#3461e8",
    },

    bio: raw.bio || "",
    area: "",
    photoUrl: raw.photoUrl,
    tags: [],

    preferences: {
      ...defaultPreferences,
      ...raw.preferences,
    },
  };
}

/* Load student profiles from Firebase */

export async function getFirebaseStudents(): Promise<Student[]> {
  const profiles =
    (await loadFirebaseStudents()) as RawProfile[];

  return profiles
    .map(profileToStudent)
    .filter((student) => Boolean(student.userId));
}

/* Load one student profile */

export async function getFirebaseStudent(
  studentId: string
): Promise<Student> {
  const profile = (await loadFirebaseStudent(
    studentId
  )) as RawProfile;

  return profileToStudent(profile);
}

/* Load requests and connections */

export async function loadRoommateData(): Promise<RoommateData> {
  const current = auth.currentUser;

  if (!current || !current.emailVerified) {
    throw new Error(
      "Please sign in with a verified account."
    );
  }

  const [
    incoming,
    outgoing,
    rawConnections,
    profileSnapshot,
  ] = await Promise.all([
    getIncomingRequests() as Promise<RawRequest[]>,
    getOutgoingRequests() as Promise<RawRequest[]>,
    getMyConnections() as Promise<RawConnection[]>,
    getDocs(collection(db, "profiles")),
  ]);

  const requestMap = new Map<
    string,
    RoommateRequest
  >();

  for (const request of [...incoming, ...outgoing]) {
    requestMap.set(request.id, {
      id: request.id,
      senderId: request.senderId,
      receiverId: request.receiverId,
      message: request.message || "",
      status: request.status,
      createdAt: toISO(request.createdAt),
    });
  }

  const connections: Connection[] = rawConnections
    .filter(
      (connection) => connection.userIds.length === 2
    )
    .map((connection) => ({
      id: connection.id,

      userIds: [
        connection.userIds[0],
        connection.userIds[1],
      ],

      confirmedBy: connection.confirmedBy || [],
      status: connection.status,

      reviewDeadline: connection.reviewDeadline
        ? toISO(connection.reviewDeadline)
        : undefined,
    }));

  const students: Record<string, User> = {};

  profileSnapshot.docs.forEach((document) => {
    const student = profileToStudent({
      ...document.data(),
      id: document.id,
    });

    students[student.userId] = student.user;
  });

  return {
    requests: [...requestMap.values()],
    connections,
    students,
  };
}

/* Load and refresh roommate data */

export function useFirebaseRoommates() {
  const [data, setData] = useState<RoommateData>({
    requests: [],
    connections: [],
    students: {},
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Refresh after request actions */

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await loadRoommateData();

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load roommate requests."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* Load data when the page opens */

  useEffect(() => {
    let active = true;

    loadRoommateData()
      .then((result) => {
        if (!active) return;

        setData(result);
        setError("");
      })
      .catch((err) => {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load roommate requests."
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return {
    ...data,
    loading,
    error,
    refresh,
  };
}

/* Firebase request and connection actions */

export const firebaseRequestActions = {
  send: sendRoommateRequest,
  respond: respondToRequest,
  cancel: cancelOutgoingRequest,
  confirm: confirmLivingTogether,
  end: endRoommateConnection,
};

/* Calculate days left for reviews */

export function daysRemaining(
  deadline?: string
): number {
  if (!deadline) return 0;

  const remaining =
    new Date(deadline).getTime() - Date.now();

  return Math.max(
    0,
    Math.ceil(
      remaining / (24 * 60 * 60 * 1000)
    )
  );
}