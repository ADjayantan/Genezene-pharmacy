'use client';

import { useActionState } from 'react';
import { updateTracking } from '@/app/admin/orders/actions';
import { Button, Field, inputClass } from '@/components/ui';

export function TrackingForm({
  orderId, courier, trackingId, trackingUrl, expectedAt,
}: {
  orderId: string;
  courier: string | null;
  trackingId: string | null;
  trackingUrl: string | null;
  expectedAt: Date | null;
}) {
  const [state, formAction, pending] = useActionState(updateTracking.bind(null, orderId), null);
  const dateValue = expectedAt ? expectedAt.toISOString().slice(0, 10) : '';

  return (
    <form action={formAction} className="mt-4 border-t border-paper-edge pt-4">
      <p className="mono mb-3 text-[0.62rem] uppercase tracking-[0.1em] text-ink-soft">Delivery tracking</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Courier">
          <input name="courier" defaultValue={courier ?? ''} className={inputClass} placeholder="Professional / DTDC / own rider" />
        </Field>
        <Field label="Tracking ID">
          <input name="trackingId" defaultValue={trackingId ?? ''} className={`${inputClass} mono`} />
        </Field>
        <Field label="Tracking link">
          <input name="trackingUrl" type="url" defaultValue={trackingUrl ?? ''} className={inputClass} placeholder="https://…" />
        </Field>
        <Field label="Expected delivery">
          <input name="expectedAt" type="date" defaultValue={dateValue} className={`${inputClass} mono`} />
        </Field>
      </div>

      {state?.error && <p role="alert" className="mt-2 text-[0.82rem] text-out">{state.error}</p>}

      <Button tone="quiet" size="sm" type="submit" disabled={pending} className="mt-3">
        {pending ? 'Saving…' : 'Save tracking'}
      </Button>
      <p className="mt-2 text-[0.72rem] text-ink-soft">
        Saved details appear on the customer&apos;s order page, so they stop calling to ask where
        it is.
      </p>
    </form>
  );
}
