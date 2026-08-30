import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { site } from '@/lib/config';
import { buildMetadata, JsonLd, productSchema, breadcrumbSchema } from '@/lib/seo';
import { AddToCart } from '@/components/AddToCart';
import { ProductCard } from '@/components/ProductCard';
import { BoughtTogether } from '@/components/BoughtTogether';
import { getSimilarProducts, getBoughtTogether } from '@/lib/recommendations';
import { LabelBand, MortarGlyph, Note, Price, RuleLabel, StockLine, Struck, Tag } from '@/components/ui';
import { StickyBuyBar } from '@/components/StickyBuyBar';
import { BackInStock } from '@/components/BackInStock';

export const revalidate = 300;

/**
 * Prerender every published product at build time.
 *
 * Without this, the build marks /products/[slug] as dynamic — server-rendered
 * on every request. These 124 pages are the ones that have to rank, so they
 * should be static HTML with instant TTFB, exactly like the area pages.
 *
 * `revalidate` above keeps them fresh: a price or stock change is picked up
 * within five minutes without a rebuild, and a product added later is rendered
 * on first request rather than 404ing.
 *
 * The catch matters. The database is often unreachable at build time — a CI
 * runner without network, or a first local build before `prisma db push`. That
 * must degrade to "prerender nothing" rather than failing the whole build.
 */
export async function generateStaticParams() {
  try {
    const products = await db.product.findMany({
      where: { published: true },
      select: { slug: true },
      take: 1000,
    });
    return products.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

const getProduct = (slug: string) =>
  db.product.findFirst({ where: { slug, published: true }, include: { category: true } }).catch(() => null);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: 'Product not found' };

  return buildMetadata({
    // Per-product overrides let the client tune a page that isn't ranking
    // without a developer touching the code.
    title: p.metaTitle || `${p.name} — Price & Availability | Buy Online in Coimbatore`,
    description:
      p.metaDescription ||
      `Buy ${p.name}${p.brand ? ` by ${p.brand}` : ''} online at Genezenz Pharmacy, Coimbatore. ₹${Number(p.price).toFixed(2)}. Genuine, pharmacist-verified, same-day dispatch.`,
    path: `/products/${p.slug}`,
    image: p.imageUrl || undefined,
  });
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const price = Number(p.price);
  const mrp = p.mrp ? Number(p.mrp) : null;
  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  // Recommendations must never break the page they sit on.
  const [related, together] = await Promise.all([
    getSimilarProducts(p.id, 4).catch(() => []),
    getBoughtTogether(p.id, 3).catch(() => []),
  ]);

  return (
    <>
      <JsonLd
        data={[
          productSchema({
            name: p.name, slug: p.slug, description: p.description,
            price, imageUrl: p.imageUrl, brand: p.brand, stock: p.stock,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Products', path: '/products' },
            { name: p.name, path: `/products/${p.slug}` },
          ]),
        ]}
      />

      <div className="container-x py-10 pb-32 md:pb-20">
        <nav aria-label="Breadcrumb" className="mono mb-6 text-[0.7rem] uppercase tracking-[0.06em] text-ink-soft">
          <Link href="/" className="hover:text-green">Home</Link>
          <span className="px-2">/</span>
          <Link href="/products" className="hover:text-green">Products</Link>
          {p.category && (
            <>
              <span className="px-2">/</span>
              <Link href={`/products?cat=${p.category.slug}`} className="hover:text-green">{p.category.name}</Link>
            </>
          )}
        </nav>

        <div className="grid gap-12 md:grid-cols-2">
          {/* The warm paper backdrop is deliberate — it makes phone-shot pack
              photography read as intentional rather than improvised, which
              matters because most of this catalogue will be shot on a phone. */}
          <div className="grid min-h-[23rem] place-items-center rounded-[4px] border border-paper-edge bg-paper-deep p-8">
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt={p.name} className="max-h-80 w-full object-contain" />
            ) : (
              <MortarGlyph size={120} className="text-paper-edge" />
            )}
          </div>

          <div>
            {p.category && <RuleLabel>{p.category.name}</RuleLabel>}
            <h1 className="mt-2 text-[clamp(1.7rem,3.5vw,2.1rem)]">{p.name}</h1>
            {p.brand && <p className="mt-1 text-[0.92rem] text-ink-soft">{p.brand}</p>}

            {/* SIGNATURE 2 — reads like a dispensing label. */}
            <LabelBand
              rows={[
                ...(p.saltName ? [['Composition', p.saltName] as [string, string]] : []),
                ...(p.brand ? [['Manufacturer', p.brand] as [string, string]] : []),
                ['Schedule', p.rxRequired ? 'Prescription required' : 'OTC — no prescription needed'],
              ]}
            />

            <div className="mt-6 flex flex-wrap items-baseline gap-3.5">
              <Price value={price} size="lg" />
              {off > 0 && (
                <>
                  <span className="mono text-base text-ink-soft"><Struck value={mrp!} /></span>
                  <Tag tone="offer">{off}% off</Tag>
                </>
              )}
            </div>
            <StockLine stock={p.stock} className="mt-1.5 text-[0.72rem]" />

            <div id="buy-anchor" className="mt-7">
              <AddToCart
                full
                product={{
                  id: p.id, slug: p.slug, name: p.name, price,
                  imageUrl: p.imageUrl, rxRequired: p.rxRequired, stock: p.stock,
                }}
              />
              {/* Turn a dead end into a lead. */}
              {p.stock <= 0 && <BackInStock productName={p.name} />}
            </div>

            {p.rxRequired && (
              <Note tone="rx">
                This medicine needs a valid doctor&apos;s prescription. Add it to your cart and{' '}
                <Link href="/upload-prescription" className="font-semibold underline">
                  upload your prescription
                </Link>{' '}
                — a pharmacist verifies it before we dispatch.
              </Note>
            )}

            <ul className="mt-7 space-y-2 border-t border-paper-edge pt-6 text-[0.85rem] text-ink-soft">
              {[
                '100% genuine — sourced from licensed distributors',
                `Free delivery on orders above ₹${site.offers.freeDeliveryAbove}`,
                `Same-day dispatch for orders before ${site.offers.dispatchCutoff}`,
                'Easy returns within 7 days',
              ].map((t) => (
                <li key={t}><span className="mr-2 text-green">✓</span>{t}</li>
              ))}
            </ul>
          </div>
        </div>

        <section className="mt-18 max-w-[68ch]">
          <RuleLabel>About this medicine</RuleLabel>
          <h2 className="mt-2 text-[1.7rem]">Product details</h2>
          <p className="mt-4 leading-loose text-ink-soft">{p.description}</p>
          {p.content && (
            <div className="mt-4 space-y-4 leading-loose text-ink-soft">
              {p.content.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
            </div>
          )}

          {/* Required on every product page. Not dismissible. */}
          <Note>
            <strong className="text-ink">Important:</strong> This information is for reference only
            and is not a substitute for professional medical advice. Always follow your
            doctor&apos;s instructions and read the pack insert. If you are unsure about a
            medicine, call us on{' '}
            <a href={`tel:${site.phone}`} className="mono text-green">{site.phoneDisplay}</a>{' '}
            and speak to a pharmacist.
          </Note>
        </section>

        <BoughtTogether items={together} />

        {/* Thumb-zone buy bar, phones only. */}
        <StickyBuyBar
          price={price}
          product={{
            id: p.id, slug: p.slug, name: p.name, price,
            imageUrl: p.imageUrl, rxRequired: p.rxRequired, stock: p.stock,
          }}
        />

        {related.length > 0 && (
          <section className="mt-18">
            <RuleLabel>Similar medicines</RuleLabel>
            <h2 className="mt-2 text-[1.7rem]">Same category, comparable composition</h2>
            <p className="mt-1 max-w-[62ch] text-[0.85rem] text-ink-soft">
              This is a browsing aid, not a recommendation — never switch a prescribed medicine
              without asking your doctor or our pharmacist.
            </p>
            <div className="mt-6 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
              {related.map((r) => <ProductCard key={r.id} p={r} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
