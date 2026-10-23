
import { useEffect, useState } from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Requests from "./Requests";

import WriteReviewDialog from "../components/WriteReviewDialog";

import {
  getFirebaseReviewData,
} from "../services/firebaseReviews";

import type { PendingReview } from "../types";

export default function WriteReview() {
  const { connectionId } = useParams<{
    connectionId: string;
  }>();

  const navigate = useNavigate();

  const [pending, setPending] =
    useState<PendingReview | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* Load the real Firebase review window */

  useEffect(() => {
    let active = true;

    getFirebaseReviewData()
      .then((data) => {
        if (!active) return;

        const review = data.pending.find(
          (item) =>
            item.connectionId === connectionId
        );

        if (!review) {
          setError(
            "This review is not available. It may already be submitted or the deadline may have passed."
          );
          return;
        }

        if (review.youSubmitted) {
          setError(
            "You already submitted this review."
          );
          return;
        }

        setPending(review);
      })
      .catch((cause) => {
        if (!active) return;

        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load this review."
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
  }, [connectionId]);

  function closeReview() {
    navigate("/requests");
  }

  function finishReview() {
    navigate("/reviews");
  }

  return (
    <>
      {/* Keep Requests behind the popup */}

      <Requests />

      {loading && (
        <div className="review-route__overlay">
          <div
            className="review-route__message"
            role="status"
          >
            Loading review...
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="review-route__overlay">
          <div
            className="review-route__message"
            role="alert"
          >
            <h3>Review unavailable</h3>

            <p>{error}</p>

            <button
              type="button"
              className="btn btn__primary"
              onClick={closeReview}
            >
              Back to requests
            </button>
          </div>
        </div>
      )}

      {!loading && pending && (
        <WriteReviewDialog
          pending={pending}
          onClose={closeReview}
          onSubmitted={finishReview}
        />
      )}
    </>
  );
}