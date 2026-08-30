'use client';

import { useState, useTransition } from 'react';

/**
 * Optimistic status dropdown, shared by leads, orders and prescriptions.
 * The server action is passed in so the component stays generic.
 */
export function StatusSelect<T extends string>({
  id, status, options, action, confirm,
}: {
  id: string;
  status: T;
  options: readonly T[];
  action: (id: string, status: string) => Promise<void>;
  confirm?: (next: T) => string | null;
}) {
  const [value, setValue] = useState<T>(status);
  const [pending, start] = useTransition();

  return (
    <select
      value={value}
      disabled={pending}
      aria-label="Change status"
      onChange={(e) => {
        const next = e.target.value as T;
        const msg = confirm?.(next);
        if (msg && !window.confirm(msg)) { e.target.value = value; return; }

        setValue(next); // optimistic — the UI responds instantly
        start(async () => {
          try { await action(id, next); }
          catch { setValue(status); } // roll back if the server rejects it
        });
      }}
      className="mono rounded-[3px] border border-paper-edge bg-paper px-2.5 py-1.5 text-[0.72rem] capitalize text-ink outline-none focus:border-green disabled:opacity-50"
    >
      {options.map((o) => <option key={o} value={o}>{o.toLowerCase()}</option>)}
    </select>
  );
}
