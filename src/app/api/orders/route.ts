import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { site } from '@/lib/config';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(/^[0-9+\-\s()]{8,20}$/),
  address: z.string().trim().min(10, 'Please enter a complete address').max(500),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Enter a valid 6-digit PIN code'),
  notes: z.string().trim().max(500).optional(),
  items: z.array(z.object({ id: z.string(), qty: z.number().int().min(1).max(50) })).min(1).max(50),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Please sign in to place an order' }, { status: 401 });

  const rl = rateLimit(`order:${session.sub}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ message: 'Too many orders. Please contact us instead.' }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? 'Invalid order' }, { status: 400 });
  }
  const { items, ...ship } = parsed.data;

  try {
    const order = await db.$transaction(async (tx) => {
      // Prices come from the DATABASE, never from the request body. A client
      // that posts {price: 1} must not be able to buy a ₹500 medicine for ₹1.
      const products = await tx.product.findMany({
        where: { id: { in: items.map((i) => i.id) }, published: true },
      });

      if (products.length !== items.length) {
        throw new Error('Some items are no longer available. Please review your cart.');
      }

      let total = 0;
      const lines = items.map((i) => {
        const p = products.find((x) => x.id === i.id)!;
        if (p.stock < i.qty) {
          throw new Error(`${p.name} — only ${p.stock} left in stock.`);
        }
        const price = Number(p.price);
        total += price * i.qty;
        // Snapshot the cost as well. Cost prices change; a margin report run
        // next year must still show what this order actually earned.
        return {
          productId: p.id, name: p.name, qty: i.qty, price,
          costPrice: p.costPrice ? Number(p.costPrice) : null,
          // Snapshot GST % too, so a reprinted invoice years later still shows
          // the rate that actually applied at the time of sale.
          gstRate: p.gstRate != null ? Number(p.gstRate) : null,
        };
      });

      const delivery = total >= site.offers.freeDeliveryAbove ? 0 : 49;
      total += delivery;

      // Decrement stock inside the same transaction. Two customers buying the
      // last unit at the same time must not both succeed.
      for (const l of lines) {
        const res = await tx.product.updateMany({
          where: { id: l.productId, stock: { gte: l.qty } },
          data: { stock: { decrement: l.qty } },
        });
        if (res.count === 0) throw new Error('Stock changed while placing your order. Please try again.');
      }

      const costTotal = lines.every((l) => l.costPrice != null)
        ? lines.reduce((s, l) => s + (l.costPrice ?? 0) * l.qty, 0)
        : null;

      return tx.order.create({
        data: {
          orderNo: `GZ${Date.now().toString(36).toUpperCase()}`,
          userId: session.sub,
          total,
          costTotal,
          ...ship,
          items: { create: lines },
          // Seed the tracking timeline with the order being placed.
          events: { create: { status: 'PENDING', note: 'Order placed', actor: null } },
        },
      });
    });

    return NextResponse.json({ ok: true, orderNo: order.orderNo });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Could not place the order';
    return NextResponse.json({ message: msg }, { status: 400 });
  }
}
