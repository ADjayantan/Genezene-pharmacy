import Link from 'next/link';
import {
  getSales, getLoss, getDailyRevenue, getTopProducts, getStockAlerts, getCostCoverage,
} from '@/lib/analytics';
import { BarChart } from '@/components/admin/Chart';
import { Section } from '@/components/admin/JumpNav';

const inr = (n: number) =>
  '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Tile({ label, value, sub, warn }: { label: string; value: string; sub: string; warn?: boolean }) {
  return (
    <div className={`rounded-[4px] border border-paper-edge bg-paper-deep p-5 ${warn ? 'border-t-2 border-t-out' : ''}`}>
      <p className="mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">{label}</p>
      <p className={`mono mt-2 text-[1.5rem] font-medium leading-none tracking-[-0.02em] ${warn ? 'text-out' : ''}`}>{value}</p>
      <p className="mt-1.5 text-[0.75rem] text-ink-soft">{sub}</p>
    </div>
  );
}

export async function MoneySection() {
  const [sales, loss, daily, top, alerts, coverage] = await Promise.all([
    getSales(30), getLoss(30), getDailyRevenue(30), getTopProducts(30, 6),
    getStockAlerts(8), getCostCoverage(),
  ]);

  return (
    <Section id="s-money" label="Last 30 days" title="Sales & profit">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Revenue" value={inr(sales.revenue)} sub={`${sales.orders} orders`} />
        <Tile label="Cost of goods" value={sales.cost > 0 ? inr(sales.cost) : '—'} sub="where cost is recorded" />
        <Tile
          label="Gross profit"
          value={sales.marginPct === null ? '—' : inr(sales.grossProfit)}
          sub={sales.marginPct === null ? 'needs cost prices' : `${sales.marginPct.toFixed(1)}% margin`}
        />
        <Tile label="Average order" value={inr(sales.avgOrderValue)} sub={`${sales.itemsSold} items sold`} />
      </div>

      {/* Say plainly why a number is missing and how to fix it. A bare dash
          reads as a bug; this reads as a task. */}
      {coverage.missing > 0 && (
        <div className="mt-4 rounded-[4px] border border-amber bg-amber-wash px-5 py-4 text-[0.87rem] leading-relaxed">
          <b className="font-display mb-1 block font-semibold">
            Profit is only shown for products with a cost price.
          </b>
          {coverage.costed} of {coverage.total} have one.{' '}
          <a href="#s-products" className="font-semibold underline">Add the rest</a> and margin
          appears automatically. We deliberately do not estimate cost — a guessed margin is one
          you would price against.
        </div>
      )}

      <div className="mt-6 rounded-[4px] border border-paper-edge bg-paper-deep p-5">
        <p className="mono mb-4 text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">Revenue, daily</p>
        <BarChart data={daily} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Cancelled" value={inr(loss.cancelledValue)} sub={`${loss.cancelledOrders} orders`} warn={loss.cancelledOrders > 0} />
        <Tile label="Out of stock" value={String(loss.outOfStockSkus)} sub="products unsellable" warn={loss.outOfStockSkus > 0} />
        <Tile label="Low stock" value={String(loss.lowStockSkus)} sub="at or below reorder level" warn={loss.lowStockSkus > 0} />
        <Tile label="Stock at cost" value={loss.stockValueAtCost === null ? '—' : inr(loss.stockValueAtCost)} sub="capital on the shelf" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <p className="mono mb-3 border-t border-paper-edge pt-3 text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">
            Best sellers
          </p>
          {top.length === 0 ? (
            <p className="text-[0.87rem] text-ink-soft">No sales in this period yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-[4px] border border-paper-edge">
              <table className="w-full min-w-[380px] text-[0.85rem]">
                <thead>
                  <tr>
                    {['Product', 'Qty', 'Revenue', 'Profit'].map((h) => (
                      <th key={h} className="mono border-b border-paper-edge px-4 py-2.5 text-left text-[0.62rem] font-medium uppercase tracking-[0.1em] text-ink-soft">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {top.map((p) => (
                    <tr key={p.productId} className="border-b border-paper-edge last:border-b-0">
                      <td className="px-4 py-2.5">{p.name}</td>
                      <td className="mono px-4 py-2.5">{p.qty}</td>
                      <td className="mono px-4 py-2.5">{inr(p.revenue)}</td>
                      <td className={`mono px-4 py-2.5 ${p.profit === null ? 'text-ink-soft' : p.profit >= 0 ? 'text-in' : 'text-out'}`}>
                        {p.profit === null ? '—' : inr(p.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <p className="mono mb-3 border-t border-paper-edge pt-3 text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">
            Reorder soon
          </p>
          {alerts.length === 0 ? (
            <p className="text-[0.87rem] text-ink-soft">Nothing is running low.</p>
          ) : (
            <ul className="divide-y divide-paper-edge rounded-[4px] border border-paper-edge">
              {alerts.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <Link href={`/admin/products/${p.id}`} className="min-w-0 text-[0.87rem] hover:text-green">
                    <span className="block truncate">{p.name}</span>
                    {p.brand && <span className="block truncate text-[0.72rem] text-ink-soft">{p.brand}</span>}
                  </Link>
                  <span className={`mono shrink-0 text-[0.85rem] ${p.stock <= 0 ? 'text-out' : 'text-low'}`}>
                    {p.stock === 0 ? 'out of stock' : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Section>
  );
}
