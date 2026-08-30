import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { site } from '@/lib/config';
import { buildMetadata, JsonLd, faqSchema } from '@/lib/seo';
import { LeadForm } from '@/components/LeadForm';
import { ProductCard } from '@/components/ProductCard';
import { ButtonLink, Panel, RuleLabel } from '@/components/ui';
import { PromoCarousel } from '@/components/PromoCarousel';
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
    a: 'Yes. We offer doorstep delivery (within a 10km radius of Ganapathy). Orders placed before 2 PM are dispatched the same day.',
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

/* ── Category icons (inline SVGs — no external assets needed) ── */
const CAT_ICONS: Record<string, React.ReactNode> = {
  'diabetes-care': (
    <svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M24 6c-3 5-10 10-10 18a10 10 0 0 0 20 0C34 16 27 11 24 6Z" /><path d="M20 26h8M24 22v8" /></svg>
  ),
  'vitamins': (
    <svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="16" y="8" width="16" height="32" rx="8" /><line x1="16" y1="24" x2="32" y2="24" /><circle cx="24" cy="16" r="2" /></svg>
  ),
  'cold-fever': (
    <svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="21" y="6" width="6" height="30" rx="3" /><circle cx="24" cy="36" r="5" /><path d="M24 14v16" /></svg>
  ),
  'personal-care': (
    <svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M24 38s-12-7-12-16a8 8 0 0 1 12-7 8 8 0 0 1 12 7c0 9-12 16-12 16Z" /></svg>
  ),
  'baby-care': (
    <svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M18 10h6v8h-6zM14 18h14a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V22a4 4 0 0 1 0-4Z" /><path d="M24 10V6" /></svg>
  ),
  'pain-relief': (
    <svg viewBox="0 0 48 48" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M24 6v36M6 24h36" /><rect x="10" y="10" width="28" height="28" rx="4" /></svg>
  ),
};

const TRUST_ICONS = {
  pharmacist: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Z" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M15 7h2m-1-1v2" />
    </svg>
  ),
  delivery: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8Z" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  genuine: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  returns: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
};

const TRUST_POINTS = [
  { icon: TRUST_ICONS.pharmacist, title: 'Licensed Pharmacist', desc: 'Every order verified by a qualified pharmacist' },
  { icon: TRUST_ICONS.delivery, title: 'Same-Day Delivery', desc: 'Order before 2 PM, get it today across Coimbatore' },
  { icon: TRUST_ICONS.genuine, title: 'Genuine Medicines', desc: 'Sourced only from CDSCO-licensed distributors' },
  { icon: TRUST_ICONS.returns, title: 'Easy Returns', desc: 'Hassle-free returns within 7 days if sealed' },
];

const STEPS = [
  { num: '01', title: 'Search or browse', desc: 'Find your medicine by name, salt, or category. Use the search bar or browse the counter.' },
  { num: '02', title: 'Upload prescription', desc: 'Prescription medicines need a valid Rx. Upload a photo — our pharmacist verifies it before dispatch.' },
  { num: '03', title: 'Get it delivered', desc: 'Same-day dispatch before 2 PM. Free delivery on orders above ₹499 across Coimbatore.' },
];

const TESTIMONIALS = [
  { name: 'Priya R.', area: 'Saibaba Colony', text: 'I have been ordering from Genezenz for over a year. The pharmacist always calls to confirm my diabetes medicines — that personal touch means a lot.' },
  { name: 'Karthik M.', area: 'RS Puram', text: 'Fastest delivery I have seen for a local pharmacy. Ordered Paracetamol and vitamins at 11 AM, got them by 3 PM. Prices are fair too.' },
  { name: 'Lakshmi S.', area: 'Ganapathy', text: 'As a new mother, I rely on them for baby care products. They never send substitutes without asking first. Very trustworthy pharmacy.' },
];

export default async function Home() {
  const [popular, categories] = await Promise.all([
    db.product
      .findMany({ where: { published: true, stock: { gt: 0 } }, orderBy: { stock: 'desc' }, take: 8 })
      .catch(() => []),
    db.category
      .findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } })
      .catch(() => []),
  ]);

  return (
    <>
      {/* Google can render these as an expandable rich result, which
          measurably lifts click-through rate. */}
      <JsonLd data={faqSchema(FAQS)} />

      {/* PROMO BANNERS CAROUSEL */}
      <PromoCarousel />

      {/* HERO */}
      <section className="border-b border-paper-edge">
        <div className="container-x grid items-start gap-8 md:gap-14 py-8 md:py-18 md:grid-cols-[3fr_2fr]">
          <div className="text-center md:text-left">
            <RuleLabel className="mx-auto md:mx-0">CDSCO Licensed · Established {site.founded}</RuleLabel>
            <h1 className="mt-3 text-[clamp(1.6rem,5vw,3.4rem)] leading-[1.15] tracking-[-0.035em]">
              Medicines, <em className="font-normal italic">dispensed</em>
              <br className="hidden sm:block" /> by people who know you.
            </h1>
            <div className="mt-4 md:mt-6 flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
              <span className="rounded-[3px] bg-green px-2 py-1 md:px-3 text-[0.7rem] md:text-[0.8rem] font-bold text-green-on">Medicines 18% OFF</span>
              <span className="rounded-[3px] bg-green px-2 py-1 md:px-3 text-[0.7rem] md:text-[0.8rem] font-bold text-green-on">Surgicals 25% OFF</span>
            </div>
            
            <p className="mt-4 mx-auto md:mx-0 max-w-[40ch] text-[0.9rem] md:text-[1.1rem] leading-relaxed text-ink-soft">
              Doorstep delivery within 10km of Ganapathy. 
              Can't find your medicine? Upload your prescription 🗒️
            </p>

            <div className="mt-6 md:mt-8 flex flex-col sm:flex-row flex-wrap justify-center md:justify-start gap-3">
              <ButtonLink href="/products" className="w-full sm:w-auto text-center justify-center">Browse the counter</ButtonLink>
              <ButtonLink href="/upload-prescription" tone="outline" className="w-full sm:w-auto text-center justify-center">Upload a prescription</ButtonLink>
            </div>

            <div className="mono mt-6 md:mt-9 flex flex-wrap justify-center md:justify-start gap-x-3 md:gap-x-5 gap-y-1 border-t border-paper-edge pt-4 text-[0.6rem] md:text-[0.68rem] uppercase tracking-[0.08em] text-ink-soft">
              <span>Pharmacist verified</span>
              <span className="text-ink-soft/40">•</span>
              <span>Same-day dispatch</span>
            </div>
          </div>

          {/* Lead capture */}
          <Panel accent="amber" className="mx-auto w-full max-w-md md:max-w-none">
            <RuleLabel className="border-t-0 pt-0">Call me back</RuleLabel>
            <h2 className="font-display mt-1.5 text-[1.2rem] md:text-[1.3rem]">Tell us what you need.</h2>
            <p className="mb-4 md:mb-5 mt-1 text-[0.85rem] text-ink-soft">
              Our pharmacist calls you back and confirms availability.
            </p>
            <LeadForm />
          </Panel>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="border-b border-paper-edge bg-paper-deep">
        <div className="container-x grid gap-6 py-10 md:grid-cols-4">
          {TRUST_POINTS.map((t, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-green text-green-on">
                {t.icon}
              </div>
              <h3 className="font-display mb-2 text-[1.05rem] font-medium">{t.title}</h3>
              <p className="text-[0.85rem] leading-relaxed text-ink-soft">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      {categories.length > 0 && (
        <section className="container-x py-18">
          <div className="mb-8 text-center">
            <RuleLabel>Browse</RuleLabel>
            <h2 className="mt-2 text-[1.7rem]">Shop by Category</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?cat=${c.slug}`}
                className="group flex items-center gap-4 rounded-[4px] border border-paper-edge bg-paper p-5 transition-colors hover:border-green"
              >
                <div className="text-green transition-transform group-hover:scale-110">
                  {CAT_ICONS[c.slug] || CAT_ICONS['personal-care']}
                </div>
                <div>
                  <h3 className="font-display text-[1.1rem] font-medium">{c.name}</h3>
                  <p className="mono mt-1 text-[0.7rem] uppercase tracking-[0.05em] text-ink-soft">
                    {c._count.products} Products
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="border-y border-paper-edge bg-paper-deep py-18">
        <div className="container-x">
          <div className="mb-12 text-center">
            <RuleLabel>The process</RuleLabel>
            <h2 className="mt-2 text-[1.7rem]">How it works</h2>
          </div>
          <div className="grid gap-10 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {/* Connecting line for desktop */}
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[3rem] top-6 hidden h-px w-[calc(100%-2rem)] bg-paper-edge md:block" />
                )}
                <div className="relative z-10 mb-5 inline-grid h-12 w-12 place-items-center rounded-full border border-green bg-paper font-display text-[1.1rem] font-semibold text-green">
                  {step.num}
                </div>
                <h3 className="font-display mb-2 text-[1.1rem] font-medium">{step.title}</h3>
                <p className="text-[0.9rem] leading-relaxed text-ink-soft">{step.desc}</p>
              </div>
            ))}
          </div>
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

      {/* TESTIMONIALS */}
      <section className="container-x py-18">
        <div className="mb-12 text-center">
          <RuleLabel>Local trust</RuleLabel>
          <h2 className="mt-2 text-[1.7rem]">What our customers say</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="flex flex-col rounded-[4px] border border-paper-edge bg-paper p-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-ink-soft/40" aria-hidden="true">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
              </svg>
              <p className="flex-1 text-[0.95rem] leading-loose text-ink-soft">"{t.text}"</p>
              <div className="mt-6 border-t border-paper-edge pt-4">
                <p className="font-display font-medium">{t.name}</p>
                <p className="mono mt-0.5 text-[0.65rem] uppercase tracking-[0.06em] text-ink-soft">{t.area}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

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
