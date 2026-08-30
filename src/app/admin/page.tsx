import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { JumpNav, Section } from '@/components/admin/JumpNav';
import { MoneySection } from '@/components/admin/sections/Money';
import { PrescriptionsSection } from '@/components/admin/sections/Prescriptions';
import { OrdersSection } from '@/components/admin/sections/Orders';
import { ProductsSection } from '@/components/admin/sections/Products';
import { CustomersSection } from '@/components/admin/sections/Customers';
import { LeadsSection } from '@/components/admin/sections/Leads';
import { ExpirySection } from '@/components/admin/sections/Expiry';
import { RuleLabel } from '@/components/ui';

export const dynamic = 'force-dynamic';

/**
 * The whole back office on one page.
 *
 * Tabs would be tidier to build, but this shop has one person running it. They
 * open this once in the morning and want the whole picture — what needs doing,
 * what sold, what to reorder, whose prescription is waiting — without hunting
 * through six screens. Sections are ordered by urgency, not by how the data
 * model happens to be arranged.
 *
 * The one thing that keeps its own route is the product editor: a twenty-field
 * form with an image gallery is genuinely better with the whole screen.
 */
export default async function AdminDashboard() {
  const admin = await requireAdmin();

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 86_400_000);

  const [newLeads, pendingOrders, rxPending, lowStock, expiredCount, expiringSoon] = await Promise.all([
    db.lead.count({ where: { status: 'NEW' } }),
    db.order.count({ where: { status: 'PENDING' } }),
    db.prescription.count({ where: { status: 'PENDING' } }),
    // Low stock: published items at or below their own reorder level.
    db.product.count({ where: { published: true, stock: { lte: 10 } } }),
    db.product.count({ where: { published: true, expiryDate: { not: null, lt: now } } }),
    db.product.count({ where: { published: true, expiryDate: { not: null, gte: now, lte: in30 } } }),
  ]);

  const expiryFlag = expiredCount + expiringSoon;
  const waiting = newLeads + pendingOrders + rxPending + lowStock + expiryFlag;

  return (
    <>
      <JumpNav
        items={[
          { id: 's-attention', label: 'Attention', count: waiting },
          { id: 's-money', label: 'Sales & profit' },
          { id: 's-rx', label: 'Prescriptions', count: rxPending },
          { id: 's-orders', label: 'Orders', count: pendingOrders },
          { id: 's-expiry', label: 'Expiry', count: expiryFlag },
          { id: 's-products', label: 'Products' },
          { id: 's-customers', label: 'Customers' },
          { id: 's-leads', label: 'Leads', count: newLeads },
        ]}
      />

      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <RuleLabel>Back office · last 30 days</RuleLabel>
          <h1 className="mt-2 text-[1.9rem]">Dashboard</h1>
        </div>
        <p className="mono text-[0.68rem] text-ink-soft">{admin.email}</p>
      </div>

      <Section id="s-attention" label="Needs you today" title="Attention">
        {waiting === 0 ? (
          <p className="rounded-[3px] border-l-[3px] border-green bg-green-wash px-5 py-4 text-[0.87rem]">
            Nothing waiting. Everything has been actioned.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: 'Prescriptions to review', value: rxPending, href: '#s-rx', urgent: rxPending > 0 },
              { label: 'Orders to confirm', value: pendingOrders, href: '#s-orders', urgent: pendingOrders > 0 },
              { label: 'Expired on shelf', value: expiredCount, href: '#s-expiry', urgent: expiredCount > 0 },
              { label: 'Low stock', value: lowStock, href: '#s-products', urgent: lowStock > 0 },
              { label: 'New leads', value: newLeads, href: '#s-leads', urgent: newLeads > 0 },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className={`rounded-[4px] border p-5 transition-colors ${
                  a.urgent
                    ? 'border-paper-edge border-t-2 border-t-amber bg-amber-wash'
                    : 'border-paper-edge bg-paper-deep hover:border-green'
                }`}
              >
                <span className="mono block text-[1.9rem] font-medium leading-none">{a.value}</span>
                <span className="mt-1.5 block text-[0.8rem] text-ink-soft">{a.label}</span>
              </Link>
            ))}
          </div>
        )}
        {expiredCount > 0 && (
          // Expired stock is a compliance issue, not a to-do. Say so loudly.
          <p className="mono mt-4 rounded-[3px] border-l-[3px] border-out bg-out/5 px-4 py-3 text-[0.78rem] text-out">
            {expiredCount} product{expiredCount === 1 ? '' : 's'} past expiry — pull from the shelf before selling.{' '}
            <Link href="#s-expiry" className="underline">See the list ↓</Link>
          </p>
        )}
      </Section>

      <MoneySection />
      <PrescriptionsSection />
      <OrdersSection />
      <ExpirySection />
      <ProductsSection />
      <CustomersSection />
      <LeadsSection />
    </>
  );
}
