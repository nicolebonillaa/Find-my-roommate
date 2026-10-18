interface ProgressBarProps {
  label: string; // "Review process"
  current: number;
  total: number;
}

export default function ProgressBar({ label, current, total }: ProgressBarProps) {
  const percent = total === 0 ? 0 : Math.min(100, (current / total) * 100);
  return (
    <div className="progress">
      <div className="progress__labels">
        <span>{label}</span>
        <strong>
          {current} of {total} submitted
        </strong>
      </div>
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}