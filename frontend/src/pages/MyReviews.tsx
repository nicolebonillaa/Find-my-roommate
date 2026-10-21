
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";

import {
  getPendingReviews,
  getReviewsAboutMe,
  getReviewsByMe,
  reportReview,
  useRequestData,
  useReviewRevision,
} from "../services/api";

import type { PendingReview, PublishedReview } from "../types";
import { overallScore } from "../utils/reviewScores";

import Badge from "../components/Badge";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import ReviewCard from "../components/ReviewCard";
import StarRating from "../components/Rating";
import WaitingReviewRow from "../components/WaitingReviewRow";
import WriteReviewDialog from "../components/WriteReviewDialog";

import "../styles/MyReviews.css";

type Tab = "about-me" | "by-me";

export default function MyReviews() {
  const { connections } = useRequestData();
  const reviewRevision = useReviewRevision();

  const [pending, setPending] = useState<PendingReview[]>([]);
  const [aboutMe, setAboutMe] = useState<PublishedReview[]>([]);
  const [byMe, setByMe] = useState<PublishedReview[]>([]);
  const [tab, setTab] = useState<Tab>("about-me");
  const [writing, setWriting] = useState<PendingReview | null>(null);
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Refresh reviews when a connection or review changes.
  useEffect(() => {
    let active = true;

    Promise.all([
      getPendingReviews(),
      getReviewsAboutMe(),
      getReviewsByMe(),
    ]).then(([pendingData, aboutData, byData]) => {
      if (!active) return;

      setPending(pendingData);
      setAboutMe(aboutData);
      setByMe(byData);
      setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [connections, reviewRevision]);

  const actions = pending.filter(
    (item) => !item.youSubmitted
  ).length;

  const hidden = pending.filter(
    (item) => !item.youSubmitted && item.submittedCount > 0
  );

  const average = aboutMe.length
    ? aboutMe.reduce(
        (sum, review) => sum + overallScore(review),
        0
      ) / aboutMe.length
    : 0;

  const shown = tab === "about-me" ? aboutMe : byMe;

  return (
    <>
      <PageHeader
        title="My reviews"
        subtitle="Reviews are hidden until both people submit or the review window ends."
      />

      {!loaded ? (
        <p className="my-reviews__empty">Loading reviews...</p>
      ) : (
        <div className="my-reviews">
          {notice && (
            <p className="my-reviews__notice" role="status">
              {notice}
            </p>
          )}

          {/* Reviews that are still in progress */}
          {pending.length > 0 && (
            <Card
              title="Reviews waiting for you"
              badge={
                actions > 0 ? (
                  <Badge variant="orange">
                    {actions} action{actions === 1 ? "" : "s"}
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
                  aria-selected={tab === "about-me"}
                  className={`badge badge__filter${
                    tab === "about-me" ? " is-active" : ""
                  }`}
                  onClick={() => setTab("about-me")}
                >
                  About me · {aboutMe.length}
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "by-me"}
                  className={`badge badge__filter${
                    tab === "by-me" ? " is-active" : ""
                  }`}
                  onClick={() => setTab("by-me")}
                >
                  Written by me · {byMe.length}
                </button>
              </div>

              {tab === "about-me" && aboutMe.length > 0 && (
                <div className="my-reviews__summary">
                  <strong>{average.toFixed(1)}</strong>
                  <StarRating value={average} />
                  <span>
                    {aboutMe.length} verified review
                    {aboutMe.length === 1 ? "" : "s"}
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
                      ? reportReview
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

              {tab === "about-me" &&
                hidden.map((item) => (
                  <div
                    key={item.connectionId}
                    className="locked my-reviews__locked"
                  >
                    <Lock size={18} aria-hidden="true" />
                    <span>
                      <strong>
                        {item.roommate.name.split(" ")[0]}
                        &apos;s review of you
                      </strong>{" "}
                      stays hidden until both people submit
                      or the review deadline ends.
                    </span>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {writing && (
        <WriteReviewDialog
          pending={writing}
          onClose={() => setWriting(null)}
          onSubmitted={() => {
            setWriting(null);
            setNotice(
              "Your review was submitted privately. It will appear when published."
            );
          }}
        />
      )}
    </>
  );
}