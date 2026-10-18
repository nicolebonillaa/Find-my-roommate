import Badge from "./Badge";

export default function DeadlineBadge({ daysLeft }: { daysLeft: number }) {
  const label =
    daysLeft <= 0
      ? "Deadline passed"
      : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left to submit`;
  return <Badge variant="orange">{label}</Badge>;
}