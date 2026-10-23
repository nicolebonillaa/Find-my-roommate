import { useEffect, useRef, useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Bell,
  Check,
  ChevronRight,
  PenLine,
  RefreshCw,
  UserRoundPlus,
  X,
} from "lucide-react";

import Avatar from "./Avatar";
import GlobalSearch from "./GlobalSearch";

import { useAuth } from "../auth/AuthProvider";

import {
  useFirebaseRoommates,
} from "../services/firebaseRoommates";

import {
  getFirebaseReviewData,
} from "../services/firebaseReviews";

import type { PendingReview, User } from "../types";

import "../styles/Topbar.css";

interface NotificationItem {
  id: string;
  user: User;
  title: string;
  subtitle: string;
  target: string;
  destination: string;
  kind: "request" | "confirm" | "review";
}

const READ_KEY = "roomiereport-read-notifications";
const DISMISSED_KEY = "roomiereport-dismissed-notifications";

/* Read saved notification preferences */

function loadIds(key: string): string[] {
  try {
    const stored = localStorage.getItem(key);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    return Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
      ? parsed
      : [];
  } catch {
    return [];
  }
}

export default function Topbar() {
  const { user, profile } = useAuth();

  const {
    requests,
    connections,
    students,
    loading,
    error,
    refresh,
  } = useFirebaseRoommates();

  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  const [pendingReviews, setPendingReviews] =
    useState<PendingReview[]>([]);

  const [reviewError, setReviewError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [readIds, setReadIds] = useState<string[]>(
    () => loadIds(READ_KEY)
  );

  const [dismissedIds, setDismissedIds] =
    useState<string[]>(
      () => loadIds(DISMISSED_KEY)
    );

  const popupRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || "";

  /* Save notification preferences */

  useEffect(() => {
    try {
      localStorage.setItem(
        READ_KEY,
        JSON.stringify(readIds)
      );
    } catch {
      // Browser storage may be unavailable.
    }
  }, [readIds]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DISMISSED_KEY,
        JSON.stringify(dismissedIds)
      );
    } catch {
      // Browser storage may be unavailable.
    }
  }, [dismissedIds]);

  /* Load real review actions */

  useEffect(() => {
    let active = true;

    if (!userId) return;

    getFirebaseReviewData()
      .then((data) => {
        if (!active) return;

        setPendingReviews(data.pending);
        setReviewError("");
      })
      .catch((cause) => {
        if (!active) return;

        setReviewError(
          cause instanceof Error
            ? cause.message
            : "Unable to load review notifications."
        );
      });

    return () => {
      active = false;
    };
  }, [userId]);

  /* Refresh notifications */

  async function refreshNotifications() {
    if (refreshing) return;

    setRefreshing(true);
    setReviewError("");

    try {
      await refresh();

      const reviewData =
        await getFirebaseReviewData();

      setPendingReviews(reviewData.pending);
    } catch (cause) {
      setReviewError(
        cause instanceof Error
          ? cause.message
          : "Unable to refresh notifications."
      );
    } finally {
      setRefreshing(false);
    }
  }

  /* Find the student associated with an action */

  function getStudent(studentId: string): User {
    return (
      students[studentId] || {
        id: studentId,
        name: "CSUN Student",
        email: "",
        verificationStatus: "verified",
        avatarColor: "#3461e8",
      }
    );
  }

  const notifications: NotificationItem[] = [];

  /* Incoming request notifications */

  requests
    .filter(
      (request) =>
        request.receiverId === userId &&
        request.status === "pending"
    )
    .forEach((request) => {
      const sender = getStudent(request.senderId);

      notifications.push({
        id: `${userId}-request-${request.id}`,
        user: sender,
        title: `${sender.name.split(" ")[0]} sent you a request`,
        subtitle: "Accept or decline their request",
        target: `row-${request.id}`,
        destination: "/requests",
        kind: "request",
      });
    });

  /* Roommate confirmation notifications */

  connections
    .filter(
      (connection) =>
        connection.userIds.includes(userId) &&
        connection.status === "awaiting_confirmation" &&
        !connection.confirmedBy.includes(userId)
    )
    .forEach((connection) => {
      const roommateId = connection.userIds.find(
        (id) => id !== userId
      );

      if (!roommateId) return;

      const roommate = getStudent(roommateId);

      notifications.push({
        id: `${userId}-confirm-${connection.id}`,
        user: roommate,
        title: connection.confirmedBy.includes(
          roommateId
        )
          ? `${roommate.name.split(" ")[0]} confirmed living together`
          : `Confirm your roommate connection`,
        subtitle: "Your confirmation is needed",
        target: `row-${connection.id}`,
        destination: "/requests",
        kind: "confirm",
      });
    });

  /* Pending review notifications */

  pendingReviews
    .filter(
      (review) =>
        !review.youSubmitted &&
        review.daysLeft > 0
    )
    .forEach((review) => {
      notifications.push({
        id: `${userId}-review-${review.connectionId}`,
        user: review.roommate,
        title: `Review ${review.roommate.name.split(" ")[0]}`,
        subtitle: `${review.daysLeft} ${
          review.daysLeft === 1 ? "day" : "days"
        } left to submit`,
        target: `row-${review.connectionId}`,
        destination: "/reviews",
        kind: "review",
      });
    });

  const visibleNotifications = notifications.filter(
    (item) => !dismissedIds.includes(item.id)
  );

  const unreadCount = visibleNotifications.filter(
    (item) => !readIds.includes(item.id)
  ).length;

  function markAsRead(id: string) {
    setReadIds((previous) =>
      previous.includes(id)
        ? previous
        : [...previous, id]
    );
  }

  function markAllRead() {
    setReadIds((previous) => [
      ...new Set([
        ...previous,
        ...visibleNotifications.map(
          (item) => item.id
        ),
      ]),
    ]);
  }

  function dismissNotification(id: string) {
    setDismissedIds((previous) =>
      previous.includes(id)
        ? previous
        : [...previous, id]
    );
  }

  function clearAllNotifications() {
    setDismissedIds((previous) => [
      ...new Set([
        ...previous,
        ...visibleNotifications.map(
          (item) => item.id
        ),
      ]),
    ]);
  }

  /* Close notifications when clicking outside */

  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        !popupRef.current?.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open]);

  /* Open the relevant page */

  function openNotification(item: NotificationItem) {
    markAsRead(item.id);
    setOpen(false);

    if (item.destination === "/reviews") {
      navigate("/reviews");
      return;
    }

    const hash = `#${item.target}`;

    if (
      location.pathname === "/requests" &&
      location.hash === hash
    ) {
      document
        .getElementById(item.target)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    } else {
      navigate(`/requests${hash}`);
    }
  }

  return (
    <div className="topbar">
      <GlobalSearch />

      <div
        className="topbar__notifications"
        ref={popupRef}
      >
        {/* Notification bell */}

        <button
          className={`topbar__icon-btn${
            unreadCount > 0
              ? " has-dot"
              : ""
          }`}
          type="button"
          aria-label="Notifications"
          aria-expanded={open}
          aria-controls="roomie-notifications"
          onClick={() =>
            setOpen((value) => !value)
          }
        >
          <Bell
            size={18}
            aria-hidden="true"
          />
        </button>

        {open && (
          <div
            className="notif"
            id="roomie-notifications"
            role="region"
            aria-label="Notifications"
          >
            {/* Notification header */}

            <div className="notif__head">
              <span>Notifications</span>

              <button
                className="notif__mark"
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
              >
                Mark all read
              </button>
            </div>

            {(error || reviewError) && (
              <p
                className="notif__empty"
                role="alert"
              >
                {error || reviewError}
              </p>
            )}

            {loading ? (
              <p className="notif__empty">
                Loading notifications...
              </p>
            ) : visibleNotifications.length > 0 ? (
              visibleNotifications.map((item) => {
                const isUnread =
                  !readIds.includes(item.id);

                return (
                  <div
                    className="notif__row"
                    key={item.id}
                  >
                    {/* Notification item */}

                    <button
                      type="button"
                      className={`notif__item${
                        isUnread
                          ? " is-unread"
                          : ""
                      }`}
                      onClick={() =>
                        openNotification(item)
                      }
                    >
                      <span className="notif__avatar-wrap">
                        <Avatar
                          user={item.user}
                          size="sm"
                          round
                        />

                        <span
                          className="notif__kind"
                          aria-hidden="true"
                        >
                          {item.kind === "request" ? (
                            <UserRoundPlus size={10} />
                          ) : item.kind === "confirm" ? (
                            <Check size={10} />
                          ) : (
                            <PenLine size={10} />
                          )}
                        </span>
                      </span>

                      <span className="notif__copy">
                        <strong>
                          {item.title}
                        </strong>

                        <span>
                          {item.subtitle}
                        </span>
                      </span>

                      <ChevronRight
                        size={15}
                        className="notif__arrow"
                        aria-hidden="true"
                      />
                    </button>

                    {isUnread && (
                      <span
                        className="notif__dot"
                        aria-label="Unread notification"
                      />
                    )}

                    {/* Dismiss notification */}

                    <button
                      className="notif__x"
                      type="button"
                      aria-label={`Dismiss: ${item.title}`}
                      title="Dismiss notification"
                      onClick={() =>
                        dismissNotification(item.id)
                      }
                    >
                      <X size={15} />
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="notif__empty">
                You're all caught up.
              </p>
            )}

            {/* Refresh notifications */}

            <button
              className="notif__clear"
              type="button"
              disabled={refreshing}
              onClick={() =>
                void refreshNotifications()
              }
            >
              <RefreshCw size={13} />
              {refreshing
                ? "Refreshing..."
                : "Refresh notifications"}
            </button>

            {visibleNotifications.length > 0 && (
              <button
                className="notif__clear"
                type="button"
                onClick={clearAllNotifications}
              >
                Clear all
              </button>
            )}

            <Link
              className="notif__foot"
              to="/requests"
              onClick={() => setOpen(false)}
            >
              View all requests
            </Link>
          </div>
        )}
      </div>

      {/* Shared profile avatar */}

      {user && (
        <Avatar
          user={profile?.user ?? user}
          photoUrl={profile?.photoUrl}
          size="sm"
          round
        />
      )}
    </div>
  );
}