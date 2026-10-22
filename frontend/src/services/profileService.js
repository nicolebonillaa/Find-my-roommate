import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function requireUser() {
  if (!auth.currentUser) {
    throw new Error("You must be signed in.");
  }

  return auth.currentUser;
}

export async function getMyProfile() {
  const user = requireUser();

  const [userSnapshot, profileSnapshot] = await Promise.all([
    getDoc(doc(db, "users", user.uid)),
    getDoc(doc(db, "profiles", user.uid)),
  ]);

  return {
    user: userSnapshot.exists() ? userSnapshot.data() : null,
    profile: profileSnapshot.exists() ? profileSnapshot.data() : null,
  };
}

export async function updateMyProfile(profileData) {
  const user = requireUser();

  const allowedProfile = {
    displayName: profileData.displayName || "",
    bio: profileData.bio || "",
    preferences: profileData.preferences || {},
    avatarColor: profileData.avatarColor || "#315C4C",
    updatedAt: serverTimestamp(),
  };

  await setDoc(
    doc(db, "profiles", user.uid),
    {
      userId: user.uid,
      ...allowedProfile,
    },
    { merge: true }
  );
}

export async function getStudents() {
  const user = requireUser();

  const snapshot = await getDocs(collection(db, "profiles"));

  return snapshot.docs
    .filter((profileDoc) => profileDoc.id !== user.uid)
    .map((profileDoc) => ({
      id: profileDoc.id,
      ...profileDoc.data(),
    }));
}

export async function getStudent(studentId) {
  requireUser();

  const profileSnapshot = await getDoc(
    doc(db, "profiles", studentId)
  );

  if (!profileSnapshot.exists()) {
    throw new Error("Student profile was not found.");
  }

  return {
    id: profileSnapshot.id,
    ...profileSnapshot.data(),
  };
}