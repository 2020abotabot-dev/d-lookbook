"use client";

interface ProgressBarProps {
  value: number;   // 0–100
  label?: string;
  showPercent?: boolean;
}

export default function ProgressBar({ value, label, showPercent = true }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="progress">
      {(label || showPercent) && (
        <div className="progress__meta">
          {label && <span className="progress__label">{label}</span>}
          {showPercent && <span className="progress__pct">{pct}%</span>}
        </div>
      )}
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
