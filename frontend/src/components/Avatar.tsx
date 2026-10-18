import type { User } from "../types";

interface AvatarProps {
  user: Pick<User, "name" | "avatarColor">;
  size?: "sm" | "md" | "lg";
  round?: boolean;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Avatar({ user, size = "md", round = false }: AvatarProps) {
  return (
    <span
      className={`avatar avatar__${size}${round ? " avatar__round" : ""}`}
      style={{ background: user.avatarColor }}
      aria-hidden="true"
    >
      {initials(user.name)}
    </span>
  );
}