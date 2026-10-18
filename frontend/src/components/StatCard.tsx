interface StatCardProps {
  label: string;
  value: string | number;
  note: string;
  icon: string;
}

export default function StatCard({ label, value, note, icon }: StatCardProps) {
  return (
    <div className="card stat-card">
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__icon" aria-hidden="true">{icon}</span>
      </div>
      <div className="stat-card__value">{value}</div>
      <div className="stat-card__note">{note}</div>
    </div>
  );
}