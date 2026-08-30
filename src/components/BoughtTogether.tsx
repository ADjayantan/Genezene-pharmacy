import Link from 'next/link';
import type { RecoProduct } from '@/lib/recommendations';
import { AddToCart } from './AddToCart';
import { MortarGlyph, Price, RuleLabel } from './ui';

/**
 * Rendered only when there is real co-purchase evidence. If the shop has no
 * order history yet the section simply does not appear — which is honest, and
 * far better than a fabricated "customers also bought" on a pharmacy site.
 */
export function BoughtTogether({ items }: { items: RecoProduct[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-18">
      <RuleLabel>Often bought together</RuleLabel>
      <h2 className="mt-2 text-[1.7rem]">Customers ordered these at the same time</h2>
      <p className="mt-1 max-w-[60ch] text-[0.85rem] text-ink-soft">
        Over-the-counter items only — we never suggest prescription medicines.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <article
            key={p.id}
            className="flex gap-3.5 rounded-[4px] border border-paper-edge border-t-2 border-t-green p-3.5"
          >
            <Link href={`/products/${p.slug}`} className="shrink-0">
              <div className="grid h-14 w-14 place-items-center bg-paper-deep">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
                ) : (
                  <MortarGlyph size={28} className="text-paper-edge" />
                )}
              </div>
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${p.slug}`}
                className="font-display line-clamp-2 text-[0.92rem] font-medium leading-snug hover:text-green"
              >
                {p.name}
              </Link>
              <p className="mt-1"><Price value={p.price} size="sm" /></p>
              <div className="mt-2">
                <AddToCart product={p} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
