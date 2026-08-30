import Link from 'next/link';
import { getExpiryAlerts, type ExpiryRow } from '@/lib/analytics';
import { Section } from '@/components/admin/JumpNav';

const fmt = (d: Date) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(d);

function Row({ r, tone }: { r: ExpiryRow; tone: 'expired' | 'soon' | 'window' }) {
  const badge =
    tone === 'expired' ? 'bg-out text-paper'
    : tone === 'soon' ? 'bg-amber text-paper'
    : 'border border-paper-edge text-ink-soft';
  const label =
    r.daysLeft < 0 ? `expired ${Math.abs(r.daysLeft)}d ago`
    : r.daysLeft === 0 ? 'expires today'
    : `${r.daysLeft}d left`;

  return (
    <tr className="border-b border-paper-edge last:border-b-0">
      <td className="px-4 py-3">
        <Link href={`/admin/products/${r.id}`} className="font-medium text-green hover:underline">{r.name}</Link>
        {r.brand && <span className="mono ml-2 text-[0.72rem] text-ink-soft">{r.brand}</span>}
      </td>
      <td className="mono px-4 py-3 text-[0.78rem] text-ink-soft">{r.batchNo ?? '—'}</td>
      <td className="mono px-4 py-3 text-[0.78rem]">{fmt(r.expiryDate)}</td>
      <td className="mono px-4 py-3 text-[0.78rem]">{r.stock}</td>
      <td className="px-4 py-3">
        <span className={`mono inline-block rounded-[2px] px-2 py-0.5 text-[0.66rem] uppercase tracking-[0.04em] ${badge}`}>{label}</span>
      </td>
    </tr>
  );
}

/**
 * Near-expiry stock. A pharmacy may not sell expired medicine, so "expired"
 * is a red, act-now list — pull it from the shelf. "Within 30 days" is the
 * sell-first / return-to-distributor list. Ordered soonest-first.
 */
export async function ExpirySection() {
  const { expired, soon, window } = await getExpiryAlerts(60);
  const total = expired.length + soon.length + window.length;

  return (
    <Section
      id="s-expiry"
      label="Batch & shelf life"
      title="Expiry watch"
      aside={
        <p className="mono text-[0.7rem] uppercase tracking-[0.08em] text-ink-soft">
          {expired.length} expired · {soon.length} within 30 days
        </p>
      }
    >
      {total === 0 ? (
        <p className="rounded-[3px] border-l-[3px] border-green bg-green-wash px-5 py-4 text-[0.87rem]">
          Nothing expiring in the next 60 days. Set an expiry date on each product to keep this
          working.
        </p>
      ) : (
        <div className="space-y-6">
          {expired.length > 0 && (
            <div className="rounded-[4px] border border-out/40 bg-out/5">
              <p className="mono border-b border-out/30 px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.08em] text-out">
                Expired — pull from the shelf now
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-[0.85rem]">
                  <thead className="bg-out/10">
                    <tr className="text-left mono text-[0.66rem] uppercase tracking-wider text-out/70">
                      <th className="px-4 py-2 font-normal">Product</th>
                      <th className="px-4 py-2 font-normal">Batch</th>
                      <th className="px-4 py-2 font-normal">Expiry</th>
                      <th className="px-4 py-2 font-normal">Stock</th>
                      <th className="px-4 py-2 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>{expired.map((r) => <Row key={r.id} r={r} tone="expired" />)}</tbody>
                </table>
              </div>
            </div>
          )}

          {soon.length > 0 && (
            <div className="rounded-[4px] border border-paper-edge overflow-hidden">
              <p className="mono border-b border-paper-edge bg-amber-wash px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.08em] text-ink">
                Within 30 days — sell first or return to distributor
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-[0.85rem]">
                  <thead className="bg-paper-deep">
                    <tr className="border-b border-paper-edge text-left mono text-[0.66rem] uppercase tracking-wider text-ink-soft">
                      <th className="px-4 py-2 font-normal">Product</th>
                      <th className="px-4 py-2 font-normal">Batch</th>
                      <th className="px-4 py-2 font-normal">Expiry</th>
                      <th className="px-4 py-2 font-normal">Stock</th>
                      <th className="px-4 py-2 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>{soon.map((r) => <Row key={r.id} r={r} tone="soon" />)}</tbody>
                </table>
              </div>
            </div>
          )}

          {window.length > 0 && (
            <div className="rounded-[4px] border border-paper-edge overflow-hidden">
              <p className="mono border-b border-paper-edge px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.08em] text-ink-soft">
                31–60 days
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-[0.85rem]">
                  <thead className="bg-paper-deep">
                    <tr className="border-b border-paper-edge text-left mono text-[0.66rem] uppercase tracking-wider text-ink-soft">
                      <th className="px-4 py-2 font-normal">Product</th>
                      <th className="px-4 py-2 font-normal">Batch</th>
                      <th className="px-4 py-2 font-normal">Expiry</th>
                      <th className="px-4 py-2 font-normal">Stock</th>
                      <th className="px-4 py-2 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>{window.map((r) => <Row key={r.id} r={r} tone="window" />)}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Section>
  );
}
