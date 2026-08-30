const LABEL: Record<string, string> = {
  PENDING: 'Order placed',
  CONFIRMED: 'Confirmed by pharmacist',
  PACKED: 'Packed',
  SHIPPED: 'Out for delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  APPROVED: 'Prescription approved',
  REJECTED: 'Prescription rejected',
};

/**
 * Status timeline, shared by order tracking and prescription review.
 * A vertical hairline with small square nodes — no filled discs, no icons,
 * consistent with the rest of the system.
 */
export function Timeline({
  events, showActor = false,
}: {
  events: { status: string; note?: string | null; actor?: string | null; at: Date }[];
  showActor?: boolean;
}) {
  if (events.length === 0) return null;

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
    }).format(d);

  return (
    <ol className="relative ml-1.5 border-l border-paper-edge">
      {events.map((e, i) => {
        const last = i === events.length - 1;
        const bad = e.status === 'CANCELLED' || e.status === 'REJECTED';
        return (
          <li key={`${e.status}-${e.at.toISOString()}-${i}`} className="relative pb-5 pl-5 last:pb-0">
            <span
              className={`absolute -left-[4.5px] top-[6px] h-2 w-2 rounded-[1px] ${
                bad ? 'bg-out' : last ? 'bg-green' : 'bg-paper-edge'
              }`}
              aria-hidden="true"
            />
            <p className={`text-[0.87rem] font-medium ${bad ? 'text-out' : ''}`}>
              {LABEL[e.status] ?? e.status}
            </p>
            <p className="mono mt-0.5 text-[0.7rem] text-ink-soft">
              {fmt(e.at)}
              {showActor && e.actor && ` · ${e.actor}`}
            </p>
            {e.note && <p className="mt-1 text-[0.82rem] text-ink-soft">{e.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
