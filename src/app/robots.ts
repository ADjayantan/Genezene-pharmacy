import type { MetadataRoute } from 'next';
import { site } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Never let Google index the admin panel, API routes, or a user's
        // cart/account — thin pages that dilute crawl budget and leak data.
        disallow: ['/admin', '/api/', '/cart', '/checkout', '/profile', '/login', '/*?*sort=', '/*?*page='],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
