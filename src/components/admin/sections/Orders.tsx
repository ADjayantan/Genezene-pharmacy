import Link from 'next/link';
import { db } from '@/lib/db';
import { OrderStatusSelect } from '@/app/admin/orders/OrderStatusSelect';
import { TrackingForm } from '@/components/admin/TrackingForm';
import { Timeline } from '@/components/Timeline';
import { Section } from '@/components/admin/JumpNav';

const TAG: Record<string, string> = {
  PENDING: 'bg-amber-wash text-amber',
  CONFIRMED: 'bg-green-wash text-green',
  PACKED: 'bg-paper-deep text-ink-soft',
  SHIPPED: 'bg-paper-deep text-ink-soft',
  DELIVERED: 'bg-green-wash text-in',
  CANCELLED: 'bg-out/10 text-out',
};

export async function OrdersSection() {
  const [orders, total] = await Promise.all([
    db.order.findMany({
      include: { items: true, user: { select: { email: true } }, events: { orderBy: { at: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    db.order.count(),
  ]);

  return (
    <Section
      id="s-orders"
      label="Fulfilment"
      title="Orders"
      aside={
        <p className="mono text-[0.7rem] uppercase tracking-[0.08em] text-ink-soft">
          {total} total · newest first
        </p>
      }
    >
      {orders.length === 0 ? (
        <p className="rounded-[4px] border border-dashed border-paper-edge px-6 py-10 text-center text-[0.87rem] text-ink-soft">
          No orders yet.
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className={`rounded-[4px] border border-paper-edge p-5 ${o.status === 'PENDING' ? 'border-t-2 border-t-amber' : ''}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mono flex items-center gap-3 text-[0.9rem] font-medium">
                    {o.orderNo}
                    <Link
                      href={`/admin/orders/${o.id}/invoice`}
                      className="mono text-[0.66rem] font-normal uppercase tracking-[0.08em] text-green hover:underline"
                    >
                      Invoice ↗
                    </Link>
                  </p>
                  <p className="mt-1 text-[0.85rem]">
                    {o.name} · <a href={`tel:${o.phone}`} className="mono text-green hover:underline">{o.phone}</a>
                    <span className="mono text-ink-soft"> · {o.user.email}</span>
                  </p>
                  <p className="mt-1 max-w-[28rem] text-[0.85rem] text-ink-soft">
                    {o.address}{o.pincode ? ` – ${o.pincode}` : ''}
                  </p>
                  {o.notes && <p className="mt-1 text-[0.85rem] italic text-ink-soft">“{o.notes}”</p>}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`mono rounded-[2px] px-2 py-[0.15rem] text-[0.62rem] font-medium uppercase tracking-[0.06em] ${TAG[o.status]}`}>
                    {o.status.toLowerCase()}
                  </span>
                  <span className="mono text-[0.95rem] font-medium">₹{Number(o.total).toFixed(2)}</span>
                  <OrderStatusSelect id={o.id} status={o.status} />
                </div>
              </div>

              <ul className="mono mt-3 space-y-1 border-t border-paper-edge pt-3 text-[0.82rem] text-ink-soft">
                {o.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-4">
                    <span>{i.name} × {i.qty}</span>
                    <span>₹{(Number(i.price) * i.qty).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <p className="mono mt-3 text-[0.68rem] text-ink-soft">
                {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(o.createdAt)}
                {o.costTotal != null && (
                  <> · margin{' '}
                    <span className={Number(o.total) - Number(o.costTotal) >= 0 ? 'text-in' : 'text-out'}>
                      ₹{(Number(o.total) - Number(o.costTotal)).toFixed(2)}
                    </span>
                  </>
                )}
              </p>

              <TrackingForm
                orderId={o.id}
                courier={o.courier}
                trackingId={o.trackingId}
                trackingUrl={o.trackingUrl}
                expectedAt={o.expectedAt}
              />

              {o.events.length > 0 && (
                <details className="mt-4 border-t border-paper-edge pt-4">
                  <summary className="mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">
                    History ({o.events.length})
                  </summary>
                  <div className="mt-4"><Timeline events={o.events} showActor /></div>
                </details>
              )}
            </div>
          ))}

          {total > 8 && (
            <p className="mono py-3 text-center text-[0.72rem] text-ink-soft">
              Showing the 8 most recent of {total}.
            </p>
          )}
        </div>
      )}
    </Section>
  );
}
