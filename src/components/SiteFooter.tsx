import Link from 'next/link';
import { Logo } from './Logo';
import { site, fullAddress, mapsLink } from '@/lib/config';
import { LEGAL_DOCS } from '@/lib/legal';

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, '-');

function ColHead({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mono mb-4 border-t border-paper-edge pt-3 text-[0.64rem] font-medium uppercase tracking-[0.12em] text-ink-soft">
      {children}
    </h3>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-paper-edge bg-paper-deep">
      <div className="container-x grid gap-10 py-16 md:grid-cols-5">
        <div className="md:col-span-2">
          <span className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-display text-[1.1rem] font-semibold">Genezenz Pharmacy</span>
          </span>
          <p className="mt-3 max-w-[32ch] text-[0.87rem] text-ink-soft">
            CDSCO-licensed pharmacy serving Coimbatore since {site.founded}. Genuine medicines,
            pharmacist-verified prescriptions, delivered to your door.
          </p>

          {/* The NAP block. Kept as literal text — never an image — because it
              has to match the Google Business Profile character for character
              for local ranking. Mono so it reads as a record. */}
          <address className="mono mt-5 space-y-1 text-[0.78rem] not-italic leading-loose text-ink-soft">
            <a href={mapsLink()} target="_blank" rel="noopener noreferrer" className="block transition-colors hover:text-green">
              {fullAddress()}
            </a>
            <a href={`tel:${site.phone}`} className="block transition-colors hover:text-green">
              {site.phoneDisplay}
            </a>
            <a href={`mailto:${site.email}`} className="block transition-colors hover:text-green">
              {site.email}
            </a>
            <span className="block">Mon – Sat, 9 AM – 8 PM</span>
          </address>
        </div>

        <div>
          <ColHead>Shop</ColHead>
          <ul className="space-y-2 text-[0.87rem] text-ink-soft">
            <li><Link href="/products" className="hover:text-green">All medicines</Link></li>
            <li><Link href="/upload-prescription" className="hover:text-green">Upload prescription</Link></li>
            <li><Link href="/products?cat=vitamins" className="hover:text-green">Vitamins</Link></li>
            <li><Link href="/products?cat=baby-care" className="hover:text-green">Baby care</Link></li>
            <li><Link href="/about" className="hover:text-green">About us</Link></li>
          </ul>
        </div>

        <div>
          <ColHead>Policies</ColHead>
          <ul className="space-y-2 text-[0.87rem] text-ink-soft">
            {LEGAL_DOCS.map((d) => (
              <li key={d.slug}>
                <Link href={`/legal/${d.slug}`} className="hover:text-green">{d.title}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <ColHead>We deliver to</ColHead>
          {/* These links are how link equity reaches the area pages.
              Without them those pages are orphaned and will not rank. */}
          <ul className="space-y-2 text-[0.87rem] text-ink-soft">
            {site.serviceAreas.map((a) => (
              <li key={a}>
                <Link href={`/pharmacy-in-${slug(a)}-coimbatore`} className="hover:text-green">
                  {a}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Regulatory identity — required for a licensed online pharmacy. */}
      <div className="border-t border-paper-edge py-5">
        <div className="container-x mono flex flex-wrap justify-center gap-x-5 gap-y-1 text-center text-[0.66rem] uppercase tracking-[0.06em] text-ink-soft">
          <span>{site.compliance.drugLicence}</span>
          <span>{site.compliance.gstin}</span>
          <span>{site.compliance.pharmacist}{site.compliance.pharmacistReg ? ` · ${site.compliance.pharmacistReg}` : ''}</span>
        </div>
        <p className="mono mt-3 text-center text-[0.66rem] uppercase tracking-[0.06em] text-ink-soft">
          © {new Date().getFullYear()} Genezenz Pharmacy · Est. {site.founded}, Ganapathy, Coimbatore · Licensed by CDSCO
        </p>
      </div>
    </footer>
  );
}
