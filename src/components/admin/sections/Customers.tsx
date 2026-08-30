import Link from 'next/link';
import { getCustomers } from '@/lib/analytics';
import { Section } from '@/components/admin/JumpNav';

const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (d: Date | null) =>
  d ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(d) : '—';

export async function CustomersSection() {
  const all = await getCustomers(200);
  const buyers = all.filter((c) => c.orders > 0);
  const spend = buyers.reduce((s, c) => s + c.spent, 0);

  return (
    <Section
      id="s-customers"
      label="Who buys from us"
      title="Customers"
      aside={
        <p className="mono text-[0.7rem] uppercase tracking-[0.08em] text-ink-soft">
          {all.length} registered · {buyers.length} have ordered
        </p>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Registered', String(all.length), 'accounts'],
          ['Have ordered', String(buyers.length), all.length ? `${Math.round((buyers.length / all.length) * 100)}% of accounts` : '—'],
          ['Average spend', buyers.length ? inr(spend / buyers.length) : '—', 'per buying customer'],
        ].map(([l, v, s]) => (
          <div key={l} className="rounded-[4px] border border-paper-edge bg-paper-deep p-5">
            <p className="mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">{l}</p>
            <p className="mono mt-2 text-[1.5rem] font-medium leading-none">{v}</p>
            <p className="mt-1.5 text-[0.75rem] text-ink-soft">{s}</p>
          </div>
        ))}
      </div>

      {all.length === 0 ? (
        <p className="mt-6 rounded-[4px] border border-dashed border-paper-edge px-6 py-10 text-center text-[0.87rem] text-ink-soft">
          No registered customers yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[4px] border border-paper-edge">
          <table className="w-full min-w-[680px] text-[0.85rem]">
            <thead>
              <tr>
                {['Customer', 'Contact', 'Orders', 'Total spent', 'Last order'].map((h) => (
                  <th key={h} className="mono border-b border-paper-edge px-4 py-2.5 text-left text-[0.62rem] font-medium uppercase tracking-[0.1em] text-ink-soft">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.slice(0, 25).map((c) => (
                <tr key={c.id} className="border-b border-paper-edge last:border-b-0">
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/customers/${c.id}`} className="text-green hover:underline">{c.name}</Link>
                  </td>
                  <td className="px-4 py-3">
                    {c.phone && <a href={`tel:${c.phone}`} className="mono block text-[0.78rem] text-green hover:underline">{c.phone}</a>}
                    <a href={`mailto:${c.email}`} className="mono block text-[0.74rem] text-ink-soft hover:underline">{c.email}</a>
                  </td>
                  <td className="mono px-4 py-3">{c.orders}</td>
                  <td className="mono px-4 py-3">{c.spent > 0 ? inr(c.spent) : '—'}</td>
                  <td className="mono px-4 py-3 text-[0.78rem] text-ink-soft">{fmt(c.lastOrder)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-[0.75rem] text-ink-soft">
        These details are here so the pharmacy can follow up on an order — not for bulk marketing.
        Under Indian data-protection rules you need consent before using them for promotion.
      </p>
    </Section>
  );
}
