'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { Button, Field, RuleLabel, inputClass } from '@/components/ui';

export default function AdminLogin() {
  const router = useRouter();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const fd = new FormData(e.currentTarget);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password'), scope: 'admin' }),
    });

    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      setErr((await res.json().catch(() => ({}))).message ?? 'Login failed');
      setBusy(false);
    }
  }

  return (
    <div className="container-x flex min-h-[80vh] items-center justify-center py-16">
      {/* Deliberately plainer than the customer login — this is a back-office
          door, not a place to be welcomed. No reset link (there is no reset
          flow yet) and no registration link. */}
      <form onSubmit={onSubmit} className="w-full max-w-[22rem]">
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="mono text-[0.64rem] uppercase tracking-[0.14em] text-ink-soft">Admin</span>
        </div>
        <RuleLabel className="mt-5">Restricted</RuleLabel>
        <h1 className="mt-2 text-[1.4rem]">Sign in</h1>

        <div className="mt-6 space-y-3.5">
          <Field label="Email">
            <input name="email" type="email" required className={inputClass} autoComplete="username" />
          </Field>
          <Field label="Password">
            <input name="password" type="password" required className={inputClass} autoComplete="current-password" />
          </Field>
        </div>

        {err && <p role="alert" className="mt-3.5 text-[0.85rem] text-out">{err}</p>}

        <Button tone="primary" full type="submit" disabled={busy} className="mt-6">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
