'use client';

import { useState, useTransition } from 'react';
import { reviewPrescription } from '@/app/admin/prescriptions/actions';
import { Button, Field, inputClass, Spinner } from '@/components/ui';
import type { RxStatus } from '@prisma/client';

export function RxReview({
  id, status, note,
}: { id: string; status: RxStatus; note: string | null }) {
  const [text, setText] = useState(note ?? '');
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [actionType, setActionType] = useState<RxStatus | null>(null);

  function act(next: RxStatus) {
    if (next === 'REJECTED' && !text.trim()) {
      setMsg('Please add a note explaining why, so the customer knows what to fix.');
      return;
    }
    setMsg(null);
    setActionType(next);
    start(async () => {
      await reviewPrescription(id, next, text.trim() || undefined);
      setMsg(next === 'APPROVED' ? 'Approved' : 'Rejected');
      setActionType(null);
    });
  }

  return (
    <div className="mt-5 border-t border-paper-edge pt-5">
      <Field label="Pharmacist note" hint="The customer sees this.">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={500}
          className={inputClass}
          placeholder="e.g. Verified — all three medicines in stock. Or: the prescription is not dated, please re-upload."
        />
      </Field>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Button
          size="sm"
          onClick={() => act('APPROVED')}
          disabled={pending || status === 'APPROVED'}
          className="border-transparent bg-in text-green-on hover:opacity-90 disabled:opacity-80 disabled:bg-in/80"
        >
          {pending && actionType === 'APPROVED' ? <Spinner className="h-4 w-4" /> : null}
          Approve
        </Button>
        <Button 
          size="sm" 
          tone="danger" 
          onClick={() => act('REJECTED')} 
          disabled={pending || status === 'REJECTED'}
        >
          {pending && actionType === 'REJECTED' ? <Spinner className="h-4 w-4" /> : null}
          Reject
        </Button>
        {msg && <span role="status" className="text-[0.85rem] text-ink-soft">{msg}</span>}
      </div>
    </div>
  );
}
