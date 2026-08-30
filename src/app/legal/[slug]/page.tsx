import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { LEGAL_DOCS, LEGAL_UPDATED, legalBySlug } from '@/lib/legal';
import { buildMetadata } from '@/lib/seo';
import { Note, RuleLabel } from '@/components/ui';

// Static — policy pages rarely change and should be instant + indexable.
export const dynamic = 'force-static';

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = legalBySlug(slug);
  if (!doc) return { title: 'Not found' };
  return buildMetadata({ title: doc.title, description: doc.summary, path: `/legal/${doc.slug}` });
}

const fmt = (iso: string) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' }).format(new Date(iso));

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = legalBySlug(slug);
  if (!doc) notFound();

  return (
    <div className="container-x grid gap-12 py-14 pb-24 lg:grid-cols-[16rem_1fr]">
      {/* Policy index — every legal page links to every other. */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <RuleLabel>Policies</RuleLabel>
        <nav className="mt-4 flex flex-col gap-1.5 text-[0.9rem]">
          {LEGAL_DOCS.map((d) => (
            <Link
              key={d.slug}
              href={`/legal/${d.slug}`}
              aria-current={d.slug === doc.slug ? 'page' : undefined}
              className={`rounded-[3px] px-3 py-2 transition-colors ${
                d.slug === doc.slug ? 'bg-green-wash font-medium text-green' : 'text-ink-soft hover:text-green'
              }`}
            >
              {d.title}
            </Link>
          ))}
        </nav>
      </aside>

      <article className="max-w-[68ch]">
        <RuleLabel>Legal</RuleLabel>
        <h1 className="mt-2 text-[clamp(1.9rem,4vw,2.6rem)]">{doc.title}</h1>
        <p className="mono mt-2 text-[0.72rem] uppercase tracking-[0.08em] text-ink-soft">
          Last updated {fmt(LEGAL_UPDATED)}
        </p>

        <div className="mt-8 space-y-8">
          {doc.body.map((block, i) => (
            <section key={i}>
              {block.h && <h2 className="text-[1.15rem]">{block.h}</h2>}
              <div className={`space-y-3 leading-loose text-ink-soft ${block.h ? 'mt-2' : ''}`}>
                {block.p.map((para, j) => <p key={j}>{para}</p>)}
              </div>
            </section>
          ))}
        </div>

        {/* This is a draft, not legal advice — say so, every page. */}
        <Note tone="warn">
          <strong>For the client:</strong> this is a solid starting draft, not legal advice. Have
          your lawyer review it, and fill every ⟦bracketed⟧ placeholder — GSTIN, drug licence
          number and pharmacist details — from your registration documents before launch.
        </Note>
      </article>
    </div>
  );
}
