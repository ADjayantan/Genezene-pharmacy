import type { Metadata } from 'next';
import { site, fullAddress, mapsLink, whatsappLink } from '@/lib/config';
import { buildMetadata } from '@/lib/seo';
import { LeadForm } from '@/components/LeadForm';
import { Panel, RuleLabel } from '@/components/ui';

export const metadata: Metadata = buildMetadata({
  title: 'Contact Genezenz Pharmacy — Ganapathy, Coimbatore',
  description:
    'Call, WhatsApp or visit Genezenz Pharmacy at Adhi Vinayagar Complex, Gopalsamy Temple Street, Ganapathy, Coimbatore 641006. Open Mon–Sat, 9 AM – 8 PM.',
  path: '/contact',
});

export default function Contact() {
  const rows: [string, React.ReactNode][] = [
    ['Phone', <a key="p" href={`tel:${site.phone}`} className="mono text-green hover:underline">{site.phoneDisplay}</a>],
    ['WhatsApp', <a key="w" href={whatsappLink('Hi Genezenz Pharmacy, I have a question.')} target="_blank" rel="noopener noreferrer" className="text-green hover:underline">Message us</a>],
    ['Email', <a key="e" href={`mailto:${site.email}`} className="mono text-green hover:underline">{site.email}</a>],
    ['Opening hours', <span key="h" className="text-ink-soft">Monday – Saturday, 9:00 AM – 8:00 PM</span>],
  ];

  return (
    <div className="container-x grid gap-14 py-14 pb-24 md:grid-cols-2">
      <div>
        <RuleLabel>Get in touch</RuleLabel>
        <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)]">Contact us</h1>
        <p className="mt-4 max-w-[46ch] leading-relaxed text-ink-soft">
          Call the counter, message us on WhatsApp, or drop in — we are happy to help with any
          medicine query.
        </p>

        <dl className="mt-10 space-y-5">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">{k}</dt>
              <dd className="mt-1 text-[0.92rem]">{v}</dd>
            </div>
          ))}
        </dl>

        {/* A static address panel rather than an embedded map iframe — an
            iframe costs Core Web Vitals and drops a third-party cookie. */}
        {/* The one part of the old insurance guide worth keeping. It belongs
            here, where someone who needs an invoice is already looking, rather
            than on a standalone page written for search traffic that never
            intended to buy anything. */}
        <div className="mt-8 rounded-[4px] border-l-[3px] border-amber bg-amber-wash px-5 py-5">
          <p className="mono text-[0.62rem] uppercase tracking-[0.1em] text-amber">
            Insurance &amp; reimbursement
          </p>
          <p className="mt-2 text-[0.87rem] leading-relaxed">
            Need to claim your medicine bill? Ask for a <strong>GST invoice</strong> when you
            place the order and we will issue one carrying our GSTIN and drug licence number —
            that is what insurers ask for. Keep the doctor&apos;s prescription with it.
          </p>
        </div>

        <div className="mt-5 rounded-[4px] border-l-[3px] border-green bg-paper-deep px-5 py-5">
          <p className="mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">Address</p>
          <p className="mono mt-2 text-[0.85rem] leading-loose">{fullAddress()}</p>
          <a href={mapsLink()} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-[0.85rem] font-semibold text-green hover:underline">
            Open in Maps →
          </a>
        </div>
      </div>

      <div>
        <Panel accent="amber">
          <RuleLabel className="border-t-0 pt-0">Call me back</RuleLabel>
          <h2 className="font-display mt-1.5 text-[1.3rem]">Leave your number.</h2>
          <p className="mb-5 mt-1 text-[0.87rem] text-ink-soft">
            Our pharmacist will call you back within opening hours.
          </p>
          <LeadForm />
        </Panel>
      </div>
    </div>
  );
}
