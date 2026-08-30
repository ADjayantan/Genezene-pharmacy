import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getCustomers } from '@/lib/analytics';
import { RuleLabel } from '@/components/ui';

export const dynamic = 'force-dynamic';

const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (d: Date | null) =>
  d ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(d) : '—';

export default async function AdminCustomers() {
  await requireAdmin();
  const customers = await getCustomers(200);

  const withOrders = customers.filter((c) => c.orders > 0);
  const totalSpend = withOrders.reduce((s, c) => s + c.spent, 0);

  return (
    <div>
      <RuleLabel>Who buys from us</RuleLabel>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-[1.9rem]">Customers</h1>
        <p className="mono text-[0.7rem] uppercase tracking-[0.08em] text-ink-soft">
          {customers.length} registered · {withOrders.length} have ordered
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          ['Registered', String(customers.length), 'accounts'],
          ['Have ordered', String(withOrders.length),
            customers.length ? `${Math.round((withOrders.length / customers.length) * 100)}% of accounts` : '—'],
          ['Average spend', withOrders.length ? inr(totalSpend / withOrders.length) : '—', 'per buying customer'],
        ].map(([l, v, s]) => (
          <div key={l} className="rounded-[4px] border border-paper-edge bg-paper-deep p-5">
            <p className="mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">{l}</p>
            <p className="mono mt-2 text-[1.5rem] font-medium leading-none">{v}</p>
            <p className="mt-1.5 text-[0.75rem] text-ink-soft">{s}</p>
          </div>
        ))}
      </div>

      {customers.length === 0 ? (
        <p className="mt-8 rounded-[4px] border border-dashed border-paper-edge px-6 py-12 text-center text-[0.87rem] text-ink-soft">
          No registered customers yet.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-[4px] border border-paper-edge">
          <table className="w-full min-w-[720px] text-[0.85rem]">
            <thead>
              <tr>
                {['Customer', 'Contact', 'Orders', 'Total spent', 'Last order'].map((h) => (
                  <th key={h} className="mono border-b border-paper-edge px-4 py-3 text-left text-[0.62rem] font-medium uppercase tracking-[0.1em] text-ink-soft">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-paper-edge last:border-b-0">
                  <td className="px-4 py-3.5 font-medium">
                    <Link href={`/admin/customers/${c.id}`} className="text-green hover:underline">{c.name}</Link>
                  </td>
                  <td className="px-4 py-3.5">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="mono block text-[0.78rem] text-green hover:underline">{c.phone}</a>
                    )}
                    <a href={`mailto:${c.email}`} className="mono block text-[0.74rem] text-ink-soft hover:underline">{c.email}</a>
                  </td>
                  <td className="mono px-4 py-3.5">{c.orders}</td>
                  <td className="mono px-4 py-3.5">{c.spent > 0 ? inr(c.spent) : '—'}</td>
                  <td className="mono px-4 py-3.5 text-[0.78rem] text-ink-soft">{fmt(c.lastOrder)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* This is customer data, not a marketing list. Say so where someone
          might be tempted to export it. */}
      <p className="mt-4 text-[0.75rem] text-ink-soft">
        These are customers who created an account. Contact details are here so the pharmacy can
        follow up on an order — not for bulk marketing. Under Indian data-protection rules you need
        consent before using them for promotion.
      </p>
    </div>
  );
}
