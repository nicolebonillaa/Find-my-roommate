import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface CardProps {
  title?: string;
  actionLabel?: string;
  actionTo?: string;
  badge?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function Card({
  title,
  actionLabel,
  actionTo,
  badge,
  className = "",
  children,
}: CardProps) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card__header">
          <h2 className="card__title">{title}</h2>
          {badge}
          {actionLabel && actionTo && (
            <Link to={actionTo} className="card__link">
              {actionLabel}
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}