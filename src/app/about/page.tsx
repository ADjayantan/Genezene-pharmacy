import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';
import { site, fullAddress, mapsLink } from '@/lib/config';
import { ButtonLink, RuleLabel } from '@/components/ui';

export const metadata: Metadata = buildMetadata({
  title: 'About Genezenz Pharmacy — Ganapathy, Coimbatore',
  description:
    'Genezenz Pharmacy has served Ganapathy and Coimbatore since 2014. CDSCO-licensed, pharmacist-led, with same-day delivery across the city.',
  path: '/about',
});

const PROMISES: [string, string][] = [
  ['CDSCO licensed', 'Licensed by the Central Drugs Standard Control Organisation, and sourced only from authorised distributors.'],
  ['Pharmacist-led', 'A qualified pharmacist reviews every prescription order — not a warehouse picker.'],
  ['Same-day dispatch', `Orders placed before ${site.offers.dispatchCutoff} go out the same day across Coimbatore.`],
  ['A real shop', 'We are not a faceless website. Walk in, ask questions, and speak to the person who dispenses your medicine.'],
];

export default function AboutPage() {
  return (
    <div className="container-x max-w-[68ch] py-14 pb-24">
      <RuleLabel>Since {site.founded}</RuleLabel>
      <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)]">About Genezenz Pharmacy</h1>

      {/* Written with restraint. No superlatives, no invented statistics. */}
      <div className="mt-6 space-y-4 text-[1.08rem] leading-loose text-ink-soft">
        <p>
          We opened in {site.founded} on Gopalsamy Temple Street in Ganapathy, and we have been
          dispensing for families across Coimbatore ever since. What began as a neighbourhood
          counter now also delivers across the city — but the way we work has not changed.
        </p>
        <p>
          Every prescription is read by a licensed pharmacist before anything is dispensed. We
          check the dosage, we check for interactions with what you are already taking, and if
          something on the prescription is unclear we call the prescribing doctor rather than
          guess. We never substitute a medicine without asking you first.
        </p>
        <p>
          We stock what a family actually needs: diabetes and cardiac medication, antibiotics,
          paediatric syrups, dermatology products, vitamins and baby care. If we do not have
          something, we source it and tell you honestly when it will arrive.
        </p>
      </div>

      <RuleLabel className="mt-14">Our promise</RuleLabel>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {PROMISES.map(([h, p]) => (
          <div key={h} className="rounded-[4px] border border-paper-edge p-5">
            <h2 className="font-display text-[0.98rem] font-semibold">{h}</h2>
            <p className="mt-2 text-[0.87rem] leading-relaxed text-ink-soft">{p}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-[4px] border-l-[3px] border-green bg-paper-deep p-6">
        <RuleLabel className="border-t-0 pt-0">Licensed &amp; accountable</RuleLabel>
        <dl className="mono mt-3 space-y-1.5 text-[0.82rem] text-ink-soft">
          <div><dt className="inline text-[0.62rem] uppercase tracking-[0.1em]">Drug licence — </dt><dd className="inline">{site.compliance.drugLicence}</dd></div>
          <div><dt className="inline text-[0.62rem] uppercase tracking-[0.1em]">GSTIN — </dt><dd className="inline">{site.compliance.gstin}</dd></div>
          <div><dt className="inline text-[0.62rem] uppercase tracking-[0.1em]">Pharmacist — </dt><dd className="inline">{site.compliance.pharmacist}{site.compliance.pharmacistReg ? ` (${site.compliance.pharmacistReg})` : ''}</dd></div>
        </dl>
      </div>

      <div className="mt-6 rounded-[4px] border border-paper-edge border-t-2 border-t-green bg-paper-deep p-6">
        <RuleLabel className="border-t-0 pt-0">Visit the counter</RuleLabel>
        <address className="mono mt-3 space-y-1 text-[0.85rem] not-italic leading-loose text-ink-soft">
          <a href={mapsLink()} target="_blank" rel="noopener noreferrer" className="block hover:text-green">
            {fullAddress()}
          </a>
          <a href={`tel:${site.phone}`} className="block hover:text-green">{site.phoneDisplay}</a>
          <span className="block">Monday – Saturday, 9:00 AM – 8:00 PM</span>
        </address>
        <ButtonLink href="/contact" className="mt-5">Get in touch</ButtonLink>
      </div>
    </div>
  );
}
