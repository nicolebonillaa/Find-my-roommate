export default function StarRating({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      {"★".repeat(filled)}
      <span className="stars__empty">{"★".repeat(5 - filled)}</span>
    </span>
  );
}
