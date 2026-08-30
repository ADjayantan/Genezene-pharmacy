'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 90);

const schema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().max(90).optional(),
  description: z.string().trim().min(10, 'Write at least a sentence — thin pages do not rank').max(2000),
  content: z.string().trim().max(8000).optional(),
  price: z.coerce.number().min(0).max(1_000_000),
  mrp: z.coerce.number().min(0).max(1_000_000).optional(),
  costPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  stock: z.coerce.number().int().min(0).max(100000),
  reorderLevel: z.coerce.number().int().min(0).max(10000).optional(),
  brand: z.string().trim().max(120).optional(),
  saltName: z.string().trim().max(160).optional(),
  // Gallery arrives as one newline-separated field from ImageManager.
  // z.url() alone accepts javascript: and data: URLs, and these end up in an
  // <img src>, so every entry is checked for an http(s) protocol here too —
  // the client-side check is a convenience, not a control.
  images: z
    .string()
    .transform((v) =>
      v.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 12),
    )
    .refine(
      (urls) => urls.every((u) => {
        try { return ['http:', 'https:'].includes(new URL(u).protocol); } catch { return false; }
      }),
      'Every image URL must start with http:// or https://',
    )
    .optional(),
  categoryId: z.string().optional(),
  rxRequired: z.coerce.boolean().optional(),
  published: z.coerce.boolean().optional(),
  metaTitle: z.string().trim().max(70).optional(),
  metaDescription: z.string().trim().max(170).optional(),
  batchNo: z.string().trim().max(60).optional(),
  // <input type="date"> gives "YYYY-MM-DD"; store as a real Date (UTC midnight).
  expiryDate: z.coerce.date().optional(),
  gstRate: z.coerce.number().min(0).max(28).optional(),
});

function parse(fd: FormData) {
  const raw = Object.fromEntries(fd) as Record<string, unknown>;
  raw.rxRequired = fd.get('rxRequired') === 'on';
  raw.published = fd.get('published') === 'on';
  // Empty numeric fields must be absent, not '' — an empty cost price means
  // "not recorded", which is meaningfully different from zero. Same for an
  // empty expiry/GST: absent means "not set", not "expires at epoch / 0%".
  for (const k of ['mrp', 'costPrice', 'reorderLevel', 'categoryId', 'batchNo', 'expiryDate', 'gstRate']) {
    if (!raw[k]) delete raw[k];
  }
  return schema.safeParse(raw);
}

/** The first gallery image is the primary one shown on cards and in search. */
function withImages<T extends { images?: string[] }>(d: T) {
  const images = d.images ?? [];
  return { ...d, images, imageUrl: images[0] ?? null };
}

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = base || 'product';
  let n = 1;
  // Slug is the URL. A collision would silently 404 the older product.
  while (await db.product.findFirst({ where: { slug, NOT: excludeId ? { id: excludeId } : undefined } })) {
    slug = `${base}-${++n}`;
  }
  return slug;
}

export async function createProduct(_prev: unknown, fd: FormData) {
  await requireAdmin();
  const parsed = parse(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the fields' };

  const d = withImages(parsed.data);
  await db.product.create({
    data: {
      ...d,
      slug: await uniqueSlug(d.slug || slugify(d.name)),
      published: d.published ?? true,
    },
  });

  revalidatePath('/admin/products');
  revalidatePath('/products');
  redirect('/admin/products');
}

export async function updateProduct(id: string, _prev: unknown, fd: FormData) {
  await requireAdmin();
  const parsed = parse(fd);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the fields' };

  const d = withImages(parsed.data);
  const product = await db.product.update({
    where: { id },
    data: { ...d, slug: await uniqueSlug(d.slug || slugify(d.name), id) },
  });

  revalidatePath('/admin/products');
  revalidatePath('/products');
  revalidatePath(`/products/${product.slug}`);
  redirect('/admin/products');
}

export async function deleteProduct(id: string) {
  await requireAdmin();

  // A product referenced by past orders must not be deleted — that would
  // orphan order history. Unpublish it instead.
  const used = await db.orderItem.count({ where: { productId: id } });
  if (used > 0) {
    await db.product.update({ where: { id }, data: { published: false } });
  } else {
    await db.product.delete({ where: { id } });
  }

  revalidatePath('/admin/products');
  revalidatePath('/products');
}
