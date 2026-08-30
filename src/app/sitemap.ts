import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { site } from '@/lib/config';
import { LEGAL_DOCS } from '@/lib/legal';

/**
 * Generated from the database on every request (revalidated hourly), so a
 * product added in the admin panel is submitted to Google automatically.
 * A hand-maintained sitemap.xml goes stale within a week — this never does.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${site.url}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${site.url}/upload-prescription`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/contact`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${site.url}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${site.url}/legal`, changeFrequency: 'yearly', priority: 0.3 },
    ...LEGAL_DOCS.map((d) => ({
      url: `${site.url}/legal/${d.slug}`,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
  ];

  // One landing page per delivery area — these rank for
  // "pharmacy near me" / "medical shop in <area>".
  const areaRoutes: MetadataRoute.Sitemap = site.serviceAreas.map((a) => ({
    url: `${site.url}/pharmacy-in-${a.toLowerCase().replace(/\s+/g, '-')}-coimbatore`,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await db.product.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      take: 5000, // sitemap hard limit is 50k URLs / 50MB
    });
    productRoutes = products.map((p) => ({
      url: `${site.url}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // DB down at build time shouldn't break the sitemap entirely.
  }

  return [...staticRoutes, ...areaRoutes, ...productRoutes];
}
