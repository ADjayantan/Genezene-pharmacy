import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getCustomerDetail } from '@/lib/analytics';
import { RuleLabel } from '@/components/ui';

export const dynamic = 'force-dynamic';

const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (d: Date) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(d);

const ORDER_TONE: Record<string, string> = {
  DELIVERED: 'text-green', SHIPPED: 'text-green', CANCELLED: 'text-out',
};
const RX_TONE: Record<string, string> = {
  APPROVED: 'text-green', REJECTED: 'text-out', PENDING: 'text-ink-soft',
};

export default async function AdminCustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const c = await getCustomerDetail(id);
  if (!c) notFound();

  return (
    <div>
      <Link href="/admin/customers" className="mono text-[0.72rem] uppercase tracking-[0.08em] text-ink-soft hover:text-ink">
        ← All customers
      </Link>

      <RuleLabel className="mt-4">Customer</RuleLabel>
      <h1 className="mt-2 text-[1.9rem]">{c.name}</h1>

      {/* Contact + lifetime value, the two things you reach for on a call. */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Phone', c.phone ? <a href={`tel:${c.phone}`} className="text-green hover:underline">{c.phone}</a> : '—'],
          ['Email', <a key="e" href={`mailto:${c.email}`} className="text-green hover:underline break-all">{c.email}</a>],
          ['Orders', String(c.orders.length)],
          ['Lifetime spend', inr(c.totalSpent)],
        ].map(([l, v], i) => (
          <div key={i} className="rounded-[4px] border border-paper-edge bg-paper-deep p-4">
            <p className="mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">{l}</p>
            <p className="mono mt-2 text-[0.95rem] font-medium leading-snug">{v}</p>
          </div>
        ))}
      </div>

      {c.address && (
        <div className="mt-4 rounded-[4px] border border-paper-edge bg-paper-deep p-4">
          <p className="mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">Address on file</p>
          <p className="mt-1.5 text-[0.87rem] leading-relaxed">{c.address}</p>
        </div>
      )}
      <p className="mono mt-3 text-[0.7rem] text-ink-soft">Registered {fmt(c.joined)}</p>

      {/* Orders */}
      <RuleLabel className="mt-10">Order history</RuleLabel>
      {c.orders.length === 0 ? (
        <p className="mt-4 rounded-[4px] border border-dashed border-paper-edge px-6 py-10 text-center text-[0.87rem] text-ink-soft">
          No orders yet.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {c.orders.map((o) => (
            <div key={o.id} className="rounded-[4px] border border-paper-edge bg-paper-deep p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/admin/orders`} className="mono text-[0.9rem] font-medium hover:underline">
                  {o.orderNo}
                </Link>
                <span className={`mono text-[0.72rem] uppercase tracking-[0.08em] ${ORDER_TONE[o.status] ?? 'text-ink-soft'}`}>
                  {o.status}
                </span>
              </div>
              <div className="mono mt-1 flex flex-wrap gap-x-4 text-[0.74rem] text-ink-soft">
                <span>{fmt(o.createdAt)}</span>
                <span>{o.itemCount} item{o.itemCount === 1 ? '' : 's'}</span>
                <span>{inr(o.total)}</span>
              </div>
              <ul className="mono mt-2.5 space-y-1 border-t border-paper-edge pt-2.5 text-[0.78rem] text-ink-soft">
                {o.items.map((i, k) => (
                  <li key={k} className="flex justify-between gap-4">
                    <span>{i.name} × {i.qty}</span>
                    <span>{inr(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Prescriptions */}
      <RuleLabel className="mt-10">Prescriptions</RuleLabel>
      {c.prescriptions.length === 0 ? (
        <p className="mt-4 rounded-[4px] border border-dashed border-paper-edge px-6 py-10 text-center text-[0.87rem] text-ink-soft">
          No prescriptions uploaded.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-[4px] border border-paper-edge">
          <table className="w-full min-w-[520px] text-[0.85rem]">
            <thead>
              <tr>
                {['Uploaded', 'Patient', 'Status', ''].map((h) => (
                  <th key={h} className="mono border-b border-paper-edge px-4 py-2.5 text-left text-[0.62rem] font-medium uppercase tracking-[0.1em] text-ink-soft">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.prescriptions.map((rx) => (
                <tr key={rx.id} className="border-b border-paper-edge last:border-b-0">
                  <td className="mono px-4 py-3 text-[0.78rem] text-ink-soft">{fmt(rx.createdAt)}</td>
                  <td className="px-4 py-3">{rx.patientName ?? '—'}</td>
                  <td className={`mono px-4 py-3 text-[0.74rem] uppercase tracking-[0.06em] ${RX_TONE[rx.status] ?? 'text-ink-soft'}`}>{rx.status}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href="/admin/prescriptions" className="mono text-[0.74rem] text-green hover:underline">Review →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 text-[0.75rem] text-ink-soft">
        This record is for serving this customer — order follow-up, prescription review, delivery.
        It is not a marketing list. Under India&apos;s data-protection rules you need consent before
        using these details for promotion.
      </p>
    </div>
  );
}
