type ProgressBarProps = {
  current: number;
  total: number;
  label: string;
};

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const progress = total === 0 ? 0 : current / total;

  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={label}
    >
      <p className="progress-label">{label}</p>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
