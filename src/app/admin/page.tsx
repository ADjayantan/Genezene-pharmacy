import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { MoneySection } from '@/components/admin/sections/Money';
import { ExpirySection } from '@/components/admin/sections/Expiry';
import { RuleLabel } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const admin = await requireAdmin();

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86_400_000);

  const [newLeads, pendingOrders, rxPending, lowStock, expiredCount, expiringSoon] = await Promise.all([
    db.lead.count({ where: { status: 'NEW' } }),
    db.order.count({ where: { status: 'PENDING' } }),
    db.prescription.count({ where: { status: 'PENDING' } }),
    db.product.count({ where: { published: true, stock: { lte: 10 } } }),
    db.product.count({ where: { published: true, expiryDate: { not: null, lt: now } } }),
    db.product.count({ where: { published: true, expiryDate: { not: null, gte: now, lte: in30 } } }),
  ]);

  const expiryFlag = expiredCount + expiringSoon;
  const waiting = newLeads + pendingOrders + rxPending + lowStock + expiryFlag;

  return (
    <div className="space-y-12">
      <div>
        <RuleLabel>Back office · last 30 days</RuleLabel>
        <h1 className="mt-2 text-[1.9rem] font-semibold text-ink">Dashboard Overview</h1>
      </div>

      <section>
        <h2 className="mb-4 text-[1.2rem] font-medium">Needs you today</h2>
        {waiting === 0 ? (
          <p className="rounded-[4px] border-l-[3px] border-green bg-green-wash px-5 py-4 text-[0.87rem]">
            Nothing waiting. Everything has been actioned.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: 'Prescriptions to review', value: rxPending, href: '/admin/prescriptions', urgent: rxPending > 0 },
              { label: 'Orders to confirm', value: pendingOrders, href: '/admin/orders', urgent: pendingOrders > 0 },
              { label: 'Expired on shelf', value: expiredCount, href: '#s-expiry', urgent: expiredCount > 0 },
              { label: 'Low stock', value: lowStock, href: '/admin/products', urgent: lowStock > 0 },
              { label: 'New leads', value: newLeads, href: '/admin/leads', urgent: newLeads > 0 },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className={`rounded-[6px] border p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                  a.urgent
                    ? 'border-amber bg-amber-wash'
                    : 'border-paper-edge bg-paper-deep hover:border-green'
                }`}
              >
                <span className={`mono block text-[2rem] font-semibold leading-none ${a.urgent ? 'text-amber' : 'text-ink'}`}>
                  {a.value}
                </span>
                <span className="mt-2 block text-[0.8rem] font-medium text-ink">{a.label}</span>
              </Link>
            ))}
          </div>
        )}
        {expiredCount > 0 && (
          <p className="mono mt-4 rounded-[4px] border-l-[3px] border-out bg-out/5 px-4 py-3 text-[0.78rem] text-out">
            {expiredCount} product{expiredCount === 1 ? '' : 's'} past expiry — pull from the shelf before selling.{' '}
            <Link href="#s-expiry" className="underline font-semibold">See the list ↓</Link>
          </p>
        )}
      </section>

      <MoneySection />
      
      <div id="s-expiry">
        <ExpirySection />
      </div>
    </div>
  );
}
