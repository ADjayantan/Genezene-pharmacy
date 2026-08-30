/**
 * Inline SVG charts. No charting library — these are simple shapes, and a
 * library would add ~50 KB of client JS to a page that renders on the server.
 * Server Components, so they cost nothing on the client at all.
 */

export function BarChart({
  data, height = 120, format = (n: number) => `₹${Math.round(n)}`,
}: {
  data: { date: string; value: number }[];
  height?: number;
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / data.length;

  const label = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div>
      <div className="mono mb-2 flex justify-between text-[0.62rem] uppercase tracking-[0.08em] text-ink-soft">
        <span>{label(data[0]?.date ?? '')}</span>
        <span>peak {format(max)}</span>
        <span>{label(data.at(-1)?.date ?? '')}</span>
      </div>

      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={`Daily revenue over ${data.length} days, peak ${format(max)}`}
      >
        {/* Baseline and a midline, hairline weight — the house style uses
            rules rather than gridlines. */}
        <line x1="0" y1={height - 0.5} x2="100" y2={height - 0.5} stroke="var(--paper-edge)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1={height / 2} x2="100" y2={height / 2} stroke="var(--paper-edge)" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />

        {data.map((d, i) => {
          const h = d.value === 0 ? 0 : Math.max(2, (d.value / max) * (height - 6));
          return (
            <rect
              key={d.date}
              x={i * w + w * 0.18}
              y={height - h}
              width={w * 0.64}
              height={h}
              fill={d.value === 0 ? 'var(--paper-edge)' : 'var(--green)'}
            >
              <title>{`${label(d.date)}: ${format(d.value)}`}</title>
            </rect>
          );
        })}
      </svg>
    </div>
  );
}

/** Horizontal share bar — used for the lead-channel split. */
export function ShareBar({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (total === 0) return <p className="text-[0.85rem] text-ink-soft">No data yet.</p>;

  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden rounded-[2px]">
        {parts.filter((p) => p.value > 0).map((p) => (
          <div
            key={p.label}
            style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
            title={`${p.label}: ${p.value}`}
          />
        ))}
      </div>
      <div className="mono mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[0.7rem]">
        {parts.filter((p) => p.value > 0).map((p) => (
          <span key={p.label} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-[1px]" style={{ background: p.color }} />
            <span className="font-medium">{p.value}</span>
            <span className="text-ink-soft">{p.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
