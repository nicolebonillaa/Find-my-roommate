import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Check, Eye, ShieldCheck, Star, UserPlus } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import {
  getDashboardStats,
  getPendingReviews,
  getRecentActivity,
  getStudents,
} from "../services/api";
import type { ActivityItem, ActivityKind, PendingReview, Student } from "../types";
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

// Each activity row gets an icon based on its kind.
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

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingReview | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getPendingReviews(),
      getRecentActivity(),
      getStudents(),
    ]).then(([statsData, pendingData, activityData, studentsData]) => {
      setStats(statsData);
      setPending(pendingData[0] ?? null); // the Dashboard shows the most urgent one
      setActivity(activityData);
      setStudents(studentsData);
    });
  }, []);

  const firstName = user?.name.split(" ")[0] ?? "";

  return (
    <>
      <PageHeader
        title={firstName ? `${greeting()}, ${firstName}` : greeting()}
        subtitle="Your roommate history is becoming more useful every day."
        action={<Button to="/find">Find a roommate</Button>}
      />

      {stats && (
        <section className="dashboard__stats" aria-label="Your stats">
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
        <Card title="Action needed" actionLabel="View all" actionTo="/reviews">
          {pending ? (
            <>
              <div className="action-item">
                <Avatar user={pending.roommate} size="lg" />
                <div className="action-item__body">
                  <h3 className="action-item__title">
                    Review your former roommate, {pending.roommate.name}
                  </h3>
                  <p className="action-item__text">
                    You both confirmed that you lived together near CSUN.
                  </p>
                  <DeadlineBadge daysLeft={pending.daysLeft} />
                </div>
                <Button to={`/reviews/write/${pending.connectionId}`}>
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
            <p className="action-empty">Nothing needs your attention right now.</p>
          )}
        </Card>

        <Card title="Recent activity">
          <ul className="activity">
            {activity.map((item) => (
              <li key={item.id} className="activity__item">
                <span className="activity__icon" aria-hidden="true">
                  {activityIcons[item.kind]}
                </span>
                <div>
                  <p className="activity__title">{item.title}</p>
                  <p className="activity__time">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Students you may know" actionLabel="Explore all" actionTo="/find">
        <div className="dashboard__students">
          {students.slice(0, 3).map((student) => (
            <StudentCard key={student.userId} student={student} variant="compact" />
          ))}
        </div>
      </Card>
    </>
  );
}