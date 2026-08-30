'use client';

import { useTransition } from 'react';
import { deleteProduct } from '@/app/admin/products/actions';

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => {
        // Be honest in the confirm: products referenced by past orders are
        // unpublished rather than removed, because deleting them would orphan
        // order history.
        if (!confirm(`Delete “${name}”? If it appears in past orders it will be hidden instead of deleted.`)) return;
        start(() => void deleteProduct(id));
      }}
      className="font-semibold text-out hover:underline disabled:opacity-50"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  );
}
