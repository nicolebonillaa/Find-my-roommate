
import { useState } from "react";
import { Info, Lock, PenLine } from "lucide-react";

import type { PendingReview } from "../types";
import Avatar from "./Avatar";
import Badge from "./Badge";
import Button from "./Button";
import DeadlineBadge from "./DeadlineBadge";

import "../styles/WaitingReviewRow.css";

interface Props {
  pending: PendingReview;
  onWrite?: (pending: PendingReview) => void;
}

export default function WaitingReviewRow({
  pending,
  onWrite,
}: Props) {
  const [showRules, setShowRules] = useState(false);

  const {
    roommate,
    youSubmitted,
    submittedCount,
    daysLeft,
    connectionId,
  } = pending;

  const firstName = roommate.name.split(" ")[0];

  const theySubmitted =
    submittedCount - (youSubmitted ? 1 : 0) > 0;

  if (!youSubmitted) {
    return (
      <div className="waiting-row waiting-row--turn">
        <Avatar user={roommate} />

        <div className="waiting-row__info">
          <h3 className="waiting-row__name">
            {roommate.name}
          </h3>

          <p className="waiting-row__text">
            Both of you confirmed that you lived together.
            {theySubmitted &&
              ` ${firstName} already submitted. Your review stays private until publication.`}
          </p>

          <div className="waiting-row__meta">
            <DeadlineBadge daysLeft={daysLeft} />
          </div>
        </div>

        {onWrite ? (
          <Button
            size="sm"
            onClick={() => onWrite(pending)}
          >
            <PenLine size={14} aria-hidden="true" />
            Write review
          </Button>
        ) : (
          <Button
            to={`/reviews/write/${connectionId}`}
            size="sm"
          >
            <PenLine size={14} aria-hidden="true" />
            Write review
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="waiting-row">
      <Avatar user={roommate} />

      <div className="waiting-row__info">
        <h3 className="waiting-row__name">
          {roommate.name}
        </h3>

        <p className="waiting-row__text">
          You submitted your review. Waiting for {firstName}.
        </p>

        <div className="waiting-row__meta">
          <Badge>
            <Lock size={12} aria-hidden="true" />
            Private
          </Badge>

          <DeadlineBadge daysLeft={daysLeft} />
        </div>
      </div>

      <button
        type="button"
        className="link-btn"
        aria-expanded={showRules}
        onClick={() => setShowRules((open) => !open)}
      >
        <Info size={13} aria-hidden="true" />
        View rules
      </button>

      {showRules && (
        <p className="waiting-row__rules">
          Neither person can read the other's review
          until both submit or the seven-day window ends.
          After that, submitted reviews are published.
        </p>
      )}
    </div>
  );
}