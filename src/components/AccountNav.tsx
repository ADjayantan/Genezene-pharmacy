'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Me = { signedIn: boolean; role?: 'ADMIN' | 'CUSTOMER' };

/**
 * The only part of the header that depends on who is signed in.
 *
 * Reading the session on the server would make every page dynamic (see
 * /api/me for why that matters), so this asks after hydration. Before the
 * answer arrives it renders the signed-out state — which is correct for the
 * overwhelming majority of visitors and for every crawler.
 */
export function AccountNav() {
  const [me, setMe] = useState<Me>({ signedIn: false });
  const pathname = usePathname();

  useEffect(() => {
    const ctrl = new AbortController();
    fetch('/api/me', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : { signedIn: false }))
      .then(setMe)
      .catch(() => { /* offline — signed-out state is a safe default */ });
    return () => ctrl.abort();
    // Re-check after navigation, so signing in or out updates the header.
  }, [pathname]);

  return (
    <>
      {/* Rendered only for an ADMIN. A customer's browser never receives this
          markup, so the back office stays invisible to everyone else. */}
      {me.role === 'ADMIN' && (
        <Link
          href="/admin"
          className="mono mr-2 hidden rounded-[3px] bg-ink px-3 py-1.5 text-[0.66rem] uppercase tracking-[0.08em] text-paper transition-opacity hover:opacity-85 sm:inline-block"
        >
          Back office
        </Link>
      )}

      <Link
        href={me.signedIn ? '/profile' : '/login'}
        aria-label={me.signedIn ? 'My account' : 'Sign in'}
        className="grid h-11 w-11 place-items-center text-ink-soft transition-colors hover:text-green"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </Link>
    </>
  );
}
