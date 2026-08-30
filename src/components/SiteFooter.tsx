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

          <div className="mt-6 flex items-center gap-4 text-ink-soft">
            <a href={site.social.facebook} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-green" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            {site.social.instagram && (
              <a href={site.social.instagram} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-green" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
            )}
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-green" aria-label="WhatsApp">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </a>
          </div>
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
