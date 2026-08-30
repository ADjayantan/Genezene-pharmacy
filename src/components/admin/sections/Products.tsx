import Link from 'next/link';
import { db } from '@/lib/db';
import { getCostCoverage } from '@/lib/analytics';
import { DeleteProductButton } from '@/components/admin/DeleteProductButton';
import { ButtonLink } from '@/components/ui';
import { Section } from '@/components/admin/JumpNav';

/**
 * The list lives on the dashboard; the full editor keeps its own route.
 *
 * That split is deliberate. Everything the pharmacist needs to *see* is on one
 * page, but a twenty-field form with an image gallery is genuinely better with
 * the whole screen — and it means an accidental back-navigation while editing
 * doesn't scroll them away from the rest of the dashboard.
 */
export async function ProductsSection() {
  const [products, total, coverage] = await Promise.all([
    db.product.findMany({
      include: { category: true },
      orderBy: { updatedAt: 'desc' },
      take: 15,
    }),
    db.product.count(),
    getCostCoverage(),
  ]);

  return (
    <Section
      id="s-products"
      label="Catalogue"
      title="Products"
      aside={<ButtonLink href="/admin/products/new" size="sm">+ Add product</ButtonLink>}
    >
      {coverage.missing > 0 && (
        <div className="mb-5 rounded-[4px] border border-amber bg-amber-wash px-5 py-4 text-[0.87rem] leading-relaxed">
          <b className="font-display mb-1 block font-semibold">
            {coverage.missing} products have no cost price.
          </b>
          They show <b>— not set</b> and are left out of profit rather than estimated. A guessed
          margin is one the shop would price against.
        </div>
      )}

      {total === 0 ? (
        <p className="rounded-[4px] border border-dashed border-paper-edge px-6 py-10 text-center text-[0.87rem] text-ink-soft">
          No products yet. Add your first one.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-[4px] border border-paper-edge">
            <table className="w-full min-w-[820px] text-[0.85rem]">
              <thead>
                <tr>
                  {['Product', 'Category', 'Cost', 'Price', 'Margin', 'Stock', 'Images', 'Actions'].map((h) => (
                    <th key={h} className="mono whitespace-nowrap border-b border-paper-edge px-4 py-2.5 text-left text-[0.62rem] font-medium uppercase tracking-[0.1em] text-ink-soft">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const price = Number(p.price);
                  const cost = p.costPrice == null ? null : Number(p.costPrice);
                  const margin = cost === null ? null : ((price - cost) / price) * 100;
                  return (
                    <tr key={p.id} className="border-b border-paper-edge last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-[0.7rem] text-ink-soft">
                          {p.brand}
                          {p.rxRequired && <span className="ml-2 text-plum">℞</span>}
                          {!p.published && <span className="ml-2">hidden</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-soft">{p.category?.name ?? '—'}</td>
                      <td className={`mono px-4 py-3 ${cost === null ? 'text-ink-soft' : ''}`}>
                        {cost === null ? '— not set' : `₹${cost.toFixed(2)}`}
                      </td>
                      <td className="mono px-4 py-3">₹{price.toFixed(2)}</td>
                      <td className={`mono px-4 py-3 ${margin === null ? 'text-ink-soft' : margin >= 25 ? 'text-in' : 'text-low'}`}>
                        {margin === null ? '—' : `${margin.toFixed(0)}%`}
                      </td>
                      <td className={`mono px-4 py-3 ${p.stock <= 0 ? 'text-out' : p.stock <= p.reorderLevel ? 'text-low' : ''}`}>
                        {p.stock}
                      </td>
                      <td className="mono px-4 py-3 text-ink-soft">{p.images.length || '—'}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link href={`/admin/products/${p.id}`} className="font-semibold text-green hover:underline">Edit</Link>
                        <span className="px-2 text-paper-edge">|</span>
                        <DeleteProductButton id={p.id} name={p.name} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {total > 15 && (
            <p className="mono mt-3 text-center text-[0.72rem] text-ink-soft">
              Showing 15 most recently updated of {total}.{' '}
              <Link href="/admin/products" className="text-green hover:underline">Search all products →</Link>
            </p>
          )}
        </>
      )}
    </Section>
  );
}
