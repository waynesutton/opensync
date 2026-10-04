// A relative usage indicator, never a billing or quota estimate.
export function UsageGauge({
  value,
  maximum,
  label,
}: {
  value: number;
  maximum: number;
  label: string;
}) {
  const ratio = maximum > 0 ? Math.min(1, Math.max(0, value / maximum)) : 0;
  return (
    <svg
      className="usage-gauge"
      width="28"
      height="28"
      viewBox="0 0 28 28"
      role="img"
      aria-label={label}
    >
      <circle
        className="usage-gauge-track"
        cx="14"
        cy="14"
        r="10"
        fill="none"
        strokeWidth="3"
      />
      <circle
        className="usage-gauge-value"
        cx="14"
        cy="14"
        r="10"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray={`${ratio * 100} 100`}
        transform="rotate(-90 14 14)"
      />
    </svg>
  );
}

export function formatUsage(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function exactUsage(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
