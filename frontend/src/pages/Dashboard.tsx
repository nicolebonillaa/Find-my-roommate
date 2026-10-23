
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
  getRecentActivity,
} from "../services/dashboardService";

import {
  getFirebaseStudents,
} from "../services/firebaseRoommates";

import {
  getFirebaseReviewData,
} from "../services/firebaseReviews";

import type {
  FirebaseDashboardStats,
  FirebaseActivityRecord,
} from "../services/dashboardService";

import type {
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

interface ActivityDisplay {
  id: string;
  title: string;
  time: string;
  icon: ReactNode;
}

/* Greeting based on local time */

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
}

const dashboardGreeting = greeting();

/* Firebase error messages */

function getErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error
      ? String(error.code)
      : "";

  if (code.includes("permission-denied")) {
    return "Firebase denied access to some dashboard information. Please check your Firestore permissions.";
  }

  if (code.includes("unauthenticated")) {
    return "Please sign in again to view your dashboard.";
  }

  if (code.includes("unavailable")) {
    return "Firebase is temporarily unavailable. Please try again.";
  }

  return error instanceof Error
    ? error.message
    : "Unable to load your dashboard.";
}

/* Format Firebase dates */

function formatActivityDate(
  value: string | null
): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/* Read names from Firebase activity */

function getActivityUserId(
  record: FirebaseActivityRecord
): string {
  const data = record.data;

  if (record.type === "incoming_request") {
    return typeof data.senderId === "string"
      ? data.senderId
      : "";
  }

  if (record.type === "outgoing_request") {
    return typeof data.receiverId === "string"
      ? data.receiverId
      : "";
  }

  return "";
}

function getActivityName(
  userId: string,
  students: Student[]
): string {
  const student = students.find(
    (item) => item.userId === userId
  );

  return student?.user.name || "A CSUN student";
}

/* Display actual Firebase activity */

function formatActivity(
  record: FirebaseActivityRecord,
  students: Student[]
): ActivityDisplay {
  const studentId = getActivityUserId(record);

  const studentName = getActivityName(
    studentId,
    students
  );

  let title = "Roommate activity";
  let icon: ReactNode = <Check size={16} />;

  if (record.type === "incoming_request") {
    if (record.status === "accepted") {
      title = `You accepted ${studentName}'s request`;
    } else if (record.status === "declined") {
      title = `You declined ${studentName}'s request`;
    } else if (record.status === "pending") {
      title = `${studentName} sent you a request`;
    } else {
      title = "An incoming roommate request was updated";
    }

    icon = <UserPlus size={16} />;
  }

  if (record.type === "outgoing_request") {
    if (record.status === "accepted") {
      title = `${studentName} accepted your request`;
    } else if (record.status === "declined") {
      title = `${studentName} declined your request`;
    } else if (record.status === "pending") {
      title = `You sent ${studentName} a request`;
    } else {
      title = "Your roommate request was updated";
    }

    icon = <UserPlus size={16} />;
  }

  if (record.type === "connection") {
    if (record.status === "review_open") {
      title = "Your roommate review window opened";
    } else if (record.status === "closed") {
      title = "A roommate connection ended";
    } else {
      title = "A roommate connection was created";
    }

    icon = <Check size={16} />;
  }

  if (record.type === "review_submitted") {
    title = "You submitted a roommate review";
    icon = <Star size={16} />;
  }

  return {
    id: record.id,
    title,
    time: formatActivityDate(record.date),
    icon,
  };
}

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] =
    useState<FirebaseDashboardStats | null>(null);

  const [pending, setPending] =
    useState<PendingReview | null>(null);

  const [publishedCount, setPublishedCount] =
    useState(0);

  const [activity, setActivity] =
    useState<ActivityDisplay[]>([]);

  const [students, setStudents] =
    useState<Student[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [retryCount, setRetryCount] = useState(0);

  /* Load real Firebase dashboard data */

  useEffect(() => {
    let active = true;

    Promise.all([
      getDashboardStats(),
      getRecentActivity(),
      getFirebaseReviewData(),
      getFirebaseStudents(),
    ])
      .then(
        ([
          statsData,
          activityData,
          reviewData,
          studentsData,
        ]) => {
          if (!active) return;

          const otherStudents = studentsData.filter(
            (student) =>
              student.userId !== user?.id
          );

          setStats(statsData);

          setPending(
            reviewData.pending.find(
              (item) => !item.youSubmitted
            ) ?? null
          );

          setPublishedCount(
            reviewData.aboutMe.length
          );

          setActivity(
            activityData.map((item) =>
              formatActivity(
                item,
                otherStudents
              )
            )
          );

          setStudents(otherStudents);
          setError("");
        }
      )
      .catch((cause: unknown) => {
        if (!active) return;

        setError(getErrorMessage(cause));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [retryCount, user?.id]);

  function handleRetry() {
    setLoading(true);
    setError("");
    setRetryCount((count) => count + 1);
  }

  const firstName =
    user?.name.split(" ")[0] || "";

  return (
    <>
      {/* Original greeting */}

      <PageHeader
        title={
          firstName
            ? `${dashboardGreeting}, ${firstName}`
            : dashboardGreeting
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

      {/* Error state */}

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

      {/* Original Dashboard layout */}

      {!loading && !error && (
        <>
          {/* Original four statistic cards */}

          {stats && (
            <section
              className="dashboard__stats"
              aria-label="Your stats"
            >
              <StatCard
                label="Profile views"
                value="—"
                note="View tracking not available yet"
                icon={<Eye size={16} />}
              />

              <StatCard
                label="Pending requests"
                value={stats.pendingRequests}
                note={
                  stats.pendingRequests === 1
                    ? "1 needs your reply"
                    : `${stats.pendingRequests} need your reply`
                }
                icon={<UserPlus size={16} />}
              />

              <StatCard
                label="Published reviews"
                value={publishedCount}
                note="From verified roommates"
                icon={<Star size={16} />}
              />

              <StatCard
                label="Trust score"
                value="—"
                note="Awaiting a verified scoring system"
                icon={<ShieldCheck size={16} />}
              />
            </section>
          )}

          <div className="dashboard__row">
            {/* Original Action needed card */}

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

                  {/* Original progress bar */}

                  <ProgressBar
                    label="Your review progress"
                    current={
                      pending.youSubmitted ? 1 : 0
                    }
                    total={1}
                  />
                </>
              ) : (
                <p className="action-empty">
                  Nothing needs your attention right now.
                </p>
              )}

              {stats &&
                stats.pendingRequests > 0 && (
                  <div
                    style={{
                      marginTop: 16,
                    }}
                  >
                    <Button
                      to="/requests"
                      variant="secondary"
                      size="sm"
                    >
                      View incoming requests (
                      {stats.pendingRequests})
                    </Button>
                  </div>
                )}
            </Card>

            {/* Original Recent activity card */}

            <Card title="Recent activity">
              {activity.length > 0 ? (
                <ul className="activity">
                  {activity
                    .slice(0, 3)
                    .map((item) => (
                      <li
                        key={item.id}
                        className="activity__item"
                      >
                        <span
                          className="activity__icon"
                          aria-hidden="true"
                        >
                          {item.icon}
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

          {/* Original student cards */}

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
                No other student profiles are available
                yet. Check back once more CSUN
                students join RoomieReport.
              </p>
            )}
          </Card>
        </>
      )}
    </>
  );
}