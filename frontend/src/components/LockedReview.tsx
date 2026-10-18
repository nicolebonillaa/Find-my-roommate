interface LockedReviewsProps {
  name?: string; // Reviews become visible after person accepts your request.
  variant?: "box" | "inline"; // box = Find roommates, inline = Dashboard cards
}

export default function LockedReviews({ name, variant = "box" }: LockedReviewsProps) {
  if (variant === "inline") {
    return (
      <div className="locked locked__inline">
        <span>Reviews</span>
        <span>🔒 Locked</span>
      </div>
    );
  }
  return (
    <div className="locked">
      <span className="locked__icon" aria-hidden="true">🔒</span>
      <span>
        Reviews become visible after {name ?? "they"} accept
        {name ? "s" : ""} your request.
      </span>
    </div>
  );
}