'use client';

import { Button } from '@/components/ui';

/**
 * "Save as PDF" is just the browser's own print dialog → Save as PDF. No PDF
 * library, no server rendering — the print stylesheet on the invoice page does
 * the formatting, and every browser can already produce a real PDF this way.
 */
export function PrintButton() {
  return (
    <Button tone="primary" size="sm" onClick={() => window.print()}>
      Print / Save as PDF
    </Button>
  );
}
