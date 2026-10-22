import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Clock3 } from "lucide-react";

import Avatar from "../components/Avatar";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

import { CURRENT_USER_ID, users } from "../data/mock";
import {
  cancelOutgoingRequest,
  confirmLivingTogether,
  endRoommateConnection,
  getDaysRemaining,
  getOtherRoommate,
  respondToRequest,
  useRequestData,
} from "../services/api";

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
  const { requests, connections } = useRequestData();
  const location = useLocation();

  const [confirmation, setConfirmation] =
    useState<Confirmation>(null);
  const [toast, setToast] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const busyRef = useRef(false);

  // Guard immediately against double-clicks, then await the API result.
  async function runAction(
    key: string,
    operation: () => boolean | void | Promise<boolean | void>,
    successMessage: string
  ) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyAction(key);
    setActionError("");

    try {
      const result = await operation();
      if (result === false) {
        throw new Error("This request or connection is no longer available. Refresh and try again.");
      }
      showToast(successMessage);
      setConfirmation(null);
    } catch (error: unknown) {
      const code = typeof error === "object" && error !== null && "code" in error
        ? String(error.code) : "";
      const message = code.includes("permission-denied")
        ? "You don't have permission to make this change."
        : code.includes("unauthenticated") || code.startsWith("auth/")
          ? "Please sign in again to continue."
          : code.includes("unavailable") || code.includes("network")
            ? "Connection problem. Please try again."
            : error instanceof Error && error.message
              ? error.message
              : "Couldn't save your change. Please try again.";
      setActionError(message);
    } finally {
      busyRef.current = false;
      setBusyAction(null);
    }
  }

  const toastTimer = useRef<number | undefined>(undefined);

  const incoming = requests.filter(
    (r) =>
      r.receiverId === CURRENT_USER_ID &&
      (r.status === "pending" || r.status === "declined")
  );

  const pending = incoming.filter(
    (r) => r.status === "pending"
  );

  const outgoing = requests.filter(
    (r) =>
      r.senderId === CURRENT_USER_ID &&
      r.status === "pending"
  );

  const activeConnections = connections.filter(
    (c) =>
      c.userIds.includes(CURRENT_USER_ID) &&
      c.status !== "closed"
  );

  const actionCount = activeConnections.filter(
    (c) =>
      c.status === "review_open" ||
      (
        c.status === "awaiting_confirmation" &&
        !c.confirmedBy.includes(CURRENT_USER_ID) &&
        c.confirmedBy.length > 0
      )
  ).length;

  useEffect(() => {
    return () => {
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  // Scroll to and highlight the request linked
  // from the notification dropdown.
  useEffect(() => {
    const targetId = decodeURIComponent(
      location.hash.replace(/^#/, "")
    );

    if (!targetId) return;

    const timer = window.setTimeout(() => {
      const element = document.getElementById(targetId);

      if (!element) return;

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      element.classList.remove("request-row--flash");
      void element.offsetWidth;
      element.classList.add("request-row--flash");
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

  function handleAnswer(
    request: RoommateRequest,
    action: "accepted" | "declined"
  ) {
    void runAction(
      `request-${request.id}`,
      () => respondToRequest(request.id, action),
      action === "accepted"
        ? "Request accepted. Published reviews are available to authorized connections."
        : "Request declined"
    );
  }

  function renderIncoming(request: RoommateRequest) {
    const sender = users[request.senderId];

    if (!sender) return null;

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
              ? "Declined. Their reviews stay hidden."
              : `“${request.message}”`}
          </p>
        </div>

        {request.status === "pending" ? (
          <div className="request-row__actions">
            <Button
              variant="secondary"
              size="sm"
              disabled={busyAction !== null}
              onClick={() => handleAnswer(request, "declined")}
            >
              {busyAction === `request-${request.id}` ? "Saving..." : "Decline"}
            </Button>

            <Button
              size="sm"
              disabled={busyAction !== null}
              onClick={() => handleAnswer(request, "accepted")}
            >
              {busyAction === `request-${request.id}` ? "Saving..." : "Accept"}
            </Button>
          </div>
        ) : (
          <Badge variant="tag">Declined</Badge>
        )}
      </div>
    );
  }

  function renderOutgoing(request: RoommateRequest) {
    const receiver = users[request.receiverId];

    if (!receiver) return null;

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
            You wrote: “{request.message}”
          </p>
        </div>

        <div className="request-row__actions">
          <Badge variant="blue">
            <Clock3 size={13} />
            Pending
          </Badge>

          <button
            className="request-row__text-btn"
            type="button"
            disabled={busyAction !== null}
            onClick={() => void runAction(
              `cancel-${request.id}`,
              () => cancelOutgoingRequest(request.id),
              "Request cancelled"
            )}
          >
            {busyAction === `cancel-${request.id}` ? "Cancelling..." : "Cancel"}
          </button>
        </div>
      </div>
    );
  }

  function renderConnection(connection: Connection) {
    const roommate: User | undefined =
      getOtherRoommate(connection);

    if (!roommate) return null;

    const first = roommate.name.split(" ")[0];
    const meConfirmed =
      connection.confirmedBy.includes(CURRENT_USER_ID);

    const themConfirmed =
      connection.confirmedBy.includes(roommate.id);

    const reviewOpen =
      connection.status === "review_open";

    const confirming =
      confirmation?.id === connection.id &&
      confirmation.kind === "confirm";

    const ending =
      confirmation?.id === connection.id &&
      confirmation.kind === "end";

    return (
      <div
        key={connection.id}
        id={`row-${connection.id}`}
        className={`request-row${
          reviewOpen ? " request-row--highlight" : ""
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

          {reviewOpen ? (
            <>
              <p className="request-row__text">
                Both of you confirmed that you
                lived together.
              </p>

              <div className="request-row__meta">
                <Badge variant="orange">
                  {getDaysRemaining(
                    connection.reviewDeadline
                  )}{" "}
                  days left to submit
                </Badge>
              </div>
            </>
          ) : meConfirmed ? (
            <p className="request-row__text">
              You confirmed.{" "}
              <strong>Waiting for {first}</strong>{" "}
              to confirm.
            </p>
          ) : (
            <p className="request-row__text">
              {themConfirmed ? (
                <>
                  <strong>{first} confirmed</strong>{" "}
                  you lived together. Your turn.
                </>
              ) : (
                "Accepted. Confirm once you've both lived together."
              )}
            </p>
          )}
        </div>

        <div className="request-row__actions">
          {!reviewOpen && (
            <button
              type="button"
              className="request-row__text-btn"
              disabled={busyAction !== null}
              onClick={() => setConfirmation({ id: connection.id, kind: "end" })}
            >
              End connection
            </button>
          )}

          {reviewOpen ? (
            getDaysRemaining(connection.reviewDeadline) > 0 ? (
              <Button
                size="sm"
                to={`/reviews/write/${connection.id}`}
              >
                Write review
              </Button>
      ) : (
    <Button size="sm" variant="secondary" disabled>
      Review window ended
    </Button>
  )
          ) : meConfirmed ? (
            <Button
              size="sm"
              variant="secondary"
              disabled
            >
              <Clock3 size={14} />
              Waiting
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={busyAction !== null}
              onClick={() => setConfirmation({ id: connection.id, kind: "confirm" })}
            >
              I lived with {first}
            </Button>
          )}
        </div>

        {confirming && (
          <div className="request-row__confirm">
            <p>
              <strong>
                Did you and {first} really share a home?
              </strong>{" "}
              Both of you have to confirm before
              reviews open.
            </p>

            <Button
              size="sm"
              variant="secondary"
              disabled={busyAction !== null}
              onClick={() => setConfirmation(null)}
            >
              Cancel
            </Button>

            <Button
              size="sm"
              disabled={busyAction !== null}
              onClick={() => void runAction(
                `confirm-${connection.id}`,
                () => confirmLivingTogether(connection.id),
                themConfirmed
                  ? "Both confirmed. Review window is open for 7 days."
                  : "Confirmed. Waiting for them."
              )}
            >
              {busyAction === `confirm-${connection.id}` ? "Confirming..." : "Yes, we lived together"}
            </Button>
          </div>
        )}

        {ending && (
          <div className="request-row__confirm">
            <p>
              <strong>
                End your connection with {first}?
              </strong>{" "}
              You would need a new request to connect again.
            </p>

            <Button
              size="sm"
              variant="secondary"
              disabled={busyAction !== null}
              onClick={() => setConfirmation(null)}
            >
              Keep
            </Button>

            <button
              type="button"
              className="btn btn__sm requests__danger"
              disabled={busyAction !== null}
              onClick={() => void runAction(
                `end-${connection.id}`,
                () => endRoommateConnection(connection.id),
                "Connection ended"
              )}
            >
              {busyAction === `end-${connection.id}` ? "Ending..." : "End connection"}
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
        subtitle="Accepting a request unlocks the other person's published roommate reviews."
      />

      {actionError && (
        <div className="requests__error" role="alert">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError("")} aria-label="Dismiss error">×</button>
        </div>
      )}

      <div className="requests">
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
            {incoming.length > 0 ? (
              incoming.map(renderIncoming)
            ) : (
              <div className="requests__empty">
                No requests right now.
                New ones show up here.
              </div>
            )}
          </div>
        </Card>

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
        <div className="requests__toast" role="status">
          {toast}
        </div>
      )}
    </>
  );
}