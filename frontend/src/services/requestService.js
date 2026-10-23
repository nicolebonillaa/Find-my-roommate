import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
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

export async function sendRoommateRequest(
  receiverId,
  message = ""
) {
  const user = requireUser();

  if (!receiverId) {
    throw new Error("A receiver is required.");
  }

  if (receiverId === user.uid) {
    throw new Error("You cannot send a request to yourself.");
  }

  const trimmedMessage = String(message || "").trim();

  if (trimmedMessage.length > 500) {
    throw new Error("Your message must be 500 characters or fewer.");
  }

  const outgoingQuery = query(
    collection(db, "requests"),
    where("senderId", "==", user.uid),
    where("receiverId", "==", receiverId),
    where("status", "==", "pending")
  );

  const incomingQuery = query(
    collection(db, "requests"),
    where("senderId", "==", receiverId),
    where("receiverId", "==", user.uid),
    where("status", "==", "pending")
  );

  const [outgoingSnapshot, incomingSnapshot] = await Promise.all([
    getDocs(outgoingQuery),
    getDocs(incomingQuery),
  ]);

  if (!outgoingSnapshot.empty) {
    throw new Error("A pending request already exists.");
  }

  if (!incomingSnapshot.empty) {
    throw new Error(
      "This student already sent you a pending request."
    );
  }

  const requestReference = await addDoc(
    collection(db, "requests"),
    {
      senderId: user.uid,
      receiverId,
      message: trimmedMessage,
      status: "pending",
      createdAt: serverTimestamp(),
    }
  );

  return {
    id: requestReference.id,
    senderId: user.uid,
    receiverId,
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

export async function respondToRequest(
  requestId,
  response
) {
  const user = requireUser();

  if (!["accepted", "declined"].includes(response)) {
    throw new Error(
      "Response must be accepted or declined."
    );
  }

  const requestReference = doc(db, "requests", requestId);

  return runTransaction(db, async (transaction) => {
    const requestSnapshot = await transaction.get(
      requestReference
    );

    if (!requestSnapshot.exists()) {
      throw new Error("Roommate request was not found.");
    }

    const roommateRequest = requestSnapshot.data();

    if (roommateRequest.receiverId !== user.uid) {
      throw new Error(
        "Only the receiver can respond to this request."
      );
    }

    if (roommateRequest.status !== "pending") {
      throw new Error(
        "This request has already been handled."
      );
    }

    const updateData = {
      status: response,
      respondedAt: serverTimestamp(),
    };

    transaction.update(requestReference, updateData);

    if (response === "declined") {
      return {
        requestId,
        status: response,
      };
    }

    const connectionId = createConnectionId(
      roommateRequest.senderId,
      roommateRequest.receiverId
    );

    const connectionReference = doc(
      db,
      "connections",
      connectionId
    );

    const connectionSnapshot = await transaction.get(
      connectionReference
    );

    if (connectionSnapshot.exists()) {
      throw new Error(
        "An active roommate connection already exists."
      );
    }

    transaction.set(connectionReference, {
      id: connectionId,
      requestId,
      userIds: [
        roommateRequest.senderId,
        roommateRequest.receiverId,
      ],
      confirmedBy: [],
      status: "awaiting_confirmation",
      createdAt: serverTimestamp(),
    });

    return {
      requestId,
      connectionId,
      status: response,
    };
  });
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
    throw new Error(
      "Only the sender can cancel this request."
    );
  }

  if (roommateRequest.status !== "pending") {
    throw new Error(
      "Only pending requests can be canceled."
    );
  }

  await updateDoc(requestReference, {
    status: "ended",
    endedAt: serverTimestamp(),
  });

  return {
    success: true,
    requestId,
    status: "ended",
  };
}