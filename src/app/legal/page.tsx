import Link from 'next/link';
import type { Metadata } from 'next';
import { LEGAL_DOCS } from '@/lib/legal';
import { buildMetadata } from '@/lib/seo';
import { RuleLabel } from '@/components/ui';

export const dynamic = 'force-static';

export const metadata: Metadata = buildMetadata({
  title: 'Policies & Legal',
  description: 'Privacy, terms, shipping, returns and prescription policies for Genezenz Pharmacy.',
  path: '/legal',
});

export default function LegalIndex() {
  return (
    <div className="container-x max-w-[68ch] py-14 pb-24">
      <RuleLabel>Legal</RuleLabel>
      <h1 className="mt-2 text-[clamp(1.9rem,4vw,2.6rem)]">Policies &amp; legal</h1>
      <p className="mt-4 text-ink-soft">
        Everything about how we operate, protect your data, and handle medicines.
      </p>

      <div className="mt-8 divide-y divide-paper-edge">
        {LEGAL_DOCS.map((d) => (
          <Link key={d.slug} href={`/legal/${d.slug}`} className="group flex items-baseline justify-between gap-4 py-4">
            <span>
              <span className="font-display text-[1.1rem] font-medium group-hover:text-green">{d.title}</span>
              <span className="mt-0.5 block text-[0.87rem] text-ink-soft">{d.summary}</span>
            </span>
            <span className="text-green">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
