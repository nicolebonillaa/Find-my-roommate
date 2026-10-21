import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  Bell,
  Check,
  ChevronRight,
  PenLine,
  UserRoundPlus,
  X,
} from "lucide-react";

import Avatar from "./Avatar";
import GlobalSearch from "./GlobalSearch";
import { useAuth } from "../auth/AuthProvider";

import {
  getDaysRemaining,
  getOtherRoommate,
  useRequestData,
} from "../services/api";

import { CURRENT_USER_ID, users } from "../data/mock";
import type { User } from "../types";

import "../styles/Topbar.css";

interface NotificationItem {
  id: string;
  user: User;
  title: string;
  subtitle: string;
  target: string;
  kind: "request" | "confirm" | "review";
}

// Store notification preferences locally for the mock frontend.
// These are separate from actual request and connection data.
const READ_KEY = "roomiereport-read-notifications";
const DISMISSED_KEY = "roomiereport-dismissed-notifications";

function loadIds(key: string): string[] {
  try {
    const stored = localStorage.getItem(key);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
    ) {
      return parsed;
    }

    return [];
  } catch {
    return [];
  }
}

export default function Topbar() {
  const { user } = useAuth();
  const { requests, connections } = useRequestData();

  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Track read and dismissed notifications.
  const [readIds, setReadIds] = useState<string[]>(() =>
    loadIds(READ_KEY)
  );

  const [dismissedIds, setDismissedIds] = useState<string[]>(() =>
    loadIds(DISMISSED_KEY)
  );

  // Keep these preferences after refreshing the page.
  useEffect(() => {
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(readIds));
    } catch {
      // Storage may be unavailable in some browsers.
    }
  }, [readIds]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DISMISSED_KEY,
        JSON.stringify(dismissedIds)
      );
    } catch {
      // Storage may be unavailable in some browsers.
    }
  }, [dismissedIds]);

  const notifications: NotificationItem[] = [];

  requests
    .filter(
      (request) =>
        request.receiverId === CURRENT_USER_ID &&
        request.status === "pending"
    )
    .forEach((request) => {
      const sender = users[request.senderId];

      if (!sender) return;

      notifications.push({
        id: `notification-${request.id}`,
        user: sender,
        title: `${sender.name.split(" ")[0]} sent you a request`,
        subtitle: new Date(request.createdAt).toLocaleString(),
        target: `row-${request.id}`,
        kind: "request",
      });
    });

  connections
    .filter(
      (connection) =>
        connection.userIds.includes(CURRENT_USER_ID) &&
        connection.status !== "closed"
    )
    .forEach((connection) => {
      const roommate = getOtherRoommate(connection);

      if (!roommate) return;

      const firstName = roommate.name.split(" ")[0];

      const meConfirmed =
        connection.confirmedBy.includes(CURRENT_USER_ID);

      const themConfirmed =
        connection.confirmedBy.includes(roommate.id);

      if (
        connection.status === "awaiting_confirmation" &&
        !meConfirmed &&
        themConfirmed
      ) {
        notifications.push({
          id: `notification-confirm-${connection.id}`,
          user: roommate,
          title: `${firstName} confirmed you lived together`,
          subtitle: "Your turn to confirm",
          target: `row-${connection.id}`,
          kind: "confirm",
        });
      }

      if (connection.status === "review_open") {
        notifications.push({
          id: `notification-review-${connection.id}`,
          user: roommate,
          title: `Review ${firstName}`,
          subtitle: `${getDaysRemaining(
            connection.reviewDeadline
          )} days left to submit`,
          target: `row-${connection.id}`,
          kind: "review",
        });
      }
    });

  // Show only notifications that have not been dismissed.
  const visibleNotifications = notifications.filter(
    (item) => !dismissedIds.includes(item.id)
  );

  // Read notifications no longer count toward the bell dot.
  const unreadCount = visibleNotifications.filter(
    (item) => !readIds.includes(item.id)
  ).length;

  // Mark one notification as read.
  function markAsRead(id: string) {
    setReadIds((previous) =>
      previous.includes(id) ? previous : [...previous, id]
    );
  }

  // Mark all currently visible notifications as read.
  function markAllRead() {
    setReadIds((previous) => [
      ...new Set([
        ...previous,
        ...visibleNotifications.map((item) => item.id),
      ]),
    ]);
  }

  // Dismiss one notification.
  function dismissNotification(id: string) {
    setDismissedIds((previous) =>
      previous.includes(id) ? previous : [...previous, id]
    );
  }

  // Clear all currently visible notifications.
  function clearAllNotifications() {
    setDismissedIds((previous) => [
      ...new Set([
        ...previous,
        ...visibleNotifications.map((item) => item.id),
      ]),
    ]);
  }

  // Close the dropdown when clicking outside or using Escape.
  useEffect(() => {
    if (!open) return;

    function handleOutsideClick(event: MouseEvent) {
      if (
        !popupRef.current?.contains(event.target as Node)
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

  // Open the corresponding request.
  // Clicking also marks the notification as read.
  function openNotification(item: NotificationItem) {
    markAsRead(item.id);
    setOpen(false);

    const hash = `#${item.target}`;

    if (
      location.pathname === "/requests" &&
      location.hash === hash
    ) {
      const element = document.getElementById(item.target);

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        element.classList.remove("request-row--flash");

        void element.offsetWidth;

        element.classList.add("request-row--flash");
      }
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
        {/* notification bell */}
        <button
          className={`topbar__icon-btn${
            unreadCount > 0 ? " has-dot" : ""
          }`}
          type="button"
          aria-label="Notifications"
          aria-expanded={open}
          aria-controls="roomie-notifications"
          onClick={() => setOpen((value) => !value)}
        >
          <Bell size={18} aria-hidden="true" />
        </button>

        {open && (
          <div
            className="notif"
            id="roomie-notifications"
            role="region"
            aria-label="Notifications"
          >
            {/* Mark all read */}
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

            {visibleNotifications.length > 0 ? (
              visibleNotifications.map((item) => {
                const isUnread = !readIds.includes(item.id);

                return (
                  <div
                    className="notif__row"
                    key={item.id}
                  >
                    {/* clickable notification */}
                    <button
                      type="button"
                      className={`notif__item${
                        isUnread ? " is-unread" : ""
                      }`}
                      onClick={() => openNotification(item)}
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
                        <strong>{item.title}</strong>
                        <span>{item.subtitle}</span>
                      </span>

                      <ChevronRight
                        size={15}
                        className="notif__arrow"
                        aria-hidden="true"
                      />
                    </button>

                    {/* Unread indicator */}
                    {isUnread && (
                      <span
                        className="notif__dot"
                        aria-label="Unread notification"
                      />
                    )}

                    {/* Dismiss individual notification */}
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

            {/* Clear all notifications */}
            {visibleNotifications.length > 0 && (
              <button
                className="notif__clear"
                type="button"
                onClick={clearAllNotifications}
              >
                Clear all
              </button>
            )}

            {/* View all requests link */}
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

      {/* profile avatar */}
      {user && (
        <Avatar user={user} size="sm" round />
      )}
    </div>
  );
}