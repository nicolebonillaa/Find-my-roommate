import type { User } from "../types";
import { getInitials } from "../utils/getInitials";

interface AvatarProps {
  user: Pick<User, "name" | "avatarColor">;
  size?: "sm" | "md" | "lg";
  round?: boolean;
  photoUrl?: string;
}

export default function Avatar({
  user,
  size = "md",
  round = false,
  photoUrl,
}: AvatarProps) {
  return (
    <span
      className={`avatar avatar__${size}${
        round ? " avatar__round" : ""
      }`}
      style={{
        background: user.avatarColor,
        overflow: "hidden",
      }}
      aria-label={`${user.name}'s avatar`}
      role="img"
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        getInitials(user.name)
      )}
    </span>
  );
}