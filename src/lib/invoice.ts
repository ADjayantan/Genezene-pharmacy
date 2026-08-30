/**
 * GST invoice maths.
 *
 * Indian retail prices are GST-INCLUSIVE (the MRP already contains the tax),
 * so the invoice back-computes the tax out of the price rather than adding it
 * on top. Intra-state sale (seller and buyer both in Tamil Nadu) → the tax
 * splits equally into CGST and SGST. If this pharmacy ever ships inter-state,
 * that single line becomes IGST instead — noted where it matters.
 *
 * Default rate is 5% — the GST band most scheduled medicines fall in — used
 * only when a product has no rate recorded.
 */

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const DEFAULT_GST = 5;

export type InvoiceLineIn = {
  name: string;
  qty: number;
  price: number;       // GST-inclusive, per unit
  gstRate: number | null;
};

export type InvoiceLine = {
  name: string;
  qty: number;
  rate: number;        // GST %
  unit: number;        // inclusive unit price
  gross: number;       // inclusive line total (unit × qty)
  taxable: number;     // ex-GST value
  cgst: number;
  sgst: number;
};

export type GstBucket = { rate: number; taxable: number; cgst: number; sgst: number };

export function buildInvoice(itemsIn: InvoiceLineIn[], deliveryInclusive = 0) {
  const lines: InvoiceLine[] = itemsIn.map((i) => {
    const rate = i.gstRate ?? DEFAULT_GST;
    const gross = round2(i.price * i.qty);
    const taxable = round2(gross / (1 + rate / 100));
    const tax = round2(gross - taxable);
    return {
      name: i.name, qty: i.qty, rate, unit: i.price, gross,
      taxable, cgst: round2(tax / 2), sgst: round2(tax / 2),
    };
  });

  // Group by rate for the HSN/tax summary block every GST invoice carries.
  const byRate = new Map<number, GstBucket>();
  for (const l of lines) {
    const b = byRate.get(l.rate) ?? { rate: l.rate, taxable: 0, cgst: 0, sgst: 0 };
    b.taxable = round2(b.taxable + l.taxable);
    b.cgst = round2(b.cgst + l.cgst);
    b.sgst = round2(b.sgst + l.sgst);
    byRate.set(l.rate, b);
  }
  const buckets = [...byRate.values()].sort((a, b) => a.rate - b.rate);

  const productGross = round2(lines.reduce((s, l) => s + l.gross, 0));
  const totalTaxable = round2(lines.reduce((s, l) => s + l.taxable, 0));
  const totalCgst = round2(lines.reduce((s, l) => s + l.cgst, 0));
  const totalSgst = round2(lines.reduce((s, l) => s + l.sgst, 0));
  const grandTotal = round2(productGross + deliveryInclusive);

  return {
    lines, buckets,
    productGross, delivery: round2(deliveryInclusive),
    totalTaxable, totalCgst, totalSgst, totalTax: round2(totalCgst + totalSgst),
    grandTotal,
    amountInWords: rupeesInWords(grandTotal),
  };
}

/** Indian numbering (lakh/crore) → words. "₹1,234.50" → "One Thousand Two
 *  Hundred Thirty Four Rupees and Fifty Paise". Used on the invoice footer. */
export function rupeesInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const two = (n: number): string =>
    n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ' ' + ones[n % 10] : ''}`;
  const three = (n: number): string =>
    n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ' ' + two(n % 100) : ''}` : two(n);

  const words = (n: number): string => {
    if (n === 0) return 'Zero';
    const crore = Math.floor(n / 10000000); n %= 10000000;
    const lakh = Math.floor(n / 100000); n %= 100000;
    const thousand = Math.floor(n / 1000); n %= 1000;
    const rest = n;
    return [
      crore ? `${three(crore)} Crore` : '',
      lakh ? `${three(lakh)} Lakh` : '',
      thousand ? `${three(thousand)} Thousand` : '',
      rest ? three(rest) : '',
    ].filter(Boolean).join(' ');
  };

  let out = `${words(rupees)} Rupee${rupees === 1 ? '' : 's'}`;
  if (paise > 0) out += ` and ${two(paise)} Paise`;
  return out + ' only';
}
