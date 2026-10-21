
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Lock, X } from "lucide-react";

import type { PendingReview, ReviewScores } from "../types";
import { submitRoommateReview } from "../services/api";

import Avatar from "./Avatar";
import "../styles/WriteReviewDialog.css";

type ScoreKey = keyof ReviewScores;

const categories: {
  key: ScoreKey;
  label: string;
}[] = [
  { key: "cleanlinessScore", label: "Cleanliness" },
  { key: "noiseScore", label: "Noise level" },
  { key: "communicationScore", label: "Communication" },
  { key: "privacyScore", label: "Privacy" },
  { key: "responsibilityScore", label: "Responsibility" },
  { key: "paymentScore", label: "Payments" },
];

interface Props {
  pending: PendingReview;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function WriteReviewDialog({
  pending,
  onClose,
  onSubmitted,
}: Props) {
  const [scores, setScores] = useState<
    Partial<ReviewScores>
  >({});

  const [positiveComment, setPositiveComment] =
    useState("");

  const [
    futureRoommateComment,
    setFutureRoommateComment,
  ] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Close the popup with Escape.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose, saving]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (categories.some(({ key }) => !scores[key])) {
      setError("Please rate all six categories.");
      return;
    }

    if (positiveComment.trim().length < 10) {
      setError(
        "Please write at least 10 characters about what went well."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await submitRoommateReview(
        pending.connectionId,
        {
          ...(scores as ReviewScores),
          positiveComment: positiveComment.trim(),
          futureRoommateComment:
            futureRoommateComment.trim(),
        }
      );

      onSubmitted();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not submit your review."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="write-review-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <section
        className="write-review-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="write-review-title"
      >
        <div className="write-review-dialog__header">
          <div>
            <h2 id="write-review-title">
              Write a roommate review
            </h2>

            <p>
              Share your experience with your
              confirmed former roommate.
            </p>
          </div>

          <button
            type="button"
            className="write-review-dialog__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close review form"
          >
            <X size={18} />
          </button>
        </div>

        <div className="write-review-dialog__roommate">
          <Avatar user={pending.roommate} />

          <div>
            <strong>{pending.roommate.name}</strong>
            <p>
              Confirmed roommate relationship ·{" "}
              {pending.daysLeft} day
              {pending.daysLeft === 1 ? "" : "s"} left
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <h3>
            Rate your roommate's living habits (1–5)
          </h3>

          <div className="write-review-dialog__grid">
            {categories.map(({ key, label }) => (
              <div
                className="write-review-dialog__rating"
                key={key}
              >
                <div className="write-review-dialog__rating-label">
                  <strong>{label}</strong>
                  <span>
                    {scores[key]
                      ? `${scores[key]} / 5`
                      : "Not rated"}
                  </span>
                </div>

                <div
                  className="write-review-dialog__stars"
                  role="group"
                  aria-label={`${label} rating`}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      type="button"
                      key={value}
                      aria-label={`${label}: ${value} out of 5`}
                      aria-pressed={scores[key] === value}
                      className={
                        value <= (scores[key] ?? 0)
                          ? "is-selected"
                          : ""
                      }
                      onClick={() =>
                        setScores((previous) => ({
                          ...previous,
                          [key]: value,
                        }))
                      }
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <label className="write-review-dialog__field">
            <strong>What went well? *</strong>
            <textarea
              value={positiveComment}
              onChange={(event) =>
                setPositiveComment(event.target.value)
              }
              maxLength={800}
              placeholder="Describe something your roommate did well..."
              required
            />
          </label>

          <label className="write-review-dialog__field">
            <strong>
              Would you live together again? (optional)
            </strong>
            <textarea
              value={futureRoommateComment}
              onChange={(event) =>
                setFutureRoommateComment(
                  event.target.value
                )
              }
              maxLength={800}
              placeholder="Share your thoughts for a future roommate..."
            />
          </label>

          <p className="write-review-dialog__privacy">
            <Lock size={15} />
            Your review stays private until both
            people submit or the review deadline ends.
            You can submit once per confirmed connection.
          </p>

          {error && (
            <p
              className="write-review-dialog__error"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="write-review-dialog__actions">
            <button
              type="button"
              className="write-review-dialog__cancel"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="write-review-dialog__submit"
              disabled={saving}
            >
              {saving
                ? "Submitting..."
                : "Submit privately"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}