'use client';

import { useEffect } from 'react';
import { site } from '@/lib/config';
import { Button, ButtonLink, RuleLabel } from '@/components/ui';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log for us; never surface the raw message to the customer.
    console.error('[app-error]', error);
  }, [error]);

  return (
    <div className="container-x flex min-h-[60vh] max-w-[36rem] flex-col justify-center py-20">
      <RuleLabel>Error</RuleLabel>
      <h1 className="mt-3 text-[clamp(1.7rem,4vw,2.2rem)]">Something went wrong at our end.</h1>
      <p className="mt-4 leading-relaxed text-ink-soft">
        This is our fault, not yours. Try again — and if it keeps happening, call the counter and
        we will take your order over the phone.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href={`tel:${site.phone}`} tone="outline">Call {site.phoneDisplay}</ButtonLink>
      </div>
      {error.digest && (
        <p className="mono mt-8 text-[0.68rem] text-ink-soft">Reference: {error.digest}</p>
      )}
    </div>
  );
}
