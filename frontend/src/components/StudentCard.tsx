import type { Student } from "../types";
import Avatar from "./Avatar";
import Button from "./Button";
import LockedReviews from "./LockedReview";
import Badge from "./Badge";

interface StudentCardProps {
  student: Student;
  // compact = Dashboard ("Students you may know")
  // full = Find roommates (with preference rows + verified badge)
  variant?: "compact" | "full";
}

export default function StudentCard({ student, variant = "full" }: StudentCardProps) {
  const { user, preferences, tags, area } = student;
  const firstName = user.name.split(" ")[0];

  return (
    <article className={`student-card student-card--${variant}`}>
      <div className="student-card__head">
        <Avatar user={user} size={variant === "full" ? "lg" : "md"} />
        <div>
          <h3 className="student-card__name">{user.name}</h3>
          {variant === "full" ? (
            user.verificationStatus === "verified" && (
              <Badge variant="green">✓ CSUN verified</Badge>
            )
          ) : (
            <p className="student-card__area">{area}</p>
          )}
        </div>
      </div>

      {variant === "full" ? (
        <>
          <LockedReviews name={firstName} />
          <dl className="student-card__prefs">
            <div><dt>Preferred noise</dt><dd>{preferences.noise}</dd></div>
            <div><dt>Cleanliness</dt><dd>{preferences.cleanliness}</dd></div>
            <div><dt>Guests</dt><dd>{preferences.guests}</dd></div>
          </dl>
        </>
      ) : (
        <LockedReviews variant="inline" />
      )}

      <div className="student-card__tags">
        {tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>

      <Button
        to={`/students/${student.userId}`}
        variant={variant === "full" ? "primary" : "secondary"}
        full
      >
        View profile
      </Button>
    </article>
  );
}