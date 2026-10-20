
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  Bell,
  Check,
  ChevronRight,
  PenLine,
  UserRoundPlus,
} from "lucide-react";

import Avatar from "./Avatar";
import { useAuth } from "../auth/AuthProvider";
import {
  getDaysRemaining,
  getOtherRoommate,
  useRequestData,
} from "../services/api";
import { CURRENT_USER_ID, users } from "../data/mock";
import GlobalSearch from "./GlobalSearch";

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

export default function Topbar() {
  const { user } = useAuth();
  const { requests, connections } = useRequestData();

  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const notifications: NotificationItem[] = [];

  requests
    .filter(
      (r) =>
        r.receiverId === CURRENT_USER_ID &&
        r.status === "pending"
    )
    .forEach((request) => {
      const sender = users[request.senderId];
      if (!sender) return;

      notifications.push({
        id: `notification-${request.id}`,
        user: sender,
        title: `${
          sender.name.split(" ")[0]
        } sent you a request`,
        subtitle: new Date(
          request.createdAt
        ).toLocaleString(),
        target: `row-${request.id}`,
        kind: "request",
      });
    });

  connections
    .filter(
      (c) =>
        c.userIds.includes(CURRENT_USER_ID) &&
        c.status !== "closed"
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

  // Close when clicking outside or pressing Escape.
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

  function openNotification(item: NotificationItem) {
    setOpen(false);

    const hash = `#${item.target}`;

    if (
      location.pathname === "/requests" &&
      location.hash === hash
    ) {
      const element = document.getElementById(
        item.target
      );

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
        <button
          className={`topbar__icon-btn${
            notifications.length > 0 ? " has-dot" : ""
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
            <div className="notif__head">
              Notifications
            </div>

            {notifications.length > 0 ? (
              notifications.map((item) => (
                <button
                  key={item.id}
                  className="notif__item"
                  type="button"
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
                    <strong>{item.title}</strong>
                    <span>{item.subtitle}</span>
                  </span>

                  <ChevronRight
                    size={15}
                    className="notif__arrow"
                    aria-hidden="true"
                  />
                </button>
              ))
            ) : (
              <p className="notif__empty">
                You're all caught up.
              </p>
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

      {user && (
        <Avatar user={user} size="sm" round />
      )}
    </div>
  );
}