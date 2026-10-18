import type { ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "light";
  size?: "md" | "sm";
  full?: boolean;
  to?: string; // if set, renders a router Link styled as a button
}

export default function Button({
  variant = "primary",
  size = "md",
  full = false,
  to,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    "btn",
    `btn__${variant}`,
    size === "sm" ? "btn__sm" : "",
    full ? "btn__full" : "",
    className,
]
  .filter(Boolean)
  .join(" ");

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}