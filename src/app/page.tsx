import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { site } from '@/lib/config';
import { buildMetadata, JsonLd, faqSchema } from '@/lib/seo';
import { LeadForm } from '@/components/LeadForm';
import { ProductCard } from '@/components/ProductCard';
import { ButtonLink, Panel, RuleLabel } from '@/components/ui';
import Link from 'next/link';

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: 'Online Pharmacy in Coimbatore — Medicine Delivery | Genezenz Pharmacy',
  description:
    'Buy genuine medicines online in Coimbatore. Upload your prescription, get pharmacist-verified medicines delivered same day. CDSCO-licensed pharmacy in Ganapathy since 2014.',
  path: '/',
});

const FAQS = [
  {
    q: 'Do you deliver medicines in Coimbatore?',
    a: 'Yes. Genezenz Pharmacy delivers across Coimbatore including Ganapathy, Saibaba Colony, RS Puram, Peelamedu, Gandhipuram and Saravanampatti. Orders placed before 2 PM are dispatched the same day.',
  },
  {
    q: 'How do I order prescription medicines?',
    a: 'Upload a clear photo or PDF of your doctor’s prescription. A licensed pharmacist reviews it, confirms availability and prepares your order before dispatch.',
  },
  {
    q: 'Are the medicines genuine?',
    a: 'Every product is sourced from licensed manufacturers and distributors. Genezenz Pharmacy is licensed by the Central Drugs Standard Control Organisation (CDSCO).',
  },
  {
    q: 'What is the delivery charge?',
    a: `Delivery is free on orders above ₹${site.offers.freeDeliveryAbove}. Below that a small fee applies, shown at checkout before you confirm.`,
  },
];

export default async function Home() {
  const popular = await db.product
    .findMany({ where: { published: true, stock: { gt: 0 } }, orderBy: { stock: 'desc' }, take: 8 })
    .catch(() => []);

  return (
    <>
      {/* Google can render these as an expandable rich result, which
          measurably lifts click-through rate. */}
      <JsonLd data={faqSchema(FAQS)} />

      {/* HERO — server-rendered. The h1 and copy are in the first HTML
          response, so Googlebot indexes them without running JavaScript.
          No gradient: warm paper carries it. */}
      <section className="border-b border-paper-edge">
        <div className="container-x grid items-start gap-14 py-18 md:grid-cols-[3fr_2fr]">
          <div>
            <RuleLabel>CDSCO Licensed · Established {site.founded}</RuleLabel>
            <h1 className="mt-3 text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.05] tracking-[-0.035em]">
              Medicines, <em className="font-normal italic">dispensed</em>
              <br />by people who know you.
            </h1>
            <p className="mt-5 max-w-[36ch] text-[1.1rem] leading-relaxed text-ink-soft">
              Genuine medicines checked by licensed pharmacists, delivered across Coimbatore
              from our counter in Ganapathy.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/products">Browse the counter</ButtonLink>
              <ButtonLink href="/upload-prescription" tone="outline">Upload a prescription</ButtonLink>
            </div>

            <div className="mono mt-9 flex flex-wrap gap-x-5 gap-y-1 border-t border-paper-edge pt-4 text-[0.68rem] uppercase tracking-[0.08em] text-ink-soft">
              <span>Pharmacist verified</span>
              <span className="border-l border-paper-edge pl-5">Same-day dispatch</span>
              <span className="border-l border-paper-edge pl-5">Free above ₹{site.offers.freeDeliveryAbove}</span>
            </div>
          </div>

          {/* Lead capture above the fold — this is the conversion engine. */}
          <Panel accent="amber">
            <RuleLabel className="border-t-0 pt-0">Call me back</RuleLabel>
            <h2 className="font-display mt-1.5 text-[1.3rem]">Tell us what you need.</h2>
            <p className="mb-5 mt-1 text-[0.87rem] text-ink-soft">
              Our pharmacist calls you back and confirms availability.
            </p>
            <LeadForm />
          </Panel>
        </div>
      </section>

      {popular.length > 0 && (
        <section className="container-x py-18">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-[16rem] flex-1">
              <RuleLabel>From the counter</RuleLabel>
              <h2 className="mt-2 text-[1.7rem]">Popular this month</h2>
            </div>
            <Link href="/products" className="text-[0.87rem] font-semibold text-green">All medicines →</Link>
          </div>
          <div className="mt-7 grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {popular.map((p) => (
              <ProductCard
                key={p.id}
                p={{
                  id: p.id, name: p.name, slug: p.slug,
                  price: Number(p.price), mrp: p.mrp ? Number(p.mrp) : null,
                  stock: p.stock, imageUrl: p.imageUrl, brand: p.brand, rxRequired: p.rxRequired,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* SEO prose. Load-bearing, not filler — thin pages are the single
          biggest reason local pharmacy sites fail to rank. */}
      <section className="border-y border-paper-edge bg-paper-deep">
        <div className="container-x max-w-[68ch] py-18">
          <RuleLabel>About the shop</RuleLabel>
          <h2 className="mt-2 text-[1.7rem]">Trusted medicine delivery across Coimbatore</h2>
          <div className="mt-4 space-y-4 leading-loose text-ink-soft">
            <p>
              Genezenz Pharmacy has served families in Ganapathy and greater Coimbatore since{' '}
              {site.founded}. We stock over 500 medicines — from everyday antipyretics and
              antibiotics to specialised diabetes care, cardiac medication, paediatric syrups
              and dermatology products.
            </p>
            <p>
              Every prescription order is reviewed by a licensed pharmacist before it leaves our
              counter. We check dosage, interactions and substitutions, and we call you if
              anything on the prescription needs clarification from your doctor. We never
              substitute a medicine without asking you first.
            </p>
            <p>
              Place your order before {site.offers.dispatchCutoff} and we dispatch the same day.
              Delivery is free on orders above ₹{site.offers.freeDeliveryAbove}, and our counter
              is open Monday to Saturday if you would rather collect in person.
            </p>
          </div>
        </div>
      </section>

      <section className="container-x max-w-[68ch] py-18">
        <RuleLabel>Common questions</RuleLabel>
        <h2 className="mt-2 text-[1.7rem]">Frequently asked</h2>
        <div className="mt-6">
          {FAQS.map((f, i) => (
            <details key={f.q} open={i === 0} className="border-b border-paper-edge py-4">
              <summary className="font-display text-[1.02rem] font-medium">{f.q}</summary>
              <p className="ml-[1.4rem] mt-2 text-[0.9rem] leading-loose text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
