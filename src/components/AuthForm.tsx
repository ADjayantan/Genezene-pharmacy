'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Logo } from './Logo';
import { safeNext } from '@/lib/safe-redirect';
import { Button, Field, RuleLabel, inputClass } from './ui';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const params = useSearchParams();
  // Never push a raw query param into the router — see lib/safe-redirect.ts.
  const next = safeNext(params.get('next'));
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr('');

    const res = await fetch(`/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))),
    });

    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      setErr((await res.json().catch(() => ({}))).message ?? 'Something went wrong');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm">
      <Logo size={40} />
      <RuleLabel className="mt-5">{mode === 'login' ? 'Account' : 'New account'}</RuleLabel>
      <h1 className="mt-2 text-[1.6rem]">{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>
      <p className="mb-7 mt-1 text-[0.87rem] text-ink-soft">
        {mode === 'login'
          ? 'Access your orders and prescriptions.'
          : 'Order faster and keep your prescriptions in one place.'}
      </p>

      <div className="space-y-3.5">
        {mode === 'register' && (
          <Field label="Full name">
            <input name="name" required minLength={2} className={inputClass} autoComplete="name" />
          </Field>
        )}
        <Field label="Email">
          <input name="email" type="email" required className={inputClass} autoComplete="email" />
        </Field>
        {mode === 'register' && (
          <Field label="Phone">
            <input name="phone" type="tel" required className={inputClass} autoComplete="tel" />
          </Field>
        )}
        <Field label="Password" hint={mode === 'register' ? 'At least 8 characters.' : undefined}>
          <input
            name="password" type="password" required
            minLength={mode === 'register' ? 8 : 1}
            className={inputClass}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </Field>
      </div>

      {err && <p role="alert" className="mt-3.5 text-[0.85rem] text-out">{err}</p>}

      <Button tone="primary" full type="submit" disabled={busy} className="mt-6">
        {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
      </Button>

      <p className="mt-6 text-center text-[0.87rem] text-ink-soft">
        {mode === 'login' ? (
          <>New here? <Link href="/register" className="font-semibold text-green hover:underline">Create an account</Link></>
        ) : (
          <>Already registered? <Link href="/login" className="font-semibold text-green hover:underline">Sign in</Link></>
        )}
      </p>
    </form>
  );
}
