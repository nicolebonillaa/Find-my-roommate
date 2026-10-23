
import type { LifestylePreferences } from "../types";

export interface FirebaseAccountRecord {
  name?: string;
  email?: string;
  verificationStatus?: string;
}

export interface FirebaseProfileRecord {
  id?: string;
  userId?: string;
  displayName?: string;
  bio?: string;
  area?: string;
  photoUrl?: string;
  tags?: string[];
  avatarColor?: string;
  preferences?: Partial<LifestylePreferences>;
}

export function getMyProfile(): Promise<{
  user: FirebaseAccountRecord | null;
  profile: FirebaseProfileRecord | null;
}>;

export function updateMyProfile(
  data: FirebaseProfileRecord
): Promise<void>;

export function getStudents(): Promise<FirebaseProfileRecord[]>;

export function getStudent(
  studentId: string
): Promise<FirebaseProfileRecord>;