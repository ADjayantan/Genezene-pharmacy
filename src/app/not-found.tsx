import { ButtonLink, RuleLabel } from '@/components/ui';

/** Calm and useful. No cartoon, no joke — this is a pharmacy. */
export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] max-w-[36rem] flex-col justify-center py-20">
      <RuleLabel>404</RuleLabel>
      <h1 className="mt-3 text-[clamp(1.7rem,4vw,2.2rem)]">We couldn&apos;t find that page.</h1>
      <p className="mt-4 leading-relaxed text-ink-soft">
        The medicine may have been renamed or delisted. Our pharmacist can usually source it —
        it is worth asking.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/products">Browse medicines</ButtonLink>
        <ButtonLink href="/upload-prescription" tone="outline">Upload a prescription</ButtonLink>
        <ButtonLink href="/contact" tone="quiet">Talk to us</ButtonLink>
      </div>
    </div>
  );
}
