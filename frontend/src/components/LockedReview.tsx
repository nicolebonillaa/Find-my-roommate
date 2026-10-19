import { Lock } from "lucide-react";

interface LockedReviewsProps {
  name?: string; // Reviews become visible after person accepts your request.
  variant?: "box" | "inline"; // box = Find roommates, inline = Dashboard cards
}

export default function LockedReviews({ name, variant = "box" }: LockedReviewsProps) {
  if (variant === "inline") {
    return (
      <div className="locked locked__inline">
        <span>Reviews</span>
        <span className="locked__status">
          <Lock size={12} aria-hidden="true" />
          Locked
        </span>
      </div>
    );
  }
  return (
    <div className="locked">
      <Lock size={22} aria-hidden="true" />
      <span>
        Reviews become visible after {name ?? "they"} accept
        {name ? "s" : ""} your request.
      </span>
    </div>
  );
}