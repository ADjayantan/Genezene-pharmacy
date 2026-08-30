'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Cookie consent — privacy-first.
 *
 * The banner only decides whether NON-ESSENTIAL cookies (analytics) may load.
 * Essential cookies (session, cart) are always on and are not what consent is
 * about, so the copy says so plainly rather than pretending everything is
 * optional.
 *
 * Crucially: analytics scripts must key off `hasAnalyticsConsent()` and load
 * ONLY after "Accept". Declining is a first-class choice — it is the default,
 * the decline button is not hidden or greyed, and the shop works either way.
 * That is the honest reading of India's DPDP Act and just good manners.
 *
 * The choice lives in localStorage. If it cannot be read (private mode), we
 * simply show the banner again — never assume consent.
 */
const KEY = 'gz_cookie_consent_v1';

export function hasAnalyticsConsent(): boolean {
  try { return localStorage.getItem(KEY) === 'accepted'; } catch { return false; }
}

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true); // storage blocked — ask, don't assume
    }
  }, []);

  const decide = (value: 'accepted' | 'declined') => {
    try { localStorage.setItem(KEY, value); } catch { /* ignore */ }
    setShow(false);
    // If accepted, a real analytics loader would initialise here.
    // Intentionally nothing fires on decline.
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie choices"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-2xl rounded-[4px] border border-paper-edge bg-paper p-5 shadow-lg sm:inset-x-auto sm:left-6 sm:bottom-6"
    >
      <p className="text-[0.87rem] leading-relaxed text-ink">
        We use only the cookies needed to run the shop. With your permission we would also use
        privacy-respecting analytics to improve the site — nothing loads until you choose.{' '}
        <Link href="/legal/cookies" className="font-semibold text-green underline">
          Cookie policy
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          onClick={() => decide('accepted')}
          className="rounded-[3px] bg-green px-4 py-2 text-[0.85rem] font-semibold text-green-on transition-colors hover:bg-green-deep"
        >
          Accept analytics
        </button>
        <button
          onClick={() => decide('declined')}
          className="rounded-[3px] border border-paper-edge px-4 py-2 text-[0.85rem] font-medium transition-colors hover:border-green"
        >
          Essential only
        </button>
      </div>
    </div>
  );
}
