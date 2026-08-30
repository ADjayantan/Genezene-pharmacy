'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import type { OrderStatus } from '@prisma/client';

const VALID: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export async function updateOrderStatus(id: string, status: string) {
  const admin = await requireAdmin();
  if (!VALID.includes(status as OrderStatus)) throw new Error('Invalid status');
  const next = status as OrderStatus;

  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new Error('Order not found');
    if (order.status === next) return;

    // Cancelling must return the stock, or the shop slowly loses inventory
    // every time an order is cancelled.
    if (next === 'CANCELLED' && order.status !== 'CANCELLED') {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.qty } },
        });
      }
    }

    await tx.order.update({
      where: { id },
      data: {
        status: next,
        deliveredAt: next === 'DELIVERED' ? new Date() : order.deliveredAt,
      },
    });

    // Append-only history: this is what the customer's tracking timeline reads,
    // and the shop's record of who moved the order and when.
    await tx.orderEvent.create({
      data: { orderId: id, status: next, actor: admin.email },
    });
  });

  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  revalidatePath('/profile');
}

const trackingSchema = z.object({
  courier: z.string().trim().max(80).optional().or(z.literal('')),
  trackingId: z.string().trim().max(80).optional().or(z.literal('')),
  trackingUrl: z
    .string().trim().max(400)
    .refine((v) => {
      if (!v) return true;
      try { return ['http:', 'https:'].includes(new URL(v).protocol); } catch { return false; }
    }, 'Tracking link must start with https://')
    .optional().or(z.literal('')),
  expectedAt: z.string().trim().optional().or(z.literal('')),
});

export async function updateTracking(id: string, _prev: unknown, fd: FormData) {
  const admin = await requireAdmin();

  const parsed = trackingSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the fields' };

  const d = parsed.data;
  const expected = d.expectedAt ? new Date(d.expectedAt) : null;
  if (expected && Number.isNaN(expected.getTime())) return { error: 'Invalid expected date' };

  await db.order.update({
    where: { id },
    data: {
      courier: d.courier || null,
      trackingId: d.trackingId || null,
      trackingUrl: d.trackingUrl || null,
      expectedAt: expected,
    },
  });

  await db.orderEvent.create({
    data: {
      orderId: id,
      status: 'SHIPPED',
      note: d.courier ? `Tracking added — ${d.courier}${d.trackingId ? ` ${d.trackingId}` : ''}` : 'Tracking updated',
      actor: admin.email,
    },
  });

  revalidatePath('/admin/orders');
  revalidatePath('/profile');
  return undefined;
}
