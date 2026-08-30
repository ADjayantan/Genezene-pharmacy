'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import type { RxStatus } from '@prisma/client';

const VALID: RxStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

export async function reviewPrescription(id: string, status: string, note?: string) {
  const admin = await requireAdmin();
  if (!VALID.includes(status as RxStatus)) throw new Error('Invalid status');
  const next = status as RxStatus;

  await db.$transaction(async (tx) => {
    await tx.prescription.update({
      where: { id },
      data: {
        status: next,
        reviewNote: note?.slice(0, 500) || undefined,
        reviewedAt: new Date(),
        // Who signed this off. For a licensed pharmacy this is exactly what a
        // drug inspector asks for, and it is not reconstructable after the fact.
        reviewedBy: admin.email,
      },
    });

    await tx.rxEvent.create({
      data: { prescriptionId: id, status: next, note: note?.slice(0, 500) || null, actor: admin.email },
    });
  });

  revalidatePath('/admin/prescriptions');
  revalidatePath('/admin');
  revalidatePath('/profile');
}

export async function setRxStatus(id: string, status: string) {
  return reviewPrescription(id, status);
}
