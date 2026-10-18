import type { ReviewScores } from "../types";

export default function ScoreGrid({ scores }: { scores: ReviewScores }) {
  const items = [
    { label: "Cleanliness", value: scores.cleanlinessScore },
    { label: "Communication", value: scores.communicationScore },
    { label: "Noise", value: scores.noiseScore },
    { label: "Payments", value: scores.paymentScore },
  ];
  return (
    <div className="score-grid">
      {items.map((item) => (
        <div key={item.label} className="score-grid__item">
          <div className="score-grid__value">{item.value.toFixed(1)}</div>
          <div className="score-grid__label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}