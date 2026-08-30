import type { Metadata } from 'next';
import { site } from './config';

/**
 * Google ranks on: unique title/description, clean canonical, structured data,
 * and speed. This file handles the first three. next.config.ts + RSC handle speed.
 */
export function buildMetadata({
  title,
  description,
  path = '/',
  image,
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = `${site.url}${path}`;
  const ogImage = image || `${site.url}/opengraph-image`;

  return {
    title,
    description,
    // Canonical prevents duplicate-content penalties when the same product
    // is reachable via ?category=, ?sort=, etc.
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

/* ── JSON-LD structured data ──────────────────────────
   This is what gets you the rich result in Google: star ratings,
   price, stock status, opening hours, the map pin. Plain HTML
   alone will never produce those.
   ──────────────────────────────────────────────────── */

export function pharmacySchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Pharmacy',
    '@id': `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    telephone: site.phone,
    description: site.description,
    image: `${site.url}/opengraph-image`,
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: `${site.address.locality}, ${site.address.city}`,
      addressRegion: site.address.region,
      postalCode: site.address.postal,
      addressCountry: site.address.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    openingHoursSpecification: site.hours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: h.days,
      opens: h.open,
      closes: h.close,
    })),
    // Every suburb we deliver to. Google uses this for the local pack.
    areaServed: site.serviceAreas.map((a) => ({ '@type': 'Place', name: `${a}, Coimbatore` })),
    sameAs: [site.social.facebook, site.social.instagram].filter(Boolean),
    email: site.email,
    foundingDate: site.founded,
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, UPI, Credit Card, Debit Card, Net Banking',
    // NOTE: deliberately NO aggregateRating here. Google issues manual
    // penalties for self-serving/unverifiable review markup. Once the client
    // has real Google Business Profile reviews, wire those in instead.
  };
}

export function productSchema(p: {
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  brand?: string | null;
  stock: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    image: p.imageUrl ? [p.imageUrl] : undefined,
    brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
    offers: {
      '@type': 'Offer',
      url: `${site.url}/products/${p.slug}`,
      priceCurrency: 'INR',
      price: p.price.toFixed(2),
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Pharmacy', name: site.name },
    },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${site.url}${t.path}`,
    })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** Renders JSON-LD safely. Server component — zero client JS cost. */
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
