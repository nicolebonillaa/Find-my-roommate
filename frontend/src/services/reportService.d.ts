export function reportReview(data: {
  reviewId: string;
  reason: string;
  explanation: string;
}): Promise<{
  id: string;
  status: "open";
}>;
