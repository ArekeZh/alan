type ProgressBarProps = {
  current: number;
  total: number;
  label: string;
  spokenLabel?: string;
};

export function ProgressBar({ current, total, label, spokenLabel }: ProgressBarProps) {
  const progress = total === 0 ? 0 : current / total;
  const ariaLabel = spokenLabel ?? label;

  return (
    <div
      className="progress"
      role="progressbar"
      data-hover-speak
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={ariaLabel}
    >
      <p className="progress-label">{label}</p>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}
