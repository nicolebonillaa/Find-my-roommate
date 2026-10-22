import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { auth, db } from "../firebase";

function requireUser() {
  if (!auth.currentUser) {
    throw new Error("You must be signed in.");
  }

  return auth.currentUser;
}

function createConnectionId(userA, userB) {
  return [userA, userB].sort().join("_");
}

export async function sendRoommateRequest(receiverId, message = "") {
  const user = requireUser();

  if (!receiverId) {
    throw new Error("A receiver is required.");
  }

  if (receiverId === user.uid) {
    throw new Error("You cannot send a request to yourself.");
  }

  const existingQuery = query(
    collection(db, "requests"),
    where("senderId", "==", user.uid)
  );

  const existingSnapshot = await getDocs(existingQuery);

  const duplicateRequest = existingSnapshot.docs.some((requestDoc) => {
    const request = requestDoc.data();

    return (
      request.receiverId === receiverId &&
      request.status === "pending"
    );
  });

  if (duplicateRequest) {
    throw new Error("A pending request already exists.");
  }

  const requestReference = await addDoc(collection(db, "requests"), {
    senderId: user.uid,
    receiverId,
    message: message.trim(),
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return {
    id: requestReference.id,
    status: "pending",
  };
}

export async function getIncomingRequests() {
  const user = requireUser();

  const requestsQuery = query(
    collection(db, "requests"),
    where("receiverId", "==", user.uid)
  );

  const snapshot = await getDocs(requestsQuery);

  return snapshot.docs.map((requestDoc) => ({
    id: requestDoc.id,
    ...requestDoc.data(),
  }));
}

export async function getOutgoingRequests() {
  const user = requireUser();

  const requestsQuery = query(
    collection(db, "requests"),
    where("senderId", "==", user.uid)
  );

  const snapshot = await getDocs(requestsQuery);

  return snapshot.docs.map((requestDoc) => ({
    id: requestDoc.id,
    ...requestDoc.data(),
  }));
}

export async function respondToRequest(requestId, response) {
  const user = requireUser();

  if (!["accepted", "declined"].includes(response)) {
    throw new Error("Response must be accepted or declined.");
  }

  const requestReference = doc(db, "requests", requestId);
  const requestSnapshot = await getDoc(requestReference);

  if (!requestSnapshot.exists()) {
    throw new Error("Roommate request was not found.");
  }

  const roommateRequest = requestSnapshot.data();

  if (roommateRequest.receiverId !== user.uid) {
    throw new Error("Only the receiver can respond to this request.");
  }

  if (roommateRequest.status !== "pending") {
    throw new Error("This request has already been handled.");
  }

  const batch = writeBatch(db);

  batch.update(requestReference, {
    status: response,
    respondedAt: serverTimestamp(),
  });

  if (response === "accepted") {
    const connectionId = createConnectionId(
      roommateRequest.senderId,
      roommateRequest.receiverId
    );

    batch.set(doc(db, "connections", connectionId), {
      id: connectionId,
      userIds: [
        roommateRequest.senderId,
        roommateRequest.receiverId,
      ],
      confirmedBy: [],
      status: "awaiting_confirmation",
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();

  return {
    requestId,
    status: response,
  };
}

export async function cancelOutgoingRequest(requestId) {
  const user = requireUser();

  const requestReference = doc(db, "requests", requestId);
  const requestSnapshot = await getDoc(requestReference);

  if (!requestSnapshot.exists()) {
    throw new Error("Roommate request was not found.");
  }

  const roommateRequest = requestSnapshot.data();

  if (roommateRequest.senderId !== user.uid) {
    throw new Error("Only the sender can cancel this request.");
  }

  if (roommateRequest.status !== "pending") {
    throw new Error("Only pending requests can be canceled.");
  }

  await updateDoc(requestReference, {
    status: "ended",
    endedAt: serverTimestamp(),
  });
}