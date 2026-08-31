import type { Metadata, Viewport } from 'next';
import { Fraunces, Karla, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { site } from '@/lib/config';
import { JsonLd, pharmacySchema } from '@/lib/seo';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { ChatWidget } from '@/components/ChatWidget';
import { CookieConsent } from '@/components/CookieConsent';
import { Analytics } from '@/components/Analytics';
import { CartProvider } from '@/components/CartProvider';
import { ToastProvider } from '@/components/Toast';

/* Self-hosted by next/font: no request to Google at runtime, no layout
   shift, and the fonts keep working if the CDN is blocked. */
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
  display: 'swap',
});
const karla = Karla({ subsets: ['latin'], variable: '--font-karla', display: 'swap' });
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Online Pharmacy in Coimbatore`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: [...site.keywords],
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  formatDetection: { telephone: true, address: true, email: true },
  alternates: { canonical: '/' },
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
  openGraph: { type: 'website', locale: 'en_IN', siteName: site.name, url: site.url },
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
};

export const viewport: Viewport = {
  // Matches --paper so the mobile browser chrome blends into the page.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F2' },
    { media: '(prefers-color-scheme: dark)', color: '#14201C' },
  ],
  width: 'device-width',
  initialScale: 1,
};

/**
 * Deliberately NOT async, and deliberately does not read the session.
 *
 * getSession() calls cookies(), and cookies() in the root layout opts every
 * route that uses it into dynamic rendering — including the eight local-area
 * pages whose entire purpose is to be static HTML with instant TTFB. The
 * header asks /api/me after hydration instead. See AccountNav.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${fraunces.variable} ${karla.variable} ${jetbrains.variable}`}
    >
      <head>
        {/* Site-wide Pharmacy schema, in the initial HTML so crawlers see it
            without executing a byte of JavaScript. */}
        <JsonLd data={pharmacySchema()} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[3px] focus:bg-green focus:px-4 focus:py-2 focus:text-green-on"
        >
          Skip to content
        </a>
        <ToastProvider>
          <CartProvider>
            <SiteHeader />
            <main id="main">{children}</main>
            <SiteFooter />
            <WhatsAppFab />
            <ChatWidget />
            <CookieConsent />
            <Analytics />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
