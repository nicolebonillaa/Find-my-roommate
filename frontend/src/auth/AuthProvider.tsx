
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { User as FirebaseUser } from "firebase/auth";

import type {
  Student,
  User,
  LifestylePreferences,
} from "../types";

import {
  observeAuthState,
  createUserProfile,
} from "../services/authService";

import {
  getMyProfile as getFirebaseProfile,
} from "../services/profileService";

import { auth } from "../firebase";

interface AuthValue {
  user: User | null;
  profile: Student | null;
  loading: boolean;
  updateProfile: (profile: Student) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/* Default lifestyle preferences */

const emptyPreferences: LifestylePreferences = {
  noise: "Not specified",
  cleanliness: "Not specified",
  guests: "Not specified",
  sleepSchedule: "Not specified",
  sharedFood: "Not specified",
  pets: "Not specified",
};

/* Load the signed-in student's profile */

async function loadStudent(
  firebaseUser: FirebaseUser
): Promise<Student> {
  let result = await getFirebaseProfile();

  /* Create the profile after email verification */

  if (!result.user || !result.profile) {
    await createUserProfile({
      name:
        firebaseUser.displayName ||
        firebaseUser.email?.split("@")[0] ||
        "CSUN Student",
    });

    result = await getFirebaseProfile();
  }

  const account = result.user as {
    name?: string;
    email?: string;
    verificationStatus?: string;
  } | null;

  const details = result.profile as {
    displayName?: string;
    bio?: string;
    area?: string;
    photoUrl?: string;
    tags?: string[];
    avatarColor?: string;
    preferences?: Partial<LifestylePreferences>;
  } | null;

  const user: User = {
    id: firebaseUser.uid,

    name:
      details?.displayName ||
      account?.name ||
      firebaseUser.displayName ||
      "CSUN Student",

    email: firebaseUser.email || "",
    verificationStatus: "verified",

    avatarColor:
      details?.avatarColor || "#315C4C",
  };

  return {
    userId: firebaseUser.uid,
    user,
    bio: details?.bio || "",
    area: details?.area || "",
    photoUrl: details?.photoUrl,
    tags: details?.tags || [],

    preferences: {
      ...emptyPreferences,
      ...details?.preferences,
    },
  };
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [profile, setProfile] =
    useState<Student | null>(null);

  const [loading, setLoading] = useState(true);

  /* Refresh the current Firebase profile */

  async function refreshProfile() {
    const current = auth.currentUser;

    if (
      !current ||
      !current.emailVerified ||
      !current.email
        ?.toLowerCase()
        .endsWith("@my.csun.edu")
    ) {
      setUser(null);
      setProfile(null);
      return;
    }

    const student = await loadStudent(current);

    setProfile(student);
    setUser(student.user);
  }

  /* Listen for Firebase authentication changes */

  useEffect(() => {
    let active = true;

    const unsubscribe = observeAuthState(
      async (firebaseUser: FirebaseUser | null) => {
        if (!active) return;

        setLoading(true);

        if (
          !firebaseUser ||
          !firebaseUser.emailVerified ||
          !firebaseUser.email
            ?.toLowerCase()
            .endsWith("@my.csun.edu")
        ) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        try {
          const student = await loadStudent(firebaseUser);

          if (active) {
            setProfile(student);
            setUser(student.user);
          }
        } catch (error) {
          console.error(
            "Could not load Firebase profile:",
            error
          );

          if (active) {
            setUser(null);
            setProfile(null);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  /* Update the shared profile in React */

  function updateProfile(updatedProfile: Student) {
    setProfile(updatedProfile);
    setUser(updatedProfile.user);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* Access the shared authentication context */

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}