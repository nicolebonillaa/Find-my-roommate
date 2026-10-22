import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
  reload,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function validateCSUNEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail.endsWith("@csun.edu")) {
    throw new Error("Only verified CSUN student emails are allowed.");
  }

  return normalizedEmail;
}

export async function signUp({ name, email, password }) {
  if (!name || name.trim().length < 2) {
    throw new Error("Please enter your full name.");
  }

  if (!password || password.length < 6) {
    throw new Error("Password must contain at least 6 characters.");
  }

  const normalizedEmail = validateCSUNEmail(email);

  const account = await createUserWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );

  await sendEmailVerification(account.user);

  return {
    user: account.user,
    message: "Please verify your CSUN email before signing in.",
  };
}

export async function signIn({ email, password }) {
  const normalizedEmail = validateCSUNEmail(email);

  const account = await signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );

  await reload(account.user);

  if (!account.user.emailVerified) {
    await sendEmailVerification(account.user);
    await signOut(auth);

    throw new Error(
      "Please verify your CSUN email before signing in."
    );
  }

  return account.user;
}

export async function resendVerificationEmail() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No signed-in user was found.");
  }

  await sendEmailVerification(user);
}

export async function createUserProfile({
  name,
  bio = "",
  preferences = {},
  avatarColor = "#315C4C",
}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be signed in.");
  }

  await reload(user);

  if (!user.emailVerified) {
    throw new Error("Your CSUN email must be verified first.");
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      id: user.uid,
      name: name.trim(),
      email: user.email,
      verificationStatus: "verified",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(db, "profiles", user.uid),
    {
      userId: user.uid,
      displayName: name.trim(),
      bio,
      preferences,
      avatarColor,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export function observeAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function signOutUser() {
  await signOut(auth);
}