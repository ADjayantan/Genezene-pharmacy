'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import type { LeadStatus } from '@prisma/client';

const VALID: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];

export async function updateLeadStatus(id: string, status: string) {
  // Server Actions are public HTTP endpoints. Auth must be re-checked here —
  // the fact that the button only renders for admins proves nothing.
  await requireAdmin();

  if (!VALID.includes(status as LeadStatus)) throw new Error('Invalid status');

  await db.lead.update({ where: { id }, data: { status: status as LeadStatus } });
  revalidatePath('/admin/leads');
  revalidatePath('/admin');
}
