import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  AlertCircle,
  Check,
  Eye,
  RefreshCw,
  ShieldCheck,
  Star,
  UserPlus,
} from "lucide-react";

import { useAuth } from "../auth/AuthProvider";

import {
  getDashboardStats,
  getPendingReviews,
  getRecentActivity,
  getStudents,
} from "../services/api";

import type {
  ActivityItem,
  ActivityKind,
  PendingReview,
  Student,
} from "../types";

import Avatar from "../components/Avatar";
import Button from "../components/Button";
import Card from "../components/Card";
import DeadlineBadge from "../components/DeadlineBadge";
import PageHeader from "../components/PageHeader";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";
import StudentCard from "../components/StudentCard";

import "../styles/Dashboard.css";

type Stats = Awaited<ReturnType<typeof getDashboardStats>>;

const activityIcons: Record<ActivityKind, ReactNode> = {
  accepted: <Check size={16} />,
  published: <Star size={16} />,
  request: <UserPlus size={16} />,
};

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

function getErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
      ? error.code
      : "";

  if (
    code === "permission-denied" ||
    code === "firestore/permission-denied"
  ) {
    return "You don't have permission to view this information.";
  }

  if (
    code === "unauthenticated" ||
    code === "auth/user-token-expired" ||
    code === "auth/requires-recent-login"
  ) {
    return "Your session may have expired. Please sign in again.";
  }

  if (
    code === "unavailable" ||
    code === "firestore/unavailable"
  ) {
    return "The service is temporarily unavailable. Please try again.";
  }

  return "We couldn't load your dashboard. Please try again.";
}

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingReview | null>(
    null
  );

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    Promise.all([
      getDashboardStats(),
      getPendingReviews(),
      getRecentActivity(),
      getStudents(),
    ])
      .then(
        ([
          statsData,
          pendingData,
          activityData,
          studentsData,
        ]) => {
          if (!active) return;

          setStats(statsData);

          setPending(
            pendingData.find(
              (item) => !item.youSubmitted
            ) ?? null
          );

          setActivity(activityData);
          setStudents(studentsData);
          setError("");
        }
      )
      .catch((err: unknown) => {
        if (!active) return;

        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!active) return;

        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  function handleRetry() {
    setLoading(true);
    setError("");
    setRetryCount((count) => count + 1);
  }

  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <>
      <PageHeader
        title={
          firstName
            ? `${greeting()}, ${firstName}`
            : greeting()
        }
        subtitle="Your roommate history is becoming more useful every day."
        action={
          <Button to="/find">
            Find a roommate
          </Button>
        }
      />

      {/* Loading state */}
      {loading && (
        <Card>
          <div
            className="dashboard__feedback"
            role="status"
            aria-live="polite"
          >
            <RefreshCw
              size={25}
              className="dashboard__loading-icon"
              aria-hidden="true"
            />

            <h3>Loading your dashboard...</h3>

            <p>
              Getting your latest roommate information.
            </p>
          </div>
        </Card>
      )}

      {/* Error and retry state */}
      {!loading && error && (
        <Card>
          <div
            className="dashboard__feedback"
            role="alert"
          >
            <AlertCircle
              size={28}
              className="dashboard__feedback-icon"
              aria-hidden="true"
            />

            <h3>Unable to load dashboard</h3>

            <p>{error}</p>

            <Button onClick={handleRetry}>
              <RefreshCw size={16} />
              Try again
            </Button>
          </div>
        </Card>
      )}

      {/* Dashboard content */}
      {!loading && !error && (
        <>
          {stats && (
            <section
              className="dashboard__stats"
              aria-label="Your stats"
            >
              <StatCard
                label="Profile views"
                value={stats.profileViews.value}
                note={stats.profileViews.note}
                icon={<Eye size={16} />}
              />

              <StatCard
                label="Pending requests"
                value={stats.pendingRequests.value}
                note={stats.pendingRequests.note}
                icon={<UserPlus size={16} />}
              />

              <StatCard
                label="Published reviews"
                value={stats.publishedReviews.value}
                note={stats.publishedReviews.note}
                icon={<Star size={16} />}
              />

              <StatCard
                label="Trust score"
                value={stats.trustScore.value}
                note={stats.trustScore.note}
                icon={<ShieldCheck size={16} />}
              />
            </section>
          )}

          <div className="dashboard__row">
            {/* Action needed */}
            <Card
              title="Action needed"
              actionLabel="View all"
              actionTo="/reviews"
            >
              {pending ? (
                <>
                  <div className="action-item">
                    <Avatar
                      user={pending.roommate}
                      size="lg"
                    />

                    <div className="action-item__body">
                      <h3 className="action-item__title">
                        Review your former roommate,{" "}
                        {pending.roommate.name}
                      </h3>

                      <p className="action-item__text">
                        You both confirmed that you lived
                        together near CSUN.
                      </p>

                      <DeadlineBadge
                        daysLeft={pending.daysLeft}
                      />
                    </div>

                    <Button
                      to={`/reviews/write/${pending.connectionId}`}
                    >
                      Write review
                    </Button>
                  </div>

                  <ProgressBar
                    label="Review process"
                    current={pending.submittedCount}
                    total={2}
                  />
                </>
              ) : (
                <p className="action-empty">
                  Nothing needs your attention right now.
                </p>
              )}
            </Card>

            {/* Recent activity */}
            <Card title="Recent activity">
              {activity.length > 0 ? (
                <ul className="activity">
                  {activity.map((item) => (
                    <li
                      key={item.id}
                      className="activity__item"
                    >
                      <span
                        className="activity__icon"
                        aria-hidden="true"
                      >
                        {activityIcons[item.kind]}
                      </span>

                      <div>
                        <p className="activity__title">
                          {item.title}
                        </p>

                        <p className="activity__time">
                          {item.time}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="action-empty">
                  No recent activity yet.
                </p>
              )}
            </Card>
          </div>

          {/* Suggested students */}
          <Card
            title="Students you may know"
            actionLabel="Explore all"
            actionTo="/find"
          >
            {students.length > 0 ? (
              <div className="dashboard__students">
                {students
                  .slice(0, 3)
                  .map((student) => (
                    <StudentCard
                      key={student.userId}
                      student={student}
                      variant="compact"
                    />
                  ))}
              </div>
            ) : (
              <p className="action-empty">
                No students to suggest right now.
                Check back later or explore all students.
              </p>
            )}
          </Card>
        </>
      )}
    </>
  );
}