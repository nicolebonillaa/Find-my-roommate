
import type {
  User as FirebaseUser,
  Unsubscribe,
} from "firebase/auth";

export function signUp(args: {
  name: string;
  email: string;
  password: string;
}): Promise<{
  user: FirebaseUser;
  message: string;
}>;

export function signIn(args: {
  email: string;
  password: string;
}): Promise<FirebaseUser>;

export function createUserProfile(args: {
  name: string;
  bio?: string;
  preferences?: Record<string, string>;
  avatarColor?: string;
}): Promise<void>;

export function resendVerificationEmail(): Promise<void>;

export function observeAuthState(
  callback: (user: FirebaseUser | null) => void
): Unsubscribe;

export function getCurrentUser(): FirebaseUser | null;

export function signOutUser(): Promise<void>;