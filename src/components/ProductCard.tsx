import Link from 'next/link';
import { AddToCart } from './AddToCart';
import { MortarGlyph, Price, StockLine, Struck, Tag } from './ui';

export type CardProduct = {
  id: string; name: string; slug: string; price: number; mrp: number | null;
  stock: number; imageUrl: string | null; brand: string | null; rxRequired: boolean;
};

/**
 * SIGNATURE 4 — the index card.
 * Square corners, hairline border, and a 2px rule across the top: green
 * normally, plum when the item is prescription-only. Reads like a card in
 * a pharmacist's drawer, and the top rule tells you the Rx status before
 * you have read a single word.
 */
export function ProductCard({ p }: { p: CardProduct }) {
  const off = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

  return (
    <article
      className={`flex flex-col rounded-[4px] border border-paper-edge border-t-2 bg-paper p-4 transition-colors hover:border-green ${
        p.rxRequired ? 'border-t-plum hover:border-t-plum' : 'border-t-green'
      }`}
    >
      <Link href={`/products/${p.slug}`} className="flex-1">
        <div className="mb-3.5 grid h-30 place-items-center bg-paper-deep">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-full w-full object-contain p-2" />
          ) : (
            <MortarGlyph className="text-paper-edge" />
          )}
        </div>

        <div className="flex min-h-[1.05rem] flex-wrap gap-1.5">
          {p.rxRequired && <Tag tone="rx">℞ Prescription</Tag>}
          {off > 0 && <Tag tone="offer">{off}% off</Tag>}
        </div>

        <h3 className="font-display mt-2 line-clamp-2 text-[0.98rem] font-medium leading-snug">
          {p.name}
        </h3>
        {p.brand && <p className="mt-0.5 truncate text-[0.75rem] text-ink-soft">{p.brand}</p>}

        <p className="mt-2.5 flex items-baseline gap-2">
          <Price value={p.price} />
          {off > 0 && <Struck value={p.mrp!} />}
        </p>
        <StockLine stock={p.stock} className="mt-1" />
      </Link>

      <div className="mt-3.5">
        <AddToCart product={p} />
      </div>
    </article>
  );
}
