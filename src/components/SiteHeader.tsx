import Link from 'next/link';
import { Wordmark } from './Logo';
import { CartBadge } from './CartBadge';
import { SearchBox } from './SearchBox';
import { AccountNav } from './AccountNav';
import { site } from '@/lib/config';

/**
 * Nav order is not arbitrary. The serial position effect says the first and
 * last items in a list are the ones people remember and return to, so the
 * primary task sits first and the reassurance sits last:
 *   Medicines (why they came) … Contact (the escape hatch when anxious).
 * Hick's law keeps the desktop row to four — every extra option slows the
 * decision for everyone.
 */
const NAV = [
  { href: '/products', label: 'Medicines' },
  { href: '/upload-prescription', label: 'Upload Rx' },
  { href: '/products?cat=baby-care', label: 'Baby Care' },
  { href: '/contact', label: 'Contact' },
];

export function SiteHeader() {
  return (
    <>
      <div className="bg-green-deep py-2 text-green-on">
        <div className="container-x mono flex flex-wrap justify-center gap-x-5 gap-y-1 text-center text-[0.7rem] uppercase tracking-[0.06em]">
          <span>Free delivery above ₹{site.offers.freeDeliveryAbove}</span>
          <span className="border-l border-green-on/25 pl-5">
            Code {site.offers.firstOrderCode} — 10% off first order
          </span>
          <span className="hidden border-l border-green-on/25 pl-5 md:inline">
            Same-day dispatch before {site.offers.dispatchCutoff}
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-paper-edge bg-paper/95 backdrop-blur">
        <div className="container-x flex h-16 items-center gap-5">
          <Link href="/" aria-label={`${site.name} home`}>
            <Wordmark hideSuffix />
          </Link>

          {/* Search is the primary task on a pharmacy site — people arrive with
              a medicine name already in mind, they do not browse. It therefore
              gets the first position on the F-pattern's opening scan line,
              immediately after the brand anchor, and the most width. */}
          <div className="hidden min-w-0 flex-1 md:block md:max-w-[30rem]">
            <SearchBox />
          </div>

          <nav aria-label="Main" className="ml-auto hidden items-center gap-6 text-[0.9rem] text-ink-soft lg:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap transition-colors hover:text-green">
                {n.label}
              </Link>
            ))}
          </nav>

          {/* 44px touch targets. This shop serves a lot of older customers and
              the default 32px icon button is measurably harder to hit. */}
          <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
            <CartBadge />
            <AccountNav />
          </div>
        </div>

        {/* On a phone, search gets its own full-width row rather than fighting
            the logo and icons for space. It is the reason most people opened
            the site; it should not be the smallest thing on screen. */}
        <div className="container-x pb-3 md:hidden">
          <SearchBox />
        </div>

        <nav aria-label="Categories" className="border-t border-paper-edge lg:hidden">
          <div className="container-x flex gap-5 overflow-x-auto py-3 text-[0.88rem] text-ink-soft">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap">
                {n.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
    </>
  );
}
