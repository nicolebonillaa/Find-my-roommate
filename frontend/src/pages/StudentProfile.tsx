
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
} from "lucide-react";

import { useAuth } from "../auth/AuthProvider";

import {
  firebaseRequestActions,
  getFirebaseStudent,
  useFirebaseRoommates,
} from "../services/firebaseRoommates";

import type { Student } from "../types";

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
  const { user } = useAuth();

  const currentUserId = user?.id || "";

  const {
    requests,
    connections,
    loading: requestsLoading,
    error: requestsError,
    refresh,
  } = useFirebaseRoommates();

  const [student, setStudent] = useState<Student | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showRequestForm, setShowRequestForm] =
    useState(false);

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [success, setSuccess] = useState("");

  /* Load the selected student's Firebase profile */

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setLoadError("");
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
        const data = await getFirebaseStudent(id);

        if (active) {
          setStudent(data);
        }
      } catch (err) {
        if (active) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Unable to load student."
          );
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

  const isMyProfile =
    student?.userId === currentUserId;

  const connection = connections.find(
    (item) =>
      student &&
      item.status !== "closed" &&
      item.userIds.includes(currentUserId) &&
      item.userIds.includes(student.userId)
  );

  const request = [...requests].reverse().find(
    (item) =>
      student &&
      item.status === "pending" &&
      ((item.senderId === currentUserId &&
        item.receiverId === student.userId) ||
        (item.receiverId === currentUserId &&
          item.senderId === student.userId))
  );

  const connected = Boolean(connection);

  const outgoingPending =
    request?.status === "pending" &&
    request.senderId === currentUserId;

  const incomingPending =
    request?.status === "pending" &&
    request.receiverId === currentUserId;

  /* Send a real Firebase roommate request */

  async function handleSendRequest(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!student || sending || requestsLoading) return;

    if (message.trim().length < 10) {
      setRequestError(
        "Please write at least 10 characters."
      );
      return;
    }

    if (message.trim().length > 500) {
      setRequestError(
        "Your message must be 500 characters or fewer."
      );
      return;
    }

    setSending(true);
    setRequestError("");
    setSuccess("");

    try {
      await firebaseRequestActions.send(
        student.userId,
        message.trim()
      );

      await refresh();

      setShowRequestForm(false);
      setMessage("");
      setSuccess("Your roommate request was sent.");
    } catch (err) {
      setRequestError(
        err instanceof Error
          ? err.message
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

  if (loadError || !student) {
    return (
      <>
        <PageHeader
          title="Student profile"
          subtitle="This student could not be loaded."
        />

        <div className="student-profile__state">
          <h2>Student unavailable</h2>

          <p>
            {loadError ||
              "This student profile could not be found."}
          </p>

          <Link to="/find">
            Back to Find roommates
          </Link>
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
                Verified CSUN student
              </span>
            </div>
          </div>

          <div className="student-profile__request-area">
            {isMyProfile ? (
              <span className="student-profile__status">
                This is your profile
              </span>
            ) : requestsLoading ? (
              <span className="student-profile__status">
                Checking connection...
              </span>
            ) : requestsError ? (
              <button
                type="button"
                className="student-profile__button"
                onClick={() => void refresh()}
              >
                Retry connection check
              </button>
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

        {showRequestForm &&
          !connected &&
          !outgoingPending &&
          !incomingPending &&
          !requestsLoading &&
          !requestsError && (
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
                    disabled={sending}
                    onClick={() =>
                      setShowRequestForm(false)
                    }
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
            {/* About student */}

            <section className="student-profile__panel">
              <h3>About {firstName}</h3>

              <p className="student-profile__bio">
                {student.bio ||
                  "This student hasn't added a bio yet."}
              </p>

              {student.tags.length > 0 && (
                <div className="student-profile__tags">
                  {student.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
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

          {/* Roommate reviews */}

          <section className="student-profile__panel student-profile__reviews">
            <h3>Roommate reviews</h3>

            <div className="student-profile__locked">
              <LockKeyhole
                size={29}
                aria-hidden="true"
              />

              {connected ? (
                <>
                  <h4>Published reviews</h4>

                  <p>
                    You're connected. Authorized published
                    reviews will be available when the
                    Firebase Reviews integration is finished.
                  </p>
                </>
              ) : (
                <>
                  <h4>Reviews are locked</h4>

                  <p>
                    Published roommate reviews become
                    available after {firstName} accepts
                    your request.
                  </p>
                </>
              )}
            </div>

            <p className="student-profile__privacy-note">
              <ShieldCheck size={15} />
              New roommate reviews remain private until
              the reveal conditions are met.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}