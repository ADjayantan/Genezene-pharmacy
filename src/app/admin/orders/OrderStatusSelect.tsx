'use client';

import { StatusSelect } from '@/components/admin/StatusSelect';
import { updateOrderStatus } from './actions';
import type { OrderStatus } from '@prisma/client';

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function OrderStatusSelect({ id, status }: { id: string; status: OrderStatus }) {
  return (
    <StatusSelect
      id={id}
      status={status}
      options={STATUSES}
      action={updateOrderStatus}
      // Say what cancelling actually does — the stock return is easy to
      // miss otherwise, and it matters to whoever counts inventory.
      confirm={(next) =>
        next === 'CANCELLED' ? 'Cancel this order? The stock will be returned to inventory.' : null
      }
    />
  );
}
