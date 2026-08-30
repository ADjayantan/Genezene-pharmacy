import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { CheckoutForm } from '@/components/CheckoutForm';
import { RuleLabel } from '@/components/ui';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const session = await requireUser('/checkout');

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: { name: true, phone: true, address: true },
  });

  return (
    <div className="container-x py-12 pb-20">
      <RuleLabel>Almost done</RuleLabel>
      <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.4rem)]">Checkout</h1>
      <CheckoutForm
        defaults={{ name: user?.name ?? '', phone: user?.phone ?? '', address: user?.address ?? '' }}
      />
    </div>
  );
}
