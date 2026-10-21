import { useState } from "react";
import { Flag } from "lucide-react";
import type { PublishedReview } from "../types";
import { overallScore } from "../utils/reviewScores.ts";
import Avatar from "./Avatar";
import Badge from "./Badge";
import Button from "./Button";
import StarRating from "./Rating";
import ScoreGrid from "./ScoreGrid";
import "../styles/ReviewCard.css";

const REPORT_REASONS = ["Harassment", "False information", "Personal details", "Other"];

interface ReviewCardProps {
  review: PublishedReview;
  // about-me = someone else wrote it (shows the reviewer, can be reported)
  // by-me = you wrote it (shows who you reviewed)
  perspective: "about-me" | "by-me";
  onReport?: (reviewId: string, reason: string) => Promise<void>;
}

function publishedLabel(iso?: string) {
  if (!iso) return "Published";
  const date = new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Published ${date}`;
}

export default function ReviewCard({ review, perspective, onReport }: ReviewCardProps) {
  const [step, setStep] = useState<"idle" | "choosing" | "sent">("idle");
  const [reason, setReason] = useState<string | null>(null);

  const person = perspective === "about-me" ? review.reviewer : review.reviewedUser;
  const overall = overallScore(review);

  async function sendReport() {
    if (!reason || !onReport) return;
    await onReport(review.id, reason);
    setStep("sent");
  }

  return (
    <article className="review-card">
      <div className="review-card__head">
        <div className="review-card__who">
          <Avatar user={person} />
          <div>
            <h3 className="review-card__name">
              {person.name}
              {perspective === "by-me" && <Badge variant="blue">Written by you</Badge>}
            </h3>
            <p className="review-card__meta">
              {publishedLabel(review.publishedAt)} · Verified roommate relationship
            </p>
          </div>
        </div>
        <div className="review-card__rating">
          <StarRating value={overall} />
          <span>{overall.toFixed(1)} overall</span>
        </div>
      </div>

      <ScoreGrid scores={review} />

      <blockquote className="review-card__quote">
        <span>What went well</span>
        {review.positiveComment}
      </blockquote>
      {review.futureRoommateComment && (
        <blockquote className="review-card__quote">
          <span>Would live together again?</span>
          {review.futureRoommateComment}
        </blockquote>
      )}

      {perspective === "about-me" && onReport && step !== "choosing" && (
        <div className="review-card__foot">
          {step === "idle" ? (
            <button
              type="button"
              className="link-btn link-btn--danger"
              onClick={() => setStep("choosing")}
            >
              <Flag size={13} aria-hidden="true" />
              Report review
            </button>
          ) : (
            <p className="review-card__sent">Reported. A moderator will take a look.</p>
          )}
        </div>
      )}

      {step === "choosing" && (
        <div className="review-card__report">
          <p>Why are you reporting this review?</p>
          <div className="review-card__reasons">
            {REPORT_REASONS.map((item) => (
              <button
                key={item}
                type="button"
                className={`badge badge__filter${reason === item ? " is-active" : ""}`}
                aria-pressed={reason === item}
                onClick={() => setReason(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="review-card__report-actions">
            <Button variant="secondary" size="sm" onClick={() => setStep("idle")}>
              Cancel
            </Button>
            <Button size="sm" disabled={!reason} onClick={sendReport}>
              Send report
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}