import type { Metadata } from 'next';
import { CartView } from '@/components/CartView';
import { CartSuggestions } from '@/components/CartSuggestions';
import { RuleLabel } from '@/components/ui';

export const metadata: Metadata = { title: 'Your cart', robots: { index: false, follow: false } };

export default function CartPage() {
  return (
    <div className="container-x py-12 pb-20">
      <RuleLabel>Review your order</RuleLabel>
      <h1 className="mt-2 text-[clamp(1.8rem,4vw,2.4rem)]">Your cart</h1>
      <CartView />
      <CartSuggestions />
    </div>
  );
}
