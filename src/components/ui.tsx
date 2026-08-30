import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

/* ─────────────────────────────────────────────────────────────
   Shared primitives.

   These exist so the signature devices are defined once. If the
   rule-and-label heading is hand-rolled on every page, twenty
   pages later there are twenty slightly different versions of it
   — which is exactly how a design system quietly dies.
   ───────────────────────────────────────────────────────────── */

/** SIGNATURE 1 — hairline rule, small-caps mono label, then the heading.
 *  Reads like an entry in a reference volume. */
export function RuleLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-t border-paper-edge pt-3 ${className}`}>
      <span className="mono block text-[0.68rem] uppercase tracking-[0.12em] text-ink-soft">
        {children}
      </span>
    </div>
  );
}

/** SIGNATURE 2 — dispensing-label band. Composition, pack, schedule. */
export function LabelBand({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="mt-6 grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-2 border-l-[3px] border-green bg-paper-deep px-5 py-4">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">{k}</dt>
          <dd className="mono m-0 text-[0.87rem]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** SIGNATURE 3 — outline serif numeral, never a filled disc. */
export function StepNumber({ n }: { n: number }) {
  return (
    <span className="font-display grid h-9 w-9 shrink-0 place-items-center rounded-full border border-green text-[0.95rem] text-green">
      {n}
    </span>
  );
}

type BtnTone = 'primary' | 'outline' | 'quiet' | 'danger';
const BTN: Record<BtnTone, string> = {
  primary: 'bg-green text-green-on hover:bg-green-deep border-transparent',
  outline: 'border-green text-green hover:bg-green-wash',
  quiet:   'border-paper-edge text-ink-soft hover:border-green hover:text-green',
  danger:  'border-out/50 text-out hover:bg-out/10',
};

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-[3px] border font-semibold ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-45';

export function Button({
  tone = 'primary', size = 'md', full, className = '', ...rest
}: ComponentProps<'button'> & { tone?: BtnTone; size?: 'sm' | 'md'; full?: boolean }) {
  const s = size === 'sm' ? 'px-4 py-2 text-[0.8rem]' : 'px-6 py-[0.72rem] text-[0.87rem]';
  return <button className={`${btnBase} ${BTN[tone]} ${s} ${full ? 'w-full' : ''} ${className}`} {...rest} />;
}

export function ButtonLink({
  tone = 'primary', size = 'md', full, className = '', ...rest
}: ComponentProps<typeof Link> & { tone?: BtnTone; size?: 'sm' | 'md'; full?: boolean }) {
  const s = size === 'sm' ? 'px-4 py-2 text-[0.8rem]' : 'px-6 py-[0.72rem] text-[0.87rem]';
  return <Link className={`${btnBase} ${BTN[tone]} ${s} ${full ? 'w-full' : ''} ${className}`} {...rest} />;
}

/** Small-caps mono tag. Plum is reserved for prescription status. */
export function Tag({ tone = 'neutral', children }: { tone?: 'rx' | 'offer' | 'neutral'; children: ReactNode }) {
  const t = {
    rx:      'bg-plum-wash text-plum',
    offer:   'bg-amber-wash text-amber',
    neutral: 'bg-paper-deep text-ink-soft',
  }[tone];
  return (
    <span className={`mono inline-block rounded-[2px] px-[0.4rem] py-[0.15rem] text-[0.62rem] font-medium uppercase tracking-[0.06em] ${t}`}>
      {children}
    </span>
  );
}

/** Stock state, always mono, always small-caps. */
export function StockLine({ stock, className = '' }: { stock: number; className?: string }) {
  const [tone, label] =
    stock <= 0 ? ['text-out', 'Out of stock']
    : stock <= 10 ? ['text-low', `Only ${stock} left`]
    : ['text-in', 'In stock'];
  return (
    <p className={`mono text-[0.66rem] uppercase tracking-[0.06em] ${tone} ${className}`}>{label}</p>
  );
}

/** Prices: mono, tabular, two decimals, ₹ prefix. Always. */
export function Price({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'text-[0.87rem]', md: 'text-base', lg: 'text-[2rem] tracking-[-0.02em]' }[size];
  return <span className={`mono font-medium ${s}`}>₹{value.toFixed(2)}</span>;
}

export function Struck({ value }: { value: number }) {
  return <s className="mono text-[0.75rem] text-ink-soft">₹{value.toFixed(2)}</s>;
}

/** Form field. Label always present — never a placeholder standing in for one. */
export function Field({
  label, hint, children,
}: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mono mb-1.5 block text-[0.64rem] uppercase tracking-[0.1em] text-ink-soft">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1.5 block text-[0.72rem] text-ink-soft">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-[3px] border border-paper-edge bg-paper px-[0.8rem] py-[0.62rem] ' +
  'text-[0.88rem] text-ink outline-none transition-colors focus:border-green ' +
  'placeholder:text-ink-soft/60';

/** Panels. `accent` puts a 2px rule on top — amber draws the eye to a
 *  conversion surface, green marks a neutral one. */
export function Panel({
  accent, className = '', children,
}: { accent?: 'amber' | 'green'; className?: string; children: ReactNode }) {
  const top = accent === 'amber' ? 'border-t-2 border-t-amber' : accent === 'green' ? 'border-t-2 border-t-green' : '';
  return (
    <div className={`rounded-[4px] border border-paper-edge bg-paper-deep p-6 ${top} ${className}`}>
      {children}
    </div>
  );
}

export function Note({ tone = 'info', children }: { tone?: 'info' | 'rx' | 'warn'; children: ReactNode }) {
  const t = {
    info: 'border border-paper-edge bg-paper-deep text-ink-soft text-[0.78rem]',
    rx:   'border-l-[3px] border-plum bg-plum-wash text-plum text-[0.87rem]',
    warn: 'border border-amber bg-amber-wash text-ink text-[0.87rem]',
  }[tone];
  return <div className={`mt-4 rounded-[3px] px-5 py-4 leading-relaxed ${t}`}>{children}</div>;
}

/** Empty states are content, not apologies — each one offers a way forward. */
export function EmptyState({
  title, children, action,
}: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mt-8 rounded-[4px] border border-dashed border-paper-edge px-6 py-14 text-center">
      <MortarGlyph className="mx-auto mb-4 text-paper-edge" size={44} />
      <p className="font-display text-lg">{title}</p>
      {children && <p className="mx-auto mt-2 max-w-sm text-[0.87rem] text-ink-soft">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Image placeholder. A drawn mortar and pestle — never an emoji. */
export function MortarGlyph({ size = 46, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 64 64" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"
      className={className} aria-hidden="true"
    >
      <path d="M20 40h24M24 40c0-8 3-12 8-12s8 4 8 12" />
      <path d="M32 28V16M26 16h12" />
      <path d="M16 44h32l-2 8H18z" />
    </svg>
  );
}
