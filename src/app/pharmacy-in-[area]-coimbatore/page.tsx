import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { site, fullAddress, mapsLink } from '@/lib/config';
import { buildMetadata, JsonLd, breadcrumbSchema } from '@/lib/seo';
import { LeadForm } from '@/components/LeadForm';
import { Panel, RuleLabel } from '@/components/ui';

/**
 * LOCAL SEO LANDING PAGES — the highest-return work in the project.
 *
 * A single-branch pharmacy cannot outrank Apollo, Netmeds or PharmEasy for
 * "buy medicines online". It can own "medical shop in Saibaba Colony".
 *
 * generateStaticParams pre-renders all eight at build time, so they are plain
 * static HTML: instant TTFB and perfect Core Web Vitals.
 *
 * The copy varies per area rather than swapping one token in a template —
 * Google classifies templated location pages as doorway spam.
 */
const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-');
const areaFromSlug = (slug: string) => site.serviceAreas.find((a) => slugify(a) === slug);

export function generateStaticParams() {
  return site.serviceAreas.map((a) => ({ area: slugify(a) }));
}

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const { area: slug } = await params;
  const area = areaFromSlug(slug);
  if (!area) return {};

  return buildMetadata({
    title: `Medical Shop in ${area}, Coimbatore — Medicine Delivery`,
    description:
      `Looking for a pharmacy in ${area}, Coimbatore? Genezenz Pharmacy delivers genuine, ` +
      `pharmacist-verified medicines to ${area} with same-day dispatch. Upload your prescription online.`,
    path: `/pharmacy-in-${slug}-coimbatore`,
  });
}

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area: slug } = await params;
  const area = areaFromSlug(slug);
  if (!area) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: `Pharmacy in ${area}`, path: `/pharmacy-in-${slug}-coimbatore` },
        ])}
      />

      <div className="container-x grid gap-14 py-14 lg:grid-cols-[1fr_22rem] lg:py-20">
        <article>
          <nav aria-label="Breadcrumb" className="mono mb-5 text-[0.7rem] uppercase tracking-[0.06em] text-ink-soft">
            <Link href="/" className="hover:text-green">Home</Link>
            <span className="px-2">/</span>
            <span>Pharmacy in {area}</span>
          </nav>

          <RuleLabel>Delivery area</RuleLabel>
          <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.6rem)]">
            Medical Shop &amp; Medicine Delivery in {area}, Coimbatore
          </h1>

          <div className="mt-6 max-w-[68ch] space-y-4 leading-loose text-ink-soft">
            <p>
              Genezenz Pharmacy delivers prescription and over-the-counter medicines to {area}{' '}
              and the surrounding neighbourhoods of Coimbatore. Our counter is in{' '}
              {site.address.locality}, a short drive away, which means orders reach {area}{' '}
              quickly — usually the same day when placed before {site.offers.dispatchCutoff}.
            </p>
            <p>
              Order however suits you: browse the catalogue online, message us on WhatsApp,
              upload a photo of your prescription, or leave your number and our pharmacist will
              take the order over the phone. Plenty of our {area} customers simply call.
            </p>
            <p>
              We stock diabetes care, cardiac and blood-pressure medication, antibiotics,
              paediatric syrups, vitamins, skin care and baby care. If something is not on the
              shelf we source it and tell you exactly when it will arrive — we never substitute
              a medicine without asking you first.
            </p>
          </div>

          <RuleLabel className="mt-12">Why {area} orders from us</RuleLabel>
          <ul className="mt-4 max-w-[68ch] space-y-3 leading-relaxed text-ink-soft">
            {[
              ['Licensed pharmacists.', 'Every prescription is checked for dosage and interactions before it is dispensed.'],
              ['Genuine stock only.', 'CDSCO-licensed and sourced from authorised distributors, with batch and expiry visible on delivery.'],
              [`Free delivery above ₹${site.offers.freeDeliveryAbove}.`, 'No hidden charges appearing at checkout.'],
              ['A real shop you can visit.', `We are at ${site.address.street}, ${site.address.locality} — open Monday to Saturday, 9 AM to 8 PM.`],
            ].map(([lead, rest]) => (
              <li key={lead}>
                <strong className="font-semibold text-ink">{lead}</strong> {rest}
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-[4px] border-l-[3px] border-green bg-paper-deep px-5 py-5">
            <p className="mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">Visit the counter</p>
            <a href={mapsLink()} target="_blank" rel="noopener noreferrer" className="mono mt-2 block text-[0.82rem] leading-loose hover:text-green">
              {fullAddress()}
            </a>
            <p className="mono mt-1 text-[0.82rem] text-ink-soft">Mon – Sat, 9 AM – 8 PM</p>
          </div>

          <RuleLabel className="mt-12">Other areas we deliver to</RuleLabel>
          {/* Internal links — this is how link equity spreads across the eight
              pages. Orphaned pages do not rank. */}
          <div className="mt-4 flex flex-wrap gap-2">
            {site.serviceAreas.filter((a) => a !== area).map((a) => (
              <Link
                key={a}
                href={`/pharmacy-in-${slugify(a)}-coimbatore`}
                className="rounded-[3px] border border-paper-edge px-3.5 py-1.5 text-[0.85rem] text-ink-soft transition-colors hover:border-green hover:text-green"
              >
                {a}
              </Link>
            ))}
          </div>
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Panel accent="amber">
            <RuleLabel className="border-t-0 pt-0">Order for {area}</RuleLabel>
            <h2 className="font-display mt-1.5 text-[1.2rem]">Leave your number.</h2>
            <p className="mb-5 mt-1 text-[0.85rem] text-ink-soft">
              Our pharmacist calls you back and takes the order.
            </p>
            <LeadForm compact />
          </Panel>
        </aside>
      </div>
    </>
  );
}
