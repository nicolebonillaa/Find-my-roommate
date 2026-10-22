import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { Student, User } from "../types";

import { getCurrentUser } from "../services/api";
import { myProfile } from "../data/mock";

interface AuthValue {
  user: User | null;
  profile: Student | null;
  loading: boolean;
  updateProfile: (profile: Student) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [profile, setProfile] = useState<Student>(
    myProfile
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((currentUser) => {
        if (!active) return;

        setUser(currentUser);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
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

  function updateProfile(updatedProfile: Student) {
    setProfile(updatedProfile);

    // Keep the shared user information synchronized.
    setUser(updatedProfile.user);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

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