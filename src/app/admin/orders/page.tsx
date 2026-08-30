import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { OrderStatusSelect } from './OrderStatusSelect';
import { RuleLabel } from '@/components/ui';
import { TrackingForm } from '@/components/admin/TrackingForm';
import { Timeline } from '@/components/Timeline';
import type { OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const TAG: Record<string, string> = {
  PENDING: 'bg-amber-wash text-amber',
  CONFIRMED: 'bg-green-wash text-green',
  PACKED: 'bg-paper-deep text-ink-soft',
  SHIPPED: 'bg-paper-deep text-ink-soft',
  DELIVERED: 'bg-green-wash text-in',
  CANCELLED: 'bg-out/10 text-out',
};

export default async function AdminOrders({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;

  const orders = await db.order.findMany({
    where: STATUSES.includes(sp.status as OrderStatus) ? { status: sp.status as OrderStatus } : undefined,
    include: {
      items: true,
      user: { select: { email: true } },
      events: { orderBy: { at: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const pill = (on: boolean) =>
    `rounded-[3px] border px-3.5 py-1.5 text-[0.8rem] capitalize transition-colors ${
      on ? 'border-green bg-green text-green-on font-semibold' : 'border-paper-edge text-ink-soft hover:border-green hover:text-green'
    }`;

  return (
    <div>
      <RuleLabel>Fulfilment</RuleLabel>
      <h1 className="mt-2 text-[1.9rem]">Orders</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        <a href="/admin/orders" className={pill(!sp.status)}>All</a>
        {STATUSES.map((s) => (
          <a key={s} href={`/admin/orders?status=${s}`} className={pill(sp.status === s)}>{s.toLowerCase()}</a>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 rounded-[4px] border border-dashed border-paper-edge px-6 py-12 text-center text-[0.87rem] text-ink-soft">
          No orders here yet.
        </p>
      ) : (
        // Cards, not table rows — there is too much detail per order for a
        // table to stay readable.
        <div className="mt-6 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-[4px] border border-paper-edge p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="mono text-[0.9rem] font-medium">{o.orderNo}</p>
                  <p className="mt-1 text-[0.85rem]">
                    {o.name} · <a href={`tel:${o.phone}`} className="mono text-green hover:underline">{o.phone}</a>
                    <span className="mono text-ink-soft"> · {o.user.email}</span>
                  </p>
                  <p className="mt-1 max-w-[28rem] text-[0.85rem] text-ink-soft">
                    {o.address}{o.pincode ? ` – ${o.pincode}` : ''}
                  </p>
                  {o.notes && <p className="mt-1 text-[0.85rem] italic text-ink-soft">“{o.notes}”</p>}
                </div>
                <div className="flex items-center gap-3">
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
                  <div className="mt-4">
                    <Timeline events={o.events} showActor />
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
