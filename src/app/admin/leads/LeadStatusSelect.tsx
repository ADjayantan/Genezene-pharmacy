'use client';

import { StatusSelect } from '@/components/admin/StatusSelect';
import { updateLeadStatus } from './actions';
import type { LeadStatus } from '@prisma/client';

const STATUSES: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];

export function LeadStatusSelect({ id, status }: { id: string; status: LeadStatus }) {
  return <StatusSelect id={id} status={status} options={STATUSES} action={updateLeadStatus} />;
}
