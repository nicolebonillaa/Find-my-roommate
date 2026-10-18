import type { ReactNode } from "react";

interface BadgeProps {
  variant?: "tag" | "green" | "orange" | "blue";
  children: ReactNode;
}

// tag = gray outline (Quiet, Clean), green = "CSUN verified",
// orange = deadlines / "2 new", blue = info
export default function Badge({ variant = "tag", children }: BadgeProps) {
  return <span className={`badge badge__${variant}`}>{children}</span>;
}