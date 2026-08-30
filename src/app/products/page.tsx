import Link from 'next/link';
import type { Metadata } from 'next';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { buildMetadata, JsonLd, breadcrumbSchema } from '@/lib/seo';
import { ProductCard } from '@/components/ProductCard';
import { ButtonLink, EmptyState, RuleLabel } from '@/components/ui';

export const dynamic = 'force-dynamic';
const PAGE_SIZE = 24;

type SP = { q?: string; cat?: string; sort?: string; page?: string; rx?: string; stock?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;

  // Search, sort and pagination views are noindex. Indexing them creates
  // effectively infinite thin URLs and burns the crawl budget that should
  // be going to product and category pages.
  if (sp.q || sp.sort || sp.page) {
    return buildMetadata({
      title: sp.q ? `Search: ${sp.q}` : 'All products',
      description: 'Search results at Genezenz Pharmacy.',
      path: '/products',
      noIndex: true,
    });
  }

  if (sp.cat) {
    const cat = await db.category.findUnique({ where: { slug: sp.cat } }).catch(() => null);
    if (cat) {
      return buildMetadata({
        title: `Buy ${cat.name} Online in Coimbatore`,
        description: `Shop ${cat.name.toLowerCase()} at Genezenz Pharmacy, Ganapathy, Coimbatore. Genuine, pharmacist-verified, same-day dispatch and free delivery above ₹499.`,
        path: `/products?cat=${cat.slug}`,
      });
    }
  }

  return buildMetadata({
    title: 'Buy Medicines Online in Coimbatore — All Products',
    description:
      'Browse genuine medicines, vitamins, baby care and personal care at Genezenz Pharmacy, Coimbatore. Pharmacist-verified, same-day dispatch.',
    path: '/products',
  });
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.ProductWhereInput = { published: true };
  if (sp.q) {
    where.OR = [
      { name: { contains: sp.q, mode: 'insensitive' } },
      { brand: { contains: sp.q, mode: 'insensitive' } },
      { saltName: { contains: sp.q, mode: 'insensitive' } },
      { description: { contains: sp.q, mode: 'insensitive' } },
    ];
  }
  if (sp.cat) where.category = { slug: sp.cat };
  if (sp.rx === 'rx') where.rxRequired = true;
  // In-stock only: a shopper filtering this way is ready to buy — don't
  // show them things they can't add to the cart.
  if (sp.stock === 'in') where.stock = { gt: 0 };

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sp.sort === 'price-asc' ? { price: 'asc' }
    : sp.sort === 'price-desc' ? { price: 'desc' }
    : sp.sort === 'name' ? { name: 'asc' }
    : { createdAt: 'desc' };

  const [products, total, categories] = await Promise.all([
    db.product.findMany({ where, orderBy, take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE }).catch(() => []),
    db.product.count({ where }).catch(() => 0),
    db.category.findMany({ orderBy: { name: 'asc' } }).catch(() => []),
  ]);

  const pages = Math.ceil(total / PAGE_SIZE);
  const qs = (patch: Partial<SP>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) u.set(k, String(v));
    return `/products${u.toString() ? `?${u}` : ''}`;
  };

  const activeCat = categories.find((c) => c.slug === sp.cat);
  const heading = sp.q ? `Results for “${sp.q}”` : activeCat ? activeCat.name : 'All medicines & health products';

  const pillBase = 'rounded-[3px] border px-3.5 py-1.5 text-[0.8rem] transition-colors whitespace-nowrap';
  const pillOn = 'border-green bg-green text-green-on font-semibold';
  const pillOff = 'border-paper-edge text-ink-soft hover:border-green hover:text-green';

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: activeCat?.name ?? 'Products', path: sp.cat ? `/products?cat=${sp.cat}` : '/products' },
        ])}
      />

      <div className="container-x py-10">
        <RuleLabel>The counter</RuleLabel>
        <h1 className="mt-2 text-[clamp(1.9rem,4vw,2.6rem)]">{heading}</h1>
        <p className="mono mt-2 text-[0.72rem] uppercase tracking-[0.08em] text-ink-soft">
          {total} product{total === 1 ? '' : 's'} · sourced from licensed distributors
        </p>

        {/* Filter rail — hairlines above and below, no boxed container. */}
        <div className="mt-7 flex flex-wrap items-center gap-2 border-y border-paper-edge py-3">
          <Link href={qs({ cat: undefined, page: undefined })} className={`${pillBase} ${!sp.cat ? pillOn : pillOff}`}>
            All
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={qs({ cat: c.slug, page: undefined })} className={`${pillBase} ${sp.cat === c.slug ? pillOn : pillOff}`}>
              {c.name}
            </Link>
          ))}

          <Link
            href={qs({ stock: sp.stock === 'in' ? undefined : 'in', page: undefined })}
            aria-pressed={sp.stock === 'in'}
            className={`${pillBase} ${sp.stock === 'in' ? pillOn : pillOff}`}
          >
            {sp.stock === 'in' ? '✓ ' : ''}In stock only
          </Link>

          <div className="mono ml-auto flex gap-4 text-[0.7rem] uppercase tracking-[0.08em]">
            {[
              { k: '', label: 'Newest' },
              { k: 'price-asc', label: 'Price ↑' },
              { k: 'price-desc', label: 'Price ↓' },
              { k: 'name', label: 'A–Z' },
            ].map((s) => (
              <Link
                key={s.k}
                href={qs({ sort: s.k || undefined, page: undefined })}
                className={
                  (sp.sort ?? '') === s.k
                    ? 'text-ink underline decoration-amber decoration-2 underline-offset-[6px]'
                    : 'text-ink-soft hover:text-green'
                }
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          // An empty search is a lead opportunity, not a dead end.
          <EmptyState
            title="Nothing matches that."
            action={<ButtonLink href="/contact" tone="outline">Ask our pharmacist</ButtonLink>}
          >
            We can source most medicines, including ones we do not list online. Tell us what you
            need and we will find it.
          </EmptyState>
        ) : (
          <div className="mt-8 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                p={{
                  id: p.id, name: p.name, slug: p.slug,
                  price: Number(p.price), mrp: p.mrp ? Number(p.mrp) : null,
                  stock: p.stock, imageUrl: p.imageUrl, brand: p.brand, rxRequired: p.rxRequired,
                }}
              />
            ))}
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Pagination" className="mono mt-12 flex items-center justify-center gap-6 text-[0.75rem] uppercase tracking-[0.08em]">
            {page > 1 && <Link href={qs({ page: String(page - 1) })} className="hover:text-green">← Previous</Link>}
            <span className="text-ink-soft">Page {page} of {pages}</span>
            {page < pages && <Link href={qs({ page: String(page + 1) })} className="hover:text-green">Next →</Link>}
          </nav>
        )}
      </div>
    </>
  );
}
