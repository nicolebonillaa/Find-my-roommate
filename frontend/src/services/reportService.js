import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

const allowedReasons = [
  "harassment",
  "false_information",
  "discrimination",
  "inappropriate_content",
  "other",
];

function requireUser() {
  if (!auth.currentUser) {
    throw new Error("You must be signed in.");
  }

  return auth.currentUser;
}

export async function reportReview({
  reviewId,
  reason,
  explanation = "",
}) {
  const user = requireUser();

  if (!reviewId) {
    throw new Error("A review is required.");
  }

  if (!allowedReasons.includes(reason)) {
    throw new Error("Please select a valid report reason.");
  }

  if (explanation.trim().length < 5) {
    throw new Error("Please provide more details.");
  }

  const reportReference = await addDoc(
    collection(db, "reports"),
    {
      reviewId,
      reporterId: user.uid,
      reason,
      explanation: explanation.trim(),
      status: "open",
      createdAt: serverTimestamp(),
    }
  );

  return {
    id: reportReference.id,
    status: "open",
  };
}