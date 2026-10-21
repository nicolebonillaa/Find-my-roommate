
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Send,
  ShieldCheck,
  Star,
} from "lucide-react";

import {
  getAuthorizedPublishedReviewsForStudent,
  getStudent,
  sendRoommateRequest,
  useRequestData,
} from "../services/api";

import { CURRENT_USER_ID } from "../data/mock";
import type { Review, Student } from "../types";
import Avatar from "../components/Avatar";
import PageHeader from "../components/PageHeader";

import "../styles/StudentProfile.css";

const preferenceFields = [
  { key: "cleanliness", label: "Cleanliness" },
  { key: "noise", label: "Preferred noise" },
  { key: "guests", label: "Guests" },
  { key: "sleepSchedule", label: "Sleep schedule" },
  { key: "sharedFood", label: "Shared food" },
  { key: "pets", label: "Pets" },
] as const;

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const { requests, connections } = useRequestData();

  const [student, setStudent] = useState<Student | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [success, setSuccess] = useState("");

  // Load the student for the URL.
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setLoadError(false);
      setStudent(null);
      setShowRequestForm(false);
      setMessage("");
      setRequestError("");
      setSuccess("");

      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const data = await getStudent(id);
        if (active) {
          setStudent(data ?? null);
        }
      } catch {
        if (active) {
          setLoadError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [id]);

  const isMyProfile = student?.userId === CURRENT_USER_ID;

  const connection = connections.find(
    (item) =>
      student &&
      item.status !== "closed" &&
      item.userIds.includes(CURRENT_USER_ID) &&
      item.userIds.includes(student.userId)
  );

  const request = requests.find(
    (item) =>
      student &&
      item.status !== "ended" &&
      (
        (item.senderId === CURRENT_USER_ID &&
          item.receiverId === student.userId) ||
        (item.receiverId === CURRENT_USER_ID &&
          item.senderId === student.userId)
      )
  );

  const connected = Boolean(connection) ||
    request?.status === "accepted";

  const outgoingPending =
    request?.status === "pending" &&
    request.senderId === CURRENT_USER_ID;

  const incomingPending =
    request?.status === "pending" &&
    request.receiverId === CURRENT_USER_ID;

  // Only request reviews when a connection is accepted.
  useEffect(() => {
    let active = true;

    async function loadReviews() {
      setReviews([]);

      if (!id || !connected) return;

      try {
        const data =
          await getAuthorizedPublishedReviewsForStudent(id);

        if (active) {
          setReviews(data);
        }
      } catch {
        if (active) {
          setReviews([]);
        }
      }
    }

    void loadReviews();

    return () => {
      active = false;
    };
  }, [id, connected]);

  async function handleSendRequest(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!student || sending) return;

    if (message.trim().length < 10) {
      setRequestError(
        "Please write at least 10 characters."
      );
      return;
    }

    setSending(true);
    setRequestError("");
    setSuccess("");

    try {
      await sendRoommateRequest(
        student.userId,
        message.trim()
      );

      setShowRequestForm(false);
      setMessage("");
      setSuccess("Your roommate request was sent.");
    } catch (error) {
      setRequestError(
        error instanceof Error
          ? error.message
          : "Could not send your request."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader
          title="Student profile"
          subtitle="Loading student information..."
        />
        <div className="student-profile__state">
          Loading profile...
        </div>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <PageHeader
          title="Student profile"
          subtitle="Unable to load this profile."
        />
        <div className="student-profile__state">
          <h2>Could not load student</h2>
          <p>Please try again later.</p>
          <Link to="/find">Back to Find roommates</Link>
        </div>
      </>
    );
  }

  if (!student) {
    return (
      <>
        <PageHeader
          title="Student profile"
          subtitle="This student could not be found."
        />
        <div className="student-profile__state">
          <h2>Student not found</h2>
          <p>
            This profile may not exist or may no longer
            be available.
          </p>
          <Link to="/find">Back to Find roommates</Link>
        </div>
      </>
    );
  }

  const firstName = student.user.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title="Student profile"
        subtitle={`Learn more about ${student.user.name} before connecting.`}
      />

      <div className="student-profile">
        <Link
          to="/find"
          className="student-profile__back"
        >
          <ArrowLeft size={16} />
          Back to Find roommates
        </Link>

        {/* Student header */}
        <section className="student-profile__hero">
          <div className="student-profile__identity">
            <Avatar user={student.user} size="lg" />

            <div className="student-profile__identity-text">
              <h2>{student.user.name}</h2>

              <span className="student-profile__verified">
                <ShieldCheck size={15} />
                {student.user.verificationStatus ===
                "verified"
                  ? "Verified CSUN student"
                  : "Verification pending"}
              </span>
            </div>
          </div>

          <div className="student-profile__request-area">
            {isMyProfile ? (
              <span className="student-profile__status">
                This is your profile
              </span>
            ) : connected ? (
              <span className="student-profile__status student-profile__status--connected">
                <CheckCircle2 size={16} />
                Connected
              </span>
            ) : outgoingPending ? (
              <span className="student-profile__status">
                <Clock3 size={16} />
                Request pending
              </span>
            ) : incomingPending ? (
              <Link
                className="student-profile__button"
                to="/requests"
              >
                Respond to request
              </Link>
            ) : (
              <button
                type="button"
                className="student-profile__button"
                onClick={() =>
                  setShowRequestForm((value) => !value)
                }
              >
                <Send size={16} />
                Send roommate request
              </button>
            )}
          </div>
        </section>

        {success && (
          <p
            className="student-profile__success"
            role="status"
          >
            <CheckCircle2 size={17} />
            {success}
          </p>
        )}

        {/* Request form */}
        {showRequestForm && !connected &&
          !outgoingPending && !incomingPending && (
          <section className="student-profile__panel">
            <h3>Send a request to {firstName}</h3>
            <p className="student-profile__muted">
              Introduce yourself and explain why
              you would like to connect.
            </p>

            <form onSubmit={handleSendRequest}>
              <label
                htmlFor="student-profile-message"
                className="student-profile__field-label"
              >
                Your message
              </label>

              <textarea
                id="student-profile-message"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                maxLength={500}
                placeholder={`Hi ${firstName}, I'd like to connect with you on RoomieReport...`}
                required
              />

              {requestError && (
                <p
                  className="student-profile__error"
                  role="alert"
                >
                  {requestError}
                </p>
              )}

              <div className="student-profile__form-actions">
                <button
                  type="button"
                  className="student-profile__secondary-button"
                  onClick={() =>
                    setShowRequestForm(false)
                  }
                  disabled={sending}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="student-profile__button"
                  disabled={sending}
                >
                  {sending
                    ? "Sending..."
                    : "Send request"}
                </button>
              </div>
            </form>
          </section>
        )}

        <div className="student-profile__columns">
          <div className="student-profile__left">
            {/* About */}
            <section className="student-profile__panel">
              <h3>About {firstName}</h3>

              <p className="student-profile__bio">
                {student.bio ||
                  "This student hasn't added a bio yet."}
              </p>

              {student.tags.length > 0 && (
                <div className="student-profile__tags">
                  {student.tags.map((tag) => (
                    <span key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Lifestyle preferences */}
            <section className="student-profile__panel">
              <h3>Lifestyle preferences</h3>

              <div className="student-profile__preferences">
                {preferenceFields.map(
                  ({ key, label }) => (
                    <div
                      key={key}
                      className="student-profile__preference"
                    >
                      <span>{label}</span>
                      <strong>
                        {student.preferences[key]}
                      </strong>
                    </div>
                  )
                )}
              </div>
            </section>
          </div>

          {/* Reviews */}
          <section className="student-profile__panel student-profile__reviews">
            <h3>Roommate reviews</h3>

            {!connected ? (
              <div className="student-profile__locked">
                <LockKeyhole
                  size={29}
                  aria-hidden="true"
                />

                <h4>Reviews are locked</h4>

                <p>
                  Published roommate reviews become
                  available after {firstName} accepts
                  your request.
                </p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="student-profile__locked">
                <Star
                  size={28}
                  aria-hidden="true"
                />

                <h4>No published reviews available</h4>

                <p>
                  You're connected. Any published
                  reviews available to your account
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="student-profile__review-list">
                {reviews.map((review) => {
                  const scores = [
                    review.cleanlinessScore,
                    review.noiseScore,
                    review.communicationScore,
                    review.privacyScore,
                    review.responsibilityScore,
                    review.paymentScore,
                  ];

                  const average =
                    scores.reduce(
                      (total, score) => total + score,
                      0
                    ) / scores.length;

                  return (
                    <article
                      key={review.id}
                      className="student-profile__review"
                    >
                      <div className="student-profile__review-heading">
                        <strong>
                          <Star size={16} fill="currentColor" />
                          {average.toFixed(1)} / 5
                        </strong>

                        <span>
                          Verified roommate review
                        </span>
                      </div>

                      <p>{review.positiveComment}</p>

                      {review.futureRoommateComment && (
                        <p>
                          {review.futureRoommateComment}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            <p className="student-profile__privacy-note">
              <ShieldCheck size={15} />
              Only previously published, authorized
              reviews are shown. New reviews remain
              private until the reveal conditions are met.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}