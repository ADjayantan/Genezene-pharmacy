import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { DeleteProductButton } from '@/components/admin/DeleteProductButton';
import { ButtonLink, RuleLabel, inputClass } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminProducts({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin();
  const { q } = await searchParams;

  const products = await db.product.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
    include: { category: true },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  return (
    <div>
      <RuleLabel>Catalogue</RuleLabel>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[1.9rem]">Products ({products.length})</h1>
        <ButtonLink href="/admin/products/new" size="sm">+ Add product</ButtonLink>
      </div>

      <form className="mt-6 max-w-sm">
        <input name="q" defaultValue={q} placeholder="Search products…" className={inputClass} aria-label="Search products" />
      </form>

      {products.length === 0 ? (
        <p className="mt-8 rounded-[4px] border border-dashed border-paper-edge px-6 py-12 text-center text-[0.87rem] text-ink-soft">
          No products yet. Add your first one.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-[4px] border border-paper-edge">
          <table className="w-full min-w-[760px] text-[0.85rem]">
            <thead>
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="mono border-b border-paper-edge px-4 py-3 text-left text-[0.62rem] font-medium uppercase tracking-[0.1em] text-ink-soft">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-paper-edge last:border-b-0">
                  <td className="px-4 py-3.5">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-[0.7rem] text-ink-soft">
                      {p.brand}
                      {p.rxRequired && <span className="ml-2 text-plum">℞</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-ink-soft">{p.category?.name ?? '—'}</td>
                  <td className="mono px-4 py-3.5">₹{Number(p.price).toFixed(2)}</td>
                  {/* Stock is the column the client checks daily — zero has to
                      be visible while scanning, not read. */}
                  <td className={`mono px-4 py-3.5 ${p.stock <= 0 ? 'text-out' : p.stock <= 10 ? 'text-low' : ''}`}>
                    {p.stock}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`mono rounded-[2px] px-2 py-[0.15rem] text-[0.62rem] font-medium uppercase tracking-[0.06em] ${
                      p.published ? 'bg-green-wash text-green' : 'bg-paper-deep text-ink-soft'
                    }`}>
                      {p.published ? 'live' : 'hidden'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <Link href={`/admin/products/${p.id}`} className="font-semibold text-green hover:underline">Edit</Link>
                    <span className="px-2 text-paper-edge">|</span>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
