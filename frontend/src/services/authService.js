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

const CSUN_EMAIL_PATTERN = /^[^@\s]+@my\.csun\.edu$/;

function validateCSUNEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!CSUN_EMAIL_PATTERN.test(normalizedEmail)) {
    throw new Error(
      "Only verified CSUN student emails ending in @my.csun.edu are allowed."
    );
  }

  return normalizedEmail;
}

function validateName(name) {
  const normalizedName = String(name || "").trim();

  if (normalizedName.length < 2) {
    throw new Error("Please enter your full name.");
  }

  return normalizedName;
}

function validatePassword(password) {
  if (!password || password.length < 6) {
    throw new Error("Password must contain at least 6 characters.");
  }

  return password;
}

function requireSignedInUser() {
  if (!auth.currentUser) {
    throw new Error("You must be signed in.");
  }

  return auth.currentUser;
}

export async function signUp({ name, email, password }) {
  const normalizedName = validateName(name);
  const normalizedEmail = validateCSUNEmail(email);
  const validPassword = validatePassword(password);

  const account = await createUserWithEmailAndPassword(
    auth,
    normalizedEmail,
    validPassword
  );

  await sendEmailVerification(account.user);

  return {
    user: account.user,
    message:
      "Your account was created. Please verify your @my.csun.edu email before signing in.",
  };
}

export async function signIn({ email, password }) {
  const normalizedEmail = validateCSUNEmail(email);
  const validPassword = validatePassword(password);

  const account = await signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    validPassword
  );

  await reload(account.user);

  if (!account.user.emailVerified) {
    await sendEmailVerification(account.user);
    await signOut(auth);

    throw new Error(
      "Please verify your @my.csun.edu email before signing in."
    );
  }

  return account.user;
}

export async function resendVerificationEmail() {
  const user = requireSignedInUser();

  await sendEmailVerification(user);
}

export async function createUserProfile({
  name,
  bio = "",
  preferences = {},
  avatarColor = "#315C4C",
}) {
  const user = requireSignedInUser();

  await reload(user);

  if (!user.emailVerified) {
    throw new Error(
      "Your @my.csun.edu email must be verified before creating a profile."
    );
  }

  const normalizedName = validateName(name);
  const normalizedBio = String(bio || "").trim();

  if (normalizedBio.length > 2000) {
    throw new Error("Your bio must be 2,000 characters or fewer.");
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      id: user.uid,
      name: normalizedName,
      email: user.email.toLowerCase(),
      verificationStatus: "verified",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  await setDoc(
    doc(db, "profiles", user.uid),
    {
      userId: user.uid,
      displayName: normalizedName,
      bio: normalizedBio,
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