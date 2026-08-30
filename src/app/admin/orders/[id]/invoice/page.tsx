import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { site, fullAddress } from '@/lib/config';
import { buildInvoice } from '@/lib/invoice';
import { PrintButton } from '@/components/admin/PrintButton';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

const inr = (n: number) => '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (d: Date) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' }).format(d);

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const order = await db.order.findUnique({
    where: { id },
    include: { items: true, user: { select: { email: true } } },
  });
  if (!order) notFound();

  const inv = buildInvoice(
    order.items.map((i) => ({
      name: i.name, qty: i.qty, price: Number(i.price),
      gstRate: i.gstRate != null ? Number(i.gstRate) : null,
    })),
    // Delivery is whatever of the order total isn't covered by the line items.
    Math.max(0, Number(order.total) - order.items.reduce((s, i) => s + Number(i.price) * i.qty, 0)),
  );

  const c = site.compliance;

  return (
    <div className="mx-auto max-w-[820px]">
      {/* Toolbar — screen only, never printed. */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/admin#s-orders" className="mono text-[0.72rem] uppercase tracking-[0.08em] text-ink-soft hover:text-ink">
          ← Back to orders
        </Link>
        <PrintButton />
      </div>

      {/* The invoice sheet. White, bordered, print-clean. */}
      <div className="rounded-[4px] border border-paper-edge bg-white p-8 text-ink print:rounded-none print:border-0 print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-5">
          <div>
            <h1 className="text-[1.5rem] font-semibold leading-tight">{site.legalName}</h1>
            <p className="mt-1 max-w-[22rem] text-[0.8rem] leading-relaxed text-ink-soft">{fullAddress()}</p>
            <p className="mono mt-2 text-[0.74rem] text-ink-soft">
              {site.phoneDisplay} · {site.email}
            </p>
          </div>
          <div className="text-right">
            <p className="mono text-[0.7rem] uppercase tracking-[0.14em] text-ink-soft">Tax Invoice</p>
            <p className="mono mt-1 text-[1.1rem] font-medium">{order.orderNo}</p>
            <p className="mono mt-1 text-[0.74rem] text-ink-soft">{fmt(order.createdAt)}</p>
          </div>
        </div>

        {/* Statutory identifiers. */}
        <div className="mono grid gap-1 border-b border-paper-edge py-3 text-[0.72rem] text-ink-soft sm:grid-cols-3">
          <span>{c.gstin}</span>
          <span>{c.drugLicence}</span>
          <span>{c.pharmacist}{c.pharmacistReg ? ` · ${c.pharmacistReg}` : ''}</span>
        </div>

        {/* Bill to. */}
        <div className="grid gap-4 py-4 sm:grid-cols-2">
          <div>
            <p className="mono text-[0.66rem] uppercase tracking-[0.1em] text-ink-soft">Bill to</p>
            <p className="mt-1.5 text-[0.9rem] font-medium">{order.name}</p>
            <p className="text-[0.8rem] leading-relaxed text-ink-soft">{order.address}{order.pincode ? ` – ${order.pincode}` : ''}</p>
            <p className="mono mt-1 text-[0.76rem] text-ink-soft">{order.phone}</p>
          </div>
          <div className="sm:text-right">
            <p className="mono text-[0.66rem] uppercase tracking-[0.1em] text-ink-soft">Payment</p>
            <p className="mt-1.5 text-[0.85rem]">{order.paymentMethod === 'COD' ? 'Cash on delivery' : order.paymentMethod}</p>
            <p className="mono mt-1 text-[0.76rem] text-ink-soft">Place of supply: {site.address.region}</p>
          </div>
        </div>

        {/* Line items. */}
        <table className="w-full border-collapse text-[0.8rem]">
          <thead>
            <tr className="border-y border-ink text-left">
              <th className="py-2 pr-2 font-medium">#</th>
              <th className="py-2 pr-2 font-medium">Item</th>
              <th className="py-2 pr-2 text-right font-medium">Qty</th>
              <th className="py-2 pr-2 text-right font-medium">Rate</th>
              <th className="py-2 pr-2 text-right font-medium">Taxable</th>
              <th className="py-2 pr-2 text-right font-medium">GST%</th>
              <th className="py-2 pl-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="mono">
            {inv.lines.map((l, i) => (
              <tr key={i} className="border-b border-paper-edge">
                <td className="py-2 pr-2 text-ink-soft">{i + 1}</td>
                <td className="py-2 pr-2 font-sans">{l.name}</td>
                <td className="py-2 pr-2 text-right">{l.qty}</td>
                <td className="py-2 pr-2 text-right">{inr(l.unit)}</td>
                <td className="py-2 pr-2 text-right">{inr(l.taxable)}</td>
                <td className="py-2 pr-2 text-right">{l.rate}%</td>
                <td className="py-2 pl-2 text-right">{inr(l.gross)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals + GST summary side by side. */}
        <div className="mt-5 flex flex-wrap justify-between gap-6">
          <div className="min-w-[15rem] flex-1">
            <p className="mono text-[0.66rem] uppercase tracking-[0.1em] text-ink-soft">Tax summary</p>
            <table className="mono mt-2 w-full text-[0.74rem]">
              <thead>
                <tr className="border-b border-paper-edge text-left text-ink-soft">
                  <th className="py-1 font-normal">Slab</th>
                  <th className="py-1 text-right font-normal">Taxable</th>
                  <th className="py-1 text-right font-normal">CGST</th>
                  <th className="py-1 text-right font-normal">SGST</th>
                </tr>
              </thead>
              <tbody>
                {inv.buckets.map((b) => (
                  <tr key={b.rate} className="border-b border-paper-edge/60">
                    <td className="py-1">{b.rate}%</td>
                    <td className="py-1 text-right">{inr(b.taxable)}</td>
                    <td className="py-1 text-right">{inr(b.cgst)}</td>
                    <td className="py-1 text-right">{inr(b.sgst)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="min-w-[15rem] flex-1">
            <dl className="mono space-y-1.5 text-[0.82rem]">
              <div className="flex justify-between"><dt className="text-ink-soft">Taxable value</dt><dd>{inr(inv.totalTaxable)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">CGST</dt><dd>{inr(inv.totalCgst)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">SGST</dt><dd>{inr(inv.totalSgst)}</dd></div>
              {inv.delivery > 0 && (
                <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd>{inr(inv.delivery)}</dd></div>
              )}
              <div className="mt-1 flex justify-between border-t-2 border-ink pt-2 text-[1rem] font-semibold">
                <dt>Total</dt><dd>{inr(inv.grandTotal)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <p className="mono mt-4 text-[0.74rem] text-ink-soft">
          <span className="uppercase tracking-[0.08em]">In words:</span> {inv.amountInWords}
        </p>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-paper-edge pt-4">
          <p className="max-w-[26rem] text-[0.7rem] leading-relaxed text-ink-soft">
            Prices are inclusive of GST. Goods once sold are returnable only per our returns policy.
            Medicines are non-returnable once dispensed except where defective. This is a
            computer-generated invoice.
          </p>
          <div className="text-right">
            <p className="mono text-[0.72rem] text-ink-soft">For {site.legalName}</p>
            <p className="mt-6 mono pt-8 text-[0.72rem]">Authorised signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
