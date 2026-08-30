'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { hasAnalyticsConsent } from './CookieConsent';

/**
 * Google Analytics that respects consent.
 *
 * Two gates, both required:
 *   1. NEXT_PUBLIC_GA_ID must be set — otherwise this renders nothing, so the
 *      app ships analytics-free until the client actually wants it.
 *   2. The visitor must have accepted analytics cookies — nothing loads before
 *      that, which is the whole point of the consent banner.
 *
 * The component re-checks consent shortly after mount so that clicking "Accept"
 * turns analytics on within the same session without a reload. Declining leaves
 * it permanently inert.
 */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!id) return;
    const check = () => setOk(hasAnalyticsConsent());
    check();
    // Pick up a consent choice made after first paint.
    const t = setInterval(check, 1500);
    return () => clearInterval(t);
  }, [id]);

  if (!id || !ok) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
          gtag('js',new Date());
          gtag('config','${id}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
