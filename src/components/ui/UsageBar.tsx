interface UsageBarProps {
  label: string;
  used: number;
  max: number;
  unit?: string;
}

export function UsageBar({ label, used, max, unit = '' }: UsageBarProps) {
  const unlimited = max === -1;
  const pct = unlimited ? 15 : Math.min(100, max > 0 ? (used / max) * 100 : 0);
  const high = !unlimited && pct >= 80;

  return (
    <div className="usage-bar">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-secondary">{label}</span>
        <span className="font-semibold" style={{ color: high ? '#ff9500' : 'var(--color-ink)' }}>
          {used} / {unlimited ? '∞' : max}{unit}
        </span>
      </div>
      <div className="usage-bar-track">
        <div
          className={`usage-bar-fill ${high ? 'usage-bar-fill-warn' : ''}`}
          style={{ width: unlimited ? '15%' : `${pct}%` }}
        />
      </div>
    </div>
  );
}
