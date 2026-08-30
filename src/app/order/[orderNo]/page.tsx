import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { site } from '@/lib/config';
import { ButtonLink, RuleLabel } from '@/components/ui';
import { Timeline } from '@/components/Timeline';

export const metadata: Metadata = { title: 'Order confirmed', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: Promise<{ orderNo: string }> }) {
  const session = await requireUser();
  const { orderNo } = await params;

  const order = await db.order.findUnique({
    where: { orderNo },
    include: { items: true, events: { orderBy: { at: 'asc' } } },
  });

  // Ownership, not just existence. Guessing an order number must never expose
  // another customer's address and phone number.
  if (!order || (order.userId !== session.sub && session.role !== 'ADMIN')) notFound();

  return (
    <div className="container-x max-w-[42rem] py-16 pb-24">
      <div className="rounded-[4px] border border-green bg-green-wash px-8 py-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-[3px] bg-green">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green-on)" strokeWidth="2" strokeLinecap="square" aria-hidden="true">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-5 text-[1.75rem]">Order placed</h1>
        <p className="mono mt-2 text-[0.92rem]">
          {order.orderNo} · ₹{Number(order.total).toFixed(2)}
        </p>
        <p className="mx-auto mt-4 max-w-[42ch] text-[0.9rem] leading-relaxed text-ink-soft">
          Our pharmacist will call you on {order.phone} to confirm. Orders placed before{' '}
          {site.offers.dispatchCutoff} are dispatched the same day.
        </p>
      </div>

      <div className="mt-8 rounded-[4px] border border-paper-edge p-6">
        <RuleLabel className="border-t-0 pt-0">Items</RuleLabel>
        <ul className="mono mt-4 space-y-2 text-[0.85rem]">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4">
              <span className="text-ink-soft">{i.name} × {i.qty}</span>
              <span>₹{(Number(i.price) * i.qty).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-paper-edge pt-4">
          <p className="mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">Delivering to</p>
          <p className="mono mt-1.5 text-[0.85rem] leading-loose">
            {order.address}{order.pincode ? ` – ${order.pincode}` : ''}
          </p>
        </div>
      </div>

      {/* Tracking, shown only once there is something real to show. An empty
          "tracking" panel makes a customer think something is broken. */}
      {(order.courier || order.trackingId || order.expectedAt) && (
        <div className="mt-6 rounded-[4px] border border-paper-edge border-t-2 border-t-green p-6">
          <RuleLabel className="border-t-0 pt-0">Delivery</RuleLabel>
          <dl className="mono mt-4 space-y-2 text-[0.85rem]">
            {order.courier && (
              <div className="flex justify-between gap-4"><dt className="text-ink-soft">Courier</dt><dd>{order.courier}</dd></div>
            )}
            {order.trackingId && (
              <div className="flex justify-between gap-4"><dt className="text-ink-soft">Tracking ID</dt><dd>{order.trackingId}</dd></div>
            )}
            {order.expectedAt && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Expected</dt>
                <dd>{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(order.expectedAt)}</dd>
              </div>
            )}
          </dl>
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-[0.85rem] font-semibold text-green hover:underline">
              Track with the courier →
            </a>
          )}
        </div>
      )}

      {order.events.length > 0 && (
        <div className="mt-6 rounded-[4px] border border-paper-edge p-6">
          <RuleLabel className="border-t-0 pt-0">Progress</RuleLabel>
          <div className="mt-5">
            <Timeline events={order.events} />
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/profile">View my orders</ButtonLink>
        <ButtonLink href="/products" tone="outline">Continue shopping</ButtonLink>
      </div>
    </div>
  );
}
