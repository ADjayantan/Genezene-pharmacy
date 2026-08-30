import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { buildMetadata, JsonLd, faqSchema } from '@/lib/seo';
import { RxUploadForm } from '@/components/RxUploadForm';
import { Panel, RuleLabel, StepNumber } from '@/components/ui';
import { site } from '@/lib/config';

export const metadata: Metadata = buildMetadata({
  title: 'Upload Prescription Online — Genezenz Pharmacy Coimbatore',
  description:
    'Upload your doctor’s prescription and our licensed pharmacists will prepare your order. Photo or PDF accepted. Same-day dispatch in Coimbatore.',
  path: '/upload-prescription',
});

const FAQS = [
  { q: 'What formats can I upload?', a: 'A clear photo (JPG, PNG, WEBP or HEIC) or a PDF, up to 8 MB.' },
  { q: 'Who can see my prescription?', a: 'Only you and our pharmacists. Prescription files are encrypted before storage and are never published on a public link.' },
  { q: 'How long does verification take?', a: 'A pharmacist reviews uploads during opening hours, Monday to Saturday, 9 AM to 8 PM — usually within a couple of hours.' },
];

const STEPS: [string, string][] = [
  ['Upload', 'A clear photo or PDF. Make sure the doctor’s name, the date and the medicines are readable.'],
  ['Pharmacist reviews', 'We verify dosage and availability, and call you if anything needs clarification.'],
  ['Delivered', `Dispatched the same day for uploads before ${site.offers.dispatchCutoff}.`],
];

export default async function UploadRxPage() {
  await requireUser('/upload-prescription');

  return (
    <>
      <JsonLd data={faqSchema(FAQS)} />

      <div className="container-x grid gap-14 py-14 md:grid-cols-2 md:py-20">
        <div>
          <RuleLabel>Prescription service</RuleLabel>
          <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.4rem)]">Upload your prescription</h1>
          <p className="mt-4 max-w-[46ch] leading-relaxed text-ink-soft">
            Send us a photo or PDF of your doctor&apos;s prescription. A licensed pharmacist
            checks it, confirms availability, and prepares your order.
          </p>

          <ol className="mt-10 space-y-6">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <StepNumber n={i + 1} />
                <div>
                  <h2 className="font-display text-[0.98rem] font-semibold">{title}</h2>
                  <p className="mt-0.5 text-[0.87rem] leading-relaxed text-ink-soft">{body}</p>
                </div>
              </li>
            ))}
          </ol>

        </div>

        <div className="md:sticky md:top-24 md:self-start">
          <Panel accent="green">
            {/* The privacy assurance sits directly ABOVE the drop zone, not
                across the page in a sidebar. Anxiety about handing over a
                medical document peaks in the second before you attach it —
                that is where the answer has to be, or it does not get read. */}
            <div className="mb-5 border-l-[3px] border-green bg-paper px-4 py-3">
              <p className="mono text-[0.6rem] uppercase tracking-[0.1em] text-ink-soft">Your privacy</p>
              <p className="mt-1.5 text-[0.84rem] leading-relaxed text-ink-soft">
                Your prescription is <strong className="text-ink">encrypted before it is stored</strong>{' '}
                and can only be opened by you and our pharmacists. We never publish it on a
                shareable link and we do not pass it to third parties.
              </p>
            </div>
            <RxUploadForm />
          </Panel>
        </div>
      </div>
    </>
  );
}
