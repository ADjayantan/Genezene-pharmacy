'use client';

import { useState } from 'react';
import { Button, Field, inputClass } from './ui';

/**
 * Website lead capture. Writes into the SAME Lead table as the Facebook and
 * Instagram ad leads, so the pharmacy sees one stream instead of four apps.
 */
export function LeadForm({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setState('sending');

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    }).catch(() => null);

    const data = await res?.json().catch(() => null);
    if (res?.ok) {
      setState('done');
      setMsg(data?.message ?? 'We will call you back shortly.');
      form.reset();
    } else {
      setState('error');
      setMsg(data?.message ?? 'Something went wrong. Please call us instead.');
    }
  }

  // Replace the form outright on success. Leaving a stale form beside a toast
  // makes people submit twice.
  if (state === 'done') {
    return (
      <div role="status" className="rounded-[3px] border-l-[3px] border-green bg-green-wash px-5 py-6 text-center">
        <p className="font-display text-lg">Request received</p>
        <p className="mt-1 text-[0.87rem] text-ink-soft">{msg}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      {/* Honeypot — invisible to people, irresistible to bots. Kills most form
          spam without inflicting a CAPTCHA on genuine customers. */}
      <input
        type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      <div className={compact ? 'space-y-3.5' : 'grid gap-3.5 sm:grid-cols-2'}>
        <Field label="Your name">
          <input name="name" required minLength={2} maxLength={80} className={inputClass} placeholder="Ravi Kumar" />
        </Field>
        <Field label="Phone">
          <input name="phone" required type="tel" inputMode="tel" className={inputClass} placeholder="98765 43210" />
        </Field>
      </div>

      <Field label="What do you need?" hint="Optional">
        <textarea
          name="message" rows={3} maxLength={1000} className={inputClass}
          placeholder="Medicine name, or upload your prescription after we call"
        />
      </Field>

      {state === 'error' && <p role="alert" className="text-[0.85rem] text-out">{msg}</p>}

      <Button tone="primary" full type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Request a callback'}
      </Button>
      <p className="text-center text-[0.72rem] text-ink-soft">
        We call back within opening hours. Your details are never shared.
      </p>
    </form>
  );
}
