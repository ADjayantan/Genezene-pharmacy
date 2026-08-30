import { site } from '@/lib/config';

/** Inline SVG — no request, no layout shift, scales cleanly.
 *  Square with a 3px radius, matching the house shape language. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" role="presentation">
      <rect width="32" height="32" rx="3" fill={site.brand.primary} />
      <rect x="13.5" y="6" width="5" height="20" rx="1" fill="#FAF7F2" />
      <rect x="6" y="13.5" width="20" height="5" rx="1" fill="#FAF7F2" />
    </svg>
  );
}

export function Wordmark({ size = 32, hideSuffix = false }: { size?: number; hideSuffix?: boolean }) {
  return (
    <span className="flex shrink-0 items-center gap-2.5">
      <Logo size={size} />
      <span>
        <span className="font-display text-[1.15rem] font-semibold tracking-[-0.02em]">Genezenz</span>
        <span className={`text-[0.95rem] text-ink-soft ${hideSuffix ? 'hidden sm:inline' : ''}`}>
          {' '}Pharmacy
        </span>
      </span>
    </span>
  );
}
