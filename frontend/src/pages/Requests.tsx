import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, Clock3 } from "lucide-react";

import { useAuth } from "../auth/AuthProvider";

import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

import {
  daysRemaining,
  firebaseRequestActions,
  useFirebaseRoommates,
} from "../services/firebaseRoommates";

import type {
  Connection,
  RoommateRequest,
  User,
} from "../types";

import "../styles/Requests.css";

type Confirmation = {
  id: string;
  kind: "confirm" | "end";
} | null;

export default function Requests() {
  const { user } = useAuth();
  const currentUserId = user?.id || "";

  const {
    requests,
    connections,
    students,
    loading,
    error,
    refresh,
  } = useFirebaseRoommates();

  const location = useLocation();

  const [confirmation, setConfirmation] =
    useState<Confirmation>(null);

  const [toast, setToast] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyAction, setBusyAction] = useState("");

  const busyRef = useRef(false);
  const toastTimer = useRef<number | undefined>(undefined);

  const incoming = requests.filter(
    (request) =>
      request.receiverId === currentUserId &&
      (request.status === "pending" ||
        request.status === "declined")
  );

  const pending = incoming.filter(
    (request) => request.status === "pending"
  );

  const outgoing = requests.filter(
    (request) =>
      request.senderId === currentUserId &&
      request.status === "pending"
  );

  const activeConnections = connections.filter(
    (connection) =>
      connection.userIds.includes(currentUserId) &&
      connection.status !== "closed"
  );

  const actionCount = activeConnections.filter(
    (connection) =>
      connection.status === "awaiting_confirmation" &&
      !connection.confirmedBy.includes(currentUserId)
  ).length;

  /* Clear the toast timer */

  useEffect(() => {
    return () => {
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  /* Scroll to a notification target */

  useEffect(() => {
    const targetId = decodeURIComponent(
      location.hash.replace(/^#/, "")
    );

    if (!targetId) return;

    const timer = window.setTimeout(() => {
      document
        .getElementById(targetId)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [location.hash, requests, connections]);

  function showToast(message: string) {
    setToast(message);
    window.clearTimeout(toastTimer.current);

    toastTimer.current = window.setTimeout(() => {
      setToast("");
    }, 2600);
  }

  /* Run Firebase request actions */

  async function runAction(
    key: string,
    operation: () => Promise<unknown>,
    successMessage: string
  ) {
    if (busyRef.current) return;

    busyRef.current = true;
    setBusyAction(key);
    setActionError("");

    try {
      await operation();
      await refresh();

      showToast(successMessage);
      setConfirmation(null);
    } catch (cause) {
      const code =
        typeof cause === "object" &&
        cause !== null &&
        "code" in cause
          ? String(cause.code)
          : "";

      setActionError(
        code.includes("permission-denied")
          ? "Firebase denied this action. Please check the connection permissions."
          : cause instanceof Error
            ? cause.message
            : "Unable to update your roommate connection."
      );
    } finally {
      busyRef.current = false;
      setBusyAction("");
    }
  }

  function getUser(userId: string): User {
    return (
      students[userId] || {
        id: userId,
        name: "CSUN Student",
        email: "",
        avatarColor: "#3461e8",
        verificationStatus: "verified",
      }
    );
  }

  /* Accept or decline a request */

  function handleAnswer(
    request: RoommateRequest,
    response: "accepted" | "declined"
  ) {
    void runAction(
      `request-${request.id}`,
      () =>
        firebaseRequestActions.respond(
          request.id,
          response
        ),
      response === "accepted"
        ? "Request accepted. You can now confirm your roommate connection."
        : "Roommate request declined."
    );
  }

  /* Incoming requests */

  function renderIncoming(request: RoommateRequest) {
    const sender = getUser(request.senderId);

    return (
      <div
        key={request.id}
        id={`row-${request.id}`}
        className={`request-row${
          request.status === "declined"
            ? " request-row--muted"
            : ""
        }`}
      >
        <Avatar user={sender} size="md" />

        <div className="request-row__info">
          <Link
            className="request-row__name"
            to={`/students/${sender.id}`}
          >
            {sender.name}
          </Link>

          <p className="request-row__text">
            {request.status === "declined"
              ? "Declined. Reviews remain locked."
              : request.message ||
                "Roommate request"}
          </p>
        </div>

        {request.status === "pending" ? (
          <div className="request-row__actions">
            <Button
              variant="secondary"
              size="sm"
              disabled={Boolean(busyAction)}
              onClick={() =>
                handleAnswer(request, "declined")
              }
            >
              Decline
            </Button>

            <Button
              size="sm"
              disabled={Boolean(busyAction)}
              onClick={() =>
                handleAnswer(request, "accepted")
              }
            >
              {busyAction === `request-${request.id}`
                ? "Saving..."
                : "Accept"}
            </Button>
          </div>
        ) : (
          <Badge variant="tag">
            Declined
          </Badge>
        )}
      </div>
    );
  }

  /* Sent requests */

  function renderOutgoing(request: RoommateRequest) {
    const receiver = getUser(request.receiverId);

    return (
      <div
        key={request.id}
        id={`row-${request.id}`}
        className="request-row"
      >
        <Avatar user={receiver} size="md" />

        <div className="request-row__info">
          <Link
            className="request-row__name"
            to={`/students/${receiver.id}`}
          >
            {receiver.name}
          </Link>

          <p className="request-row__text">
            You wrote: {request.message}
          </p>
        </div>

        <div className="request-row__actions">
          <Badge variant="blue">
            <Clock3 size={13} />
            Pending
          </Badge>

          <button
            type="button"
            className="request-row__text-btn"
            disabled={Boolean(busyAction)}
            onClick={() =>
              void runAction(
                `cancel-${request.id}`,
                () =>
                  firebaseRequestActions.cancel(
                    request.id
                  ),
                "Request cancelled."
              )
            }
          >
            {busyAction === `cancel-${request.id}`
              ? "Cancelling..."
              : "Cancel"}
          </button>
        </div>
      </div>
    );
  }

  /* Roommate connections */

  function renderConnection(connection: Connection) {
    const roommateId = connection.userIds.find(
      (id) => id !== currentUserId
    );

    if (!roommateId) return null;

    const roommate = getUser(roommateId);
    const firstName =
      roommate.name.split(" ")[0];

    const meConfirmed =
      connection.confirmedBy.includes(currentUserId);

    const themConfirmed =
      connection.confirmedBy.includes(roommateId);

    const reviewOpen =
      connection.status === "review_open";

    const daysLeft = daysRemaining(
      connection.reviewDeadline
    );

    const deadlineValid = Boolean(
      connection.reviewDeadline &&
      !Number.isNaN(
        new Date(connection.reviewDeadline).getTime()
      )
    );

    const deadlinePassed =
      deadlineValid && daysLeft === 0;

    const confirming =
      confirmation?.id === connection.id &&
      confirmation.kind === "confirm";

    const ending =
      confirmation?.id === connection.id &&
      confirmation.kind === "end";

    const deadlineText = deadlineValid
      ? new Date(
          connection.reviewDeadline!
        ).toLocaleString([], {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "";

    return (
      <div
        key={connection.id}
        id={`row-${connection.id}`}
        className={`request-row${
          reviewOpen
            ? " request-row--highlight"
            : ""
        }`}
      >
        <Avatar user={roommate} size="md" />

        <div className="request-row__info">
          <Link
            className="request-row__name"
            to={`/students/${roommate.id}`}
          >
            {roommate.name}
          </Link>

          {/* Review deadline */}

          {reviewOpen ? (
            <>
              <p className="request-row__text">
                <strong>
                  Both roommates confirmed living together.
                </strong>
              </p>

              <div className="request-row__meta">
                {deadlinePassed ? (
                  <Badge variant="tag">
                    Review deadline passed
                  </Badge>
                ) : (
                  <Badge variant="orange">
                    <Clock3 size={13} />
                    {deadlineValid
                      ? `${daysLeft} ${
                          daysLeft === 1
                            ? "day"
                            : "days"
                        } left`
                      : "Deadline unavailable"}
                  </Badge>
                )}
              </div>

              {deadlineValid && (
                <p className="request-row__text">
                  Review submission deadline:{" "}
                  <strong>
                    {deadlineText}
                  </strong>
                </p>
              )}
            </>
          ) : meConfirmed ? (
            <>
              <p className="request-row__text">
                <strong>
                  <CheckCircle2
                    size={14}
                    style={{
                      verticalAlign: "middle",
                    }}
                  />{" "}
                  You confirmed living together.
                </strong>
              </p>

              <p className="request-row__text">
                Waiting for {firstName} to confirm.
              </p>
            </>
          ) : (
            <>
              <p className="request-row__text">
                {themConfirmed
                  ? `${firstName} confirmed living together. Your confirmation is needed.`
                  : "Request accepted. Both roommates must confirm living together."}
              </p>

              <div className="request-row__meta">
                <Badge variant="blue">
                  Awaiting confirmation
                </Badge>
              </div>
            </>
          )}
        </div>

        <div className="request-row__actions">
          {!reviewOpen && (
            <button
              type="button"
              className="request-row__text-btn"
              disabled={Boolean(busyAction)}
              onClick={() =>
                setConfirmation({
                  id: connection.id,
                  kind: "end",
                })
              }
            >
              End connection
            </button>
          )}

          {reviewOpen ? (
            deadlinePassed || !deadlineValid ? (
              <Button
                size="sm"
                variant="secondary"
                disabled
              >
                {deadlinePassed
                  ? "Review window ended"
                  : "Deadline unavailable"}
              </Button>
            ) : (
              <Button
                size="sm"
                to={`/reviews/write/${connection.id}`}
              >
                Write review
              </Button>
            )
          ) : meConfirmed ? (
            <Button
              size="sm"
              variant="secondary"
              disabled
            >
              <Clock3 size={14} />
              Waiting for roommate
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={Boolean(busyAction)}
              onClick={() =>
                setConfirmation({
                  id: connection.id,
                  kind: "confirm",
                })
              }
            >
              I lived with {firstName}
            </Button>
          )}
        </div>

        {/* Confirm living together */}

        {confirming && (
          <div className="request-row__confirm">
            <p>
              <strong>
                Did you and {firstName} really live together?
              </strong>{" "}
              Both roommates must confirm before
              the seven-day review window begins.
            </p>

            <Button
              size="sm"
              variant="secondary"
              disabled={Boolean(busyAction)}
              onClick={() =>
                setConfirmation(null)
              }
            >
              Cancel
            </Button>

            <Button
              size="sm"
              disabled={Boolean(busyAction)}
              onClick={() =>
                void runAction(
                  `confirm-${connection.id}`,
                  () =>
                    firebaseRequestActions.confirm(
                      connection.id
                    ),
                  themConfirmed
                    ? "Both confirmed. Your seven-day review window is now open."
                    : "Confirmation saved. Waiting for your roommate."
                )
              }
            >
              {busyAction === `confirm-${connection.id}`
                ? "Confirming..."
                : "Yes, we lived together"}
            </Button>
          </div>
        )}

        {/* End connection */}

        {ending && (
          <div className="request-row__confirm">
            <p>
              <strong>
                End your connection with {firstName}?
              </strong>{" "}
              You would need a new request to reconnect.
            </p>

            <Button
              size="sm"
              variant="secondary"
              disabled={Boolean(busyAction)}
              onClick={() =>
                setConfirmation(null)
              }
            >
              Keep
            </Button>

            <button
              type="button"
              className="btn btn__sm requests__danger"
              disabled={Boolean(busyAction)}
              onClick={() =>
                void runAction(
                  `end-${connection.id}`,
                  () =>
                    firebaseRequestActions.end(
                      connection.id
                    ),
                  "Connection ended."
                )
              }
            >
              {busyAction === `end-${connection.id}`
                ? "Ending..."
                : "End connection"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Roommate requests"
        subtitle="Manage requests, verify roommate connections, and track review deadlines."
      />

      {(error || actionError) && (
        <div
          className="requests__error"
          role="alert"
        >
          <span>
            {actionError || error}
          </span>

          <button
            type="button"
            onClick={() => {
              setActionError("");
              void refresh();
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Refresh requests */}

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 16,
        }}
      >
        <Button
          size="sm"
          variant="secondary"
          disabled={
            loading || Boolean(busyAction)
          }
          onClick={() => void refresh()}
        >
          {loading
            ? "Refreshing..."
            : "Refresh requests"}
        </Button>
      </div>

      <div className="requests">
        {/* Incoming requests */}

        <Card
          title="Incoming requests"
          badge={
            pending.length > 0 ? (
              <Badge variant="orange">
                {pending.length} new
              </Badge>
            ) : undefined
          }
        >
          <div className="requests__list">
            {loading ? (
              <div className="requests__empty">
                Loading requests...
              </div>
            ) : incoming.length > 0 ? (
              incoming.map(renderIncoming)
            ) : (
              <div className="requests__empty">
                No requests right now.
                New ones show up here.
              </div>
            )}
          </div>
        </Card>

        {/* Sent requests */}

        {outgoing.length > 0 && (
          <Card
            title="Sent requests"
            badge={
              <Badge variant="tag">
                {outgoing.length} waiting
              </Badge>
            }
          >
            <div className="requests__list">
              {outgoing.map(renderOutgoing)}
            </div>
          </Card>
        )}

        {/* Roommate connections */}

        {activeConnections.length > 0 && (
          <Card
            title="Roommate connections"
            badge={
              actionCount > 0 ? (
                <Badge variant="orange">
                  {actionCount}{" "}
                  {actionCount === 1
                    ? "action"
                    : "actions"}
                </Badge>
              ) : undefined
            }
          >
            <div className="requests__list">
              {activeConnections.map(
                renderConnection
              )}
            </div>
          </Card>
        )}
      </div>

      {toast && (
        <div
          className="requests__toast"
          role="status"
        >
          {toast}
        </div>
      )}
    </>
  );
}