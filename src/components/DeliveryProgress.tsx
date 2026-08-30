import { site } from '@/lib/config';

/**
 * The goal-gradient effect: people move faster toward a goal they can see
 * getting closer. A bare sentence — "add ₹87 more" — states the fact; a
 * filling bar makes the remaining distance feel small.
 *
 * This is honest persuasion. The threshold is real, the saving is real, and
 * nobody is pressured — which is the line this project does not cross.
 */
export function DeliveryProgress({ subtotal }: { subtotal: number }) {
  const target = site.offers.freeDeliveryAbove;
  const reached = subtotal >= target;
  const pct = Math.min(100, (subtotal / target) * 100);

  return (
    <div className="mt-4">
      <div className="mono mb-1.5 flex items-baseline justify-between text-[0.7rem]">
        {reached ? (
          <span className="font-medium text-in">Free delivery unlocked</span>
        ) : (
          <span className="text-amber">Add ₹{(target - subtotal).toFixed(2)} for free delivery</span>
        )}
        <span className="text-ink-soft">₹{target}</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-[1px] bg-paper-edge"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progress towards free delivery"
      >
        <div
          className={`h-full transition-[width] duration-500 ${reached ? 'bg-in' : 'bg-amber'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
