import { db } from '@/lib/db';

/**
 * SHOP ANALYTICS
 *
 * One rule runs through this file: never invent a number the client would
 * plan around.
 *
 * Profit needs a cost price. Products without one are excluded from the margin
 * calculation and counted separately, so the dashboard can say "profit shown
 * for 34 of 124 products" rather than quietly reporting a margin computed from
 * a guess. A wrong margin is worse than no margin — the client will price
 * against it.
 */

/** Orders that represent real money. Cancelled orders are counted as loss,
 *  not netted out of revenue, so both figures stay honest. */
const EARNING = ['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] as const;

export type Money = number;

export type SalesSummary = {
  revenue: Money;
  cost: Money;
  grossProfit: Money;
  marginPct: number | null;      // null when no costed items sold
  orders: number;
  avgOrderValue: Money;
  itemsSold: number;
  /** Share of sold line items that had a cost price recorded. */
  costCoverage: number;
};

export type LossSummary = {
  cancelledValue: Money;
  cancelledOrders: number;
  outOfStockSkus: number;
  lowStockSkus: number;
  /** Capital sitting on the shelf, for products with a known cost. */
  stockValueAtCost: Money | null;
};

function num(v: unknown): number {
  return v == null ? 0 : Number(v);
}

/** Revenue, cost and margin over a window. */
export async function getSales(days = 30): Promise<SalesSummary> {
  const since = new Date(Date.now() - days * 86_400_000);

  const orders = await db.order.findMany({
    where: { createdAt: { gte: since }, status: { in: [...EARNING] } },
    include: { items: true },
  });

  let revenue = 0, cost = 0, itemsSold = 0, costedItems = 0, totalItems = 0;

  for (const o of orders) {
    revenue += num(o.total);
    for (const i of o.items) {
      itemsSold += i.qty;
      totalItems += 1;
      if (i.costPrice != null) {
        cost += num(i.costPrice) * i.qty;
        costedItems += 1;
      }
    }
  }

  // Only claim a margin when we actually costed most of what was sold.
  // Below that the number would be misleading rather than approximate.
  const coverage = totalItems === 0 ? 0 : costedItems / totalItems;
  const grossProfit = revenue - cost;
  const marginPct = coverage >= 0.5 && revenue > 0 ? (grossProfit / revenue) * 100 : null;

  return {
    revenue,
    cost,
    grossProfit,
    marginPct,
    orders: orders.length,
    avgOrderValue: orders.length ? revenue / orders.length : 0,
    itemsSold,
    costCoverage: coverage,
  };
}

export async function getLoss(days = 30): Promise<LossSummary> {
  const since = new Date(Date.now() - days * 86_400_000);

  const [cancelled, outOfStock, lowStock, costed] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: since }, status: 'CANCELLED' },
      select: { total: true },
    }),
    db.product.count({ where: { published: true, stock: { lte: 0 } } }),
    db.product.count({ where: { published: true, stock: { gt: 0, lte: 10 } } }),
    db.product.findMany({
      where: { published: true, costPrice: { not: null } },
      select: { stock: true, costPrice: true },
    }),
  ]);

  const stockValueAtCost = costed.length
    ? costed.reduce((s, p) => s + num(p.costPrice) * p.stock, 0)
    : null;

  return {
    cancelledValue: cancelled.reduce((s, o) => s + num(o.total), 0),
    cancelledOrders: cancelled.length,
    outOfStockSkus: outOfStock,
    lowStockSkus: lowStock,
    stockValueAtCost,
  };
}

/** Daily revenue for the trend chart. Zero-filled so gaps read as gaps. */
export async function getDailyRevenue(days = 30): Promise<{ date: string; value: number }[]> {
  const since = new Date(Date.now() - days * 86_400_000);

  const orders = await db.order.findMany({
    where: { createdAt: { gte: since }, status: { in: [...EARNING] } },
    select: { createdAt: true, total: true },
  });

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const o of orders) {
    const k = o.createdAt.toISOString().slice(0, 10);
    if (buckets.has(k)) buckets.set(k, buckets.get(k)! + num(o.total));
  }

  return [...buckets].map(([date, value]) => ({ date, value }));
}

export type TopProduct = {
  productId: string; name: string; qty: number; revenue: number; profit: number | null;
};

/** Best sellers by revenue, with margin where cost is known. */
export async function getTopProducts(days = 30, limit = 8): Promise<TopProduct[]> {
  const since = new Date(Date.now() - days * 86_400_000);

  const items = await db.orderItem.findMany({
    where: { order: { createdAt: { gte: since }, status: { in: [...EARNING] } } },
    select: { productId: true, name: true, qty: true, price: true, costPrice: true },
  });

  const agg = new Map<string, TopProduct & { costed: boolean }>();
  for (const i of items) {
    const cur = agg.get(i.productId) ?? {
      productId: i.productId, name: i.name, qty: 0, revenue: 0, profit: 0, costed: true,
    };
    cur.qty += i.qty;
    cur.revenue += num(i.price) * i.qty;
    if (i.costPrice == null) cur.costed = false;
    else cur.profit = (cur.profit ?? 0) + (num(i.price) - num(i.costPrice)) * i.qty;
    agg.set(i.productId, cur);
  }

  return [...agg.values()]
    .map(({ costed, ...p }) => ({ ...p, profit: costed ? p.profit : null }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

/** Products needing attention on the shelf. */
export async function getStockAlerts(limit = 10) {
  return db.product.findMany({
    where: { published: true, stock: { lte: 10 } },
    select: { id: true, name: true, stock: true, reorderLevel: true, brand: true },
    orderBy: { stock: 'asc' },
    take: limit,
  });
}

export type ExpiryRow = {
  id: string; name: string; brand: string | null;
  batchNo: string | null; expiryDate: Date; stock: number; daysLeft: number;
};

/**
 * Stock at or near expiry. A pharmacy may not sell expired medicine, so this
 * is a compliance signal, not just housekeeping. Returns three buckets:
 *   expired  — already past date, must be pulled from the shelf now
 *   soon     — within 30 days, sell first or return to the distributor
 *   window   — 31–60 days, plan around it
 * Only published products that actually carry an expiry are considered.
 */
export async function getExpiryAlerts(windowDays = 60) {
  const now = new Date();
  const horizon = new Date(now.getTime() + windowDays * 86_400_000);

  const rows = await db.product.findMany({
    where: { published: true, expiryDate: { not: null, lte: horizon } },
    select: { id: true, name: true, brand: true, batchNo: true, expiryDate: true, stock: true },
    orderBy: { expiryDate: 'asc' },
    take: 100,
  });

  const day = 86_400_000;
  const mapped: ExpiryRow[] = rows.map((r) => ({
    id: r.id, name: r.name, brand: r.brand, batchNo: r.batchNo,
    expiryDate: r.expiryDate!, stock: r.stock,
    daysLeft: Math.floor((r.expiryDate!.getTime() - now.getTime()) / day),
  }));

  return {
    expired: mapped.filter((r) => r.daysLeft < 0),
    soon: mapped.filter((r) => r.daysLeft >= 0 && r.daysLeft <= 30),
    window: mapped.filter((r) => r.daysLeft > 30 && r.daysLeft <= windowDays),
  };
}

/** How many products still have no cost price — drives the dashboard nudge. */
export async function getCostCoverage() {
  const [total, costed] = await Promise.all([
    db.product.count({ where: { published: true } }),
    db.product.count({ where: { published: true, costPrice: { not: null } } }),
  ]);
  return { total, costed, missing: total - costed };
}

export type CustomerRow = {
  id: string; name: string; email: string; phone: string | null;
  orders: number; spent: number; lastOrder: Date | null;
};

export async function getCustomers(limit = 100): Promise<CustomerRow[]> {
  const users = await db.user.findMany({
    where: { role: 'CUSTOMER' },
    select: {
      id: true, name: true, email: true, phone: true, createdAt: true,
      orders: { select: { total: true, status: true, createdAt: true } },
    },
    take: limit,
  });

  return users
    .map((u) => {
      const paid = u.orders.filter((o) => o.status !== 'CANCELLED');
      return {
        id: u.id, name: u.name, email: u.email, phone: u.phone,
        orders: paid.length,
        spent: paid.reduce((s, o) => s + num(o.total), 0),
        lastOrder: paid.length
          ? paid.reduce((a, b) => (a.createdAt > b.createdAt ? a : b)).createdAt
          : null,
      };
    })
    .sort((a, b) => b.spent - a.spent);
}

export type CustomerDetail = {
  id: string; name: string; email: string; phone: string | null;
  address: string | null; joined: Date;
  orders: {
    id: string; orderNo: string; status: string; total: number;
    createdAt: Date; itemCount: number;
    items: { name: string; qty: number; price: number }[];
  }[];
  prescriptions: { id: string; status: string; createdAt: Date; patientName: string | null }[];
  totalSpent: number;
};

/**
 * Everything the pharmacist needs on one customer, in one query:
 * their orders (with lines), their prescriptions, lifetime spend.
 * Returns null if the id isn't a real customer — the page 404s.
 */
export async function getCustomerDetail(id: string): Promise<CustomerDetail | null> {
  const u = await db.user.findFirst({
    where: { id, role: 'CUSTOMER' },
    select: {
      id: true, name: true, email: true, phone: true, address: true, createdAt: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, orderNo: true, status: true, total: true, createdAt: true,
          items: { select: { name: true, qty: true, price: true } },
        },
      },
      prescriptions: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, createdAt: true, patientName: true },
      },
    },
  });
  if (!u) return null;

  const orders = u.orders.map((o) => ({
    id: o.id, orderNo: o.orderNo, status: o.status, total: num(o.total),
    createdAt: o.createdAt, itemCount: o.items.length,
    items: o.items.map((i) => ({ name: i.name, qty: i.qty, price: num(i.price) })),
  }));

  return {
    id: u.id, name: u.name, email: u.email, phone: u.phone,
    address: u.address, joined: u.createdAt,
    orders,
    prescriptions: u.prescriptions,
    totalSpent: orders.filter((o) => o.status !== 'CANCELLED').reduce((s, o) => s + o.total, 0),
  };
}
