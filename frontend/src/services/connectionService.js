import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase";

const REVIEW_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function requireUser() {
  if (!auth.currentUser) {
    throw new Error("You must be signed in.");
  }

  return auth.currentUser;
}

function hasUser(connection, userId) {
  return connection.userIds?.includes(userId);
}

export async function getMyConnections() {
  const user = requireUser();

  const connectionsQuery = query(
    collection(db, "connections"),
    where("userIds", "array-contains", user.uid)
  );

  const snapshot = await getDocs(connectionsQuery);

  return snapshot.docs.map((connectionDoc) => ({
    id: connectionDoc.id,
    ...connectionDoc.data(),
  }));
}

export async function getConnection(connectionId) {
  const user = requireUser();

  const connectionSnapshot = await getDoc(
    doc(db, "connections", connectionId)
  );

  if (!connectionSnapshot.exists()) {
    throw new Error("Connection was not found.");
  }

  const connection = connectionSnapshot.data();

  if (!hasUser(connection, user.uid)) {
    throw new Error("You are not part of this connection.");
  }

  return {
    id: connectionSnapshot.id,
    ...connection,
  };
}

export async function confirmLivingTogether(connectionId) {
  const user = requireUser();
  const connectionReference = doc(db, "connections", connectionId);

  return runTransaction(db, async (transaction) => {
    const connectionSnapshot = await transaction.get(
      connectionReference
    );

    if (!connectionSnapshot.exists()) {
      throw new Error("Connection was not found.");
    }

    const connection = connectionSnapshot.data();

    if (!hasUser(connection, user.uid)) {
      throw new Error("You are not part of this connection.");
    }

    if (connection.confirmedBy?.includes(user.uid)) {
      return {
        status: connection.status,
        alreadyConfirmed: true,
      };
    }

    const confirmedBy = [
      ...(connection.confirmedBy || []),
      user.uid,
    ];

    const bothConfirmed =
      confirmedBy.length === connection.userIds.length;

    const updateData = {
      confirmedBy: arrayUnion(user.uid),
    };

    if (bothConfirmed && !connection.reviewDeadline) {
      updateData.status = "review_open";
      updateData.reviewDeadline = Timestamp.fromMillis(
        Date.now() + REVIEW_DURATION_MS
      );
    }

    transaction.update(connectionReference, updateData);

    return {
      status: bothConfirmed
        ? "review_open"
        : "awaiting_confirmation",
      confirmedBy,
      deadlineCreated: bothConfirmed,
    };
  });
}

export async function endRoommateConnection(connectionId) {
  const user = requireUser();
  const connectionReference = doc(db, "connections", connectionId);

  const connectionSnapshot = await getDoc(connectionReference);

  if (!connectionSnapshot.exists()) {
    throw new Error("Connection was not found.");
  }

  const connection = connectionSnapshot.data();

  if (!hasUser(connection, user.uid)) {
    throw new Error("You are not part of this connection.");
  }

  const updateData = {
    endedBy: user.uid,
    endedAt: Timestamp.now(),
  };

  // Preserve the review window if it has already opened.
  if (!connection.reviewDeadline) {
    updateData.status = "closed";
  }

  await updateDoc(connectionReference, updateData);

  return {
    success: true,
    reviewWindowPreserved: Boolean(connection.reviewDeadline),
  };
}

export async function getOtherRoommate(connectionId) {
  const user = requireUser();
  const connection = await getConnection(connectionId);

  const otherUserId = connection.userIds.find(
    (userId) => userId !== user.uid
  );

  if (!otherUserId) {
    throw new Error("The other roommate was not found.");
  }

  const profileSnapshot = await getDoc(
    doc(db, "profiles", otherUserId)
  );

  if (!profileSnapshot.exists()) {
    throw new Error("The other roommate profile was not found.");
  }

  return {
    id: profileSnapshot.id,
    ...profileSnapshot.data(),
  };
}

export function getDaysRemaining(reviewDeadline) {
  if (!reviewDeadline) {
    return 0;
  }

  const deadlineDate = reviewDeadline.toDate
    ? reviewDeadline.toDate()
    : new Date(reviewDeadline);

  const difference =
    deadlineDate.getTime() - Date.now();

  return Math.max(
    0,
    Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    )
  );
}