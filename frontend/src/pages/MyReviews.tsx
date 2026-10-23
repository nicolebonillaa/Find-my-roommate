import { useEffect, useState } from "react";

import {
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import {
  getFirebaseReviewData,
  reportFirebaseReview,
} from "../services/firebaseReviews";

import type {
  PendingReview,
  PublishedReview,
} from "../types";

import { overallScore } from "../utils/reviewScores";

import Badge from "../components/Badge";
import Button from "../components/Button";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import ReviewCard from "../components/ReviewCard";
import StarRating from "../components/Rating";
import WaitingReviewRow from "../components/WaitingReviewRow";
import WriteReviewDialog from "../components/WriteReviewDialog";

import "../styles/MyReviews.css";

type Tab = "about-me" | "by-me";

export default function MyReviews() {
  const [pending, setPending] =
    useState<PendingReview[]>([]);

  const [aboutMe, setAboutMe] =
    useState<PublishedReview[]>([]);

  const [byMe, setByMe] =
    useState<PublishedReview[]>([]);

  const [tab, setTab] = useState<Tab>("about-me");

  const [writing, setWriting] =
    useState<PendingReview | null>(null);

  const [notice, setNotice] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [retryCount, setRetryCount] = useState(0);

  /* Load reviews from Firebase */

  useEffect(() => {
    let active = true;

    getFirebaseReviewData()
      .then((data) => {
        if (!active) return;

        setPending(data.pending);
        setAboutMe(data.aboutMe);
        setByMe(data.byMe);
        setError("");
      })
      .catch((cause) => {
        if (!active) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to load reviews."
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [retryCount]);

  /* Reload after submitting a review */

  function handleReload() {
    setLoading(true);
    setError("");
    setRetryCount((count) => count + 1);
  }

  function handleSubmitted() {
    setWriting(null);

    setNotice(
      "Your review was submitted privately. It will become visible when the reveal conditions are met."
    );

    handleReload();
  }

  const actions = pending.filter(
    (item) => !item.youSubmitted
  ).length;

  const average =
    aboutMe.length > 0
      ? aboutMe.reduce(
          (sum, review) =>
            sum + overallScore(review),
          0
        ) / aboutMe.length
      : 0;

  const shown =
    tab === "about-me" ? aboutMe : byMe;

  return (
    <>
      <PageHeader
        title="My reviews"
        subtitle="Reviews are hidden until both people submit or the review window ends."
      />

      {/* Loading */}

      {loading && (
        <Card>
          <div
            className="my-reviews__feedback"
            role="status"
          >
            <RefreshCw
              size={25}
              className="my-reviews__loading-icon"
            />

            <h3>Loading reviews...</h3>

            <p>
              Getting your roommate review history.
            </p>
          </div>
        </Card>
      )}

      {/* Error */}

      {!loading && error && (
        <Card>
          <div
            className="my-reviews__feedback"
            role="alert"
          >
            <AlertCircle size={28} />

            <h3>Unable to load reviews</h3>

            <p>{error}</p>

            <Button onClick={handleReload}>
              <RefreshCw size={16} />
              Try again
            </Button>
          </div>
        </Card>
      )}

      {/* Reviews */}

      {!loading && !error && (
        <div className="my-reviews">
          {notice && (
            <p
              className="my-reviews__notice"
              role="status"
            >
              {notice}
            </p>
          )}

          {/* Reviews waiting for you */}

          {pending.length > 0 && (
            <Card
              title="Reviews waiting for you"
              badge={
                actions > 0 ? (
                  <Badge variant="orange">
                    {actions}{" "}
                    {actions === 1
                      ? "action"
                      : "actions"}
                  </Badge>
                ) : undefined
              }
            >
              <div className="my-reviews__rows">
                {pending.map((item) => (
                  <WaitingReviewRow
                    key={item.connectionId}
                    pending={item}
                    onWrite={setWriting}
                  />
                ))}
              </div>
            </Card>
          )}

          {/* Published reviews */}

          <Card>
            <div className="my-reviews__bar">
              <div
                className="my-reviews__tabs"
                role="tablist"
                aria-label="Review type"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={
                    tab === "about-me"
                  }
                  className={`badge badge__filter${
                    tab === "about-me"
                      ? " is-active"
                      : ""
                  }`}
                  onClick={() =>
                    setTab("about-me")
                  }
                >
                  About me · {aboutMe.length}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "by-me"}
                  className={`badge badge__filter${
                    tab === "by-me"
                      ? " is-active"
                      : ""
                  }`}
                  onClick={() =>
                    setTab("by-me")
                  }
                >
                  Written by me · {byMe.length}
                </button>
              </div>

              {tab === "about-me" &&
                aboutMe.length > 0 && (
                  <div className="my-reviews__summary">
                    <strong>
                      {average.toFixed(1)}
                    </strong>

                    <StarRating value={average} />

                    <span>
                      {aboutMe.length} verified{" "}
                      {aboutMe.length === 1
                        ? "review"
                        : "reviews"}
                    </span>
                  </div>
                )}
            </div>

            <div className="my-reviews__list">
              {shown.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  perspective={tab}
                  onReport={
                    tab === "about-me"
                      ? reportFirebaseReview
                      : undefined
                  }
                />
              ))}

              {shown.length === 0 && (
                <p className="my-reviews__empty">
                  {tab === "about-me"
                    ? "No published reviews about you yet."
                    : "You haven't published any reviews yet."}
                </p>
              )}
            </div>
          </Card>

          {/* Refresh button */}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={handleReload}
            >
              <RefreshCw size={15} />
              Refresh reviews
            </Button>
          </div>
        </div>
      )}

      {/* Review popup */}

      {writing && (
        <WriteReviewDialog
          pending={writing}
          onClose={() => setWriting(null)}
          onSubmitted={handleSubmitted}
        />
      )}
    </>
  );
}