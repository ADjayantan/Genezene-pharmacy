import Link from 'next/link';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';
import { BuyAgain } from '@/components/BuyAgain';
import type { CartLine } from '@/components/CartProvider';
import { ButtonLink, EmptyState, RuleLabel } from '@/components/ui';

export const metadata: Metadata = { title: 'My account', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const TAG: Record<string, string> = {
  PENDING: 'bg-amber-wash text-amber',
  CONFIRMED: 'bg-green-wash text-green',
  PACKED: 'bg-paper-deep text-ink-soft',
  SHIPPED: 'bg-paper-deep text-ink-soft',
  DELIVERED: 'bg-green-wash text-in',
  CANCELLED: 'bg-out/10 text-out',
  APPROVED: 'bg-green-wash text-in',
  REJECTED: 'bg-out/10 text-out',
};

const Tag = ({ s }: { s: string }) => (
  <span className={`mono rounded-[2px] px-2 py-[0.15rem] text-[0.62rem] font-medium uppercase tracking-[0.06em] ${TAG[s] ?? ''}`}>
    {s.toLowerCase()}
  </span>
);

const fmt = (d: Date) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(d);

export default async function ProfilePage() {
  const session = await requireUser('/profile');

  const [user, orders, prescriptions] = await Promise.all([
    db.user.findUnique({ where: { id: session.sub }, select: { name: true, email: true } }),
    db.order.findMany({ where: { userId: session.sub }, include: { items: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
    db.prescription.findMany({
      where: { userId: session.sub },
      include: { order: { select: { orderNo: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);
  if (!user) redirect('/login');

  // Resolve each order's items to CURRENT products so "Buy again" only offers
  // what can actually be bought today (published, in stock).
  const orderedIds = [...new Set(orders.flatMap((o) => o.items.map((i) => i.productId)))];
  const live = orderedIds.length
    ? await db.product.findMany({
        where: { id: { in: orderedIds }, published: true },
        select: { id: true, slug: true, name: true, price: true, imageUrl: true, rxRequired: true, stock: true },
      })
    : [];
  const liveById = new Map(live.map((p) => [p.id, p]));
  const buyAgainFor = (o: (typeof orders)[number]): Omit<CartLine, 'qty'>[] =>
    o.items
      .map((i) => liveById.get(i.productId))
      .filter((p): p is NonNullable<typeof p> => Boolean(p) && p!.stock > 0)
      .map((p) => ({
        id: p.id, slug: p.slug, name: p.name, price: Number(p.price),
        imageUrl: p.imageUrl, rxRequired: p.rxRequired, stock: p.stock,
      }));

  return (
    <div className="container-x py-12 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <RuleLabel>Your account</RuleLabel>
          <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.4rem)]">Hello, {user.name.split(' ')[0]}</h1>
          <p className="mono mt-1 text-[0.78rem] text-ink-soft">{user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Only for an ADMIN session. This markup is never sent to a
              customer, so the panel stays invisible to everyone else. */}
          {session.role === 'ADMIN' && (
            <ButtonLink href="/admin" size="sm">Back office</ButtonLink>
          )}
          <LogoutButton />
        </div>
      </div>

      {/* NOTIFICATIONS: Approved Prescriptions needing orders */}
      {(() => {
        const approvedRx = prescriptions.filter(rx => rx.status === 'APPROVED' && !rx.order);
        if (approvedRx.length === 0) return null;
        return (
          <section className="mt-8 rounded-[4px] border border-green bg-green-wash p-5">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 text-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-[1.1rem] font-medium text-green-on">Prescription Approved</h3>
                <p className="mt-1 text-[0.87rem] text-ink-soft">
                  {approvedRx.length === 1 
                    ? `Your prescription "${approvedRx[0].originalName || 'Prescription'}" has been verified by our pharmacist.` 
                    : `You have ${approvedRx.length} prescriptions verified by our pharmacist.`} 
                  You can now add prescription medicines to your cart and checkout.
                </p>
                <div className="mt-4">
                  <ButtonLink href="/products" size="sm" className="bg-green text-green-on">
                    Order medicines now →
                  </ButtonLink>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      <section className="mt-12">
        <RuleLabel>My orders</RuleLabel>
        {orders.length === 0 ? (
          <EmptyState title="No orders yet" action={<ButtonLink href="/products">Browse the counter</ButtonLink>} />
        ) : (
          <div className="mt-5 space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-[4px] border border-paper-edge p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="mono text-[0.9rem] font-medium">{o.orderNo}</p>
                    <p className="mono mt-0.5 text-[0.7rem] text-ink-soft">{fmt(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag s={o.status} />
                    <span className="mono text-[0.95rem] font-medium">₹{Number(o.total).toFixed(2)}</span>
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
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link href={`/order/${o.orderNo}`} className="text-[0.82rem] font-semibold text-green hover:underline">
                    Track order →
                  </Link>
                  <BuyAgain lines={buyAgainFor(o)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <RuleLabel className="flex-1">My prescriptions</RuleLabel>
          <Link href="/upload-prescription" className="shrink-0 text-[0.85rem] font-semibold text-green">
            Upload new →
          </Link>
        </div>
        {prescriptions.length === 0 ? (
          <EmptyState title="No prescriptions uploaded yet" action={<ButtonLink href="/upload-prescription" tone="outline">Upload a prescription</ButtonLink>} />
        ) : (
          <div className="mt-5 space-y-3">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="rounded-[4px] border border-paper-edge p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display truncate text-[0.95rem] font-medium">
                      {rx.originalName || 'Prescription'}
                    </p>
                    <p className="mono mt-0.5 text-[0.7rem] text-ink-soft">
                      {fmt(rx.createdAt)}{rx.doctorName && ` · Dr. ${rx.doctorName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag s={rx.status} />
                    <a href={`/api/prescriptions/file/${rx.id}`} target="_blank" rel="noopener noreferrer" className="text-[0.85rem] font-semibold text-green hover:underline">
                      View
                    </a>
                  </div>
                </div>
                {/* The pharmacist's note is the entire point of the review
                    workflow. Give it real weight rather than burying it. */}
                {rx.order && (
                  <p className="mono mt-2 text-[0.72rem] text-ink-soft">
                    Dispensed against order <span className="text-ink">{rx.order.orderNo}</span>
                  </p>
                )}
                {rx.reviewNote && (
                  <div className="mt-3 border-l-[3px] border-green bg-paper-deep px-4 py-3">
                    <p className="mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">Pharmacist</p>
                    <p className="mt-1 text-[0.87rem]">{rx.reviewNote}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
