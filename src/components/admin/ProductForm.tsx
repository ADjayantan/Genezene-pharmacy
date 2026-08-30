'use client';

import { useActionState, useState } from 'react';
import { Button, ButtonLink, Field, RuleLabel, inputClass } from '@/components/ui';
import { ImageManager } from './ImageManager';

export type ProductDefaults = {
  name?: string; slug?: string; description?: string; content?: string;
  price?: number; mrp?: number | null; costPrice?: number | null;
  stock?: number; reorderLevel?: number; brand?: string | null;
  saltName?: string | null; imageUrl?: string | null; images?: string[];
  categoryId?: string | null;
  rxRequired?: boolean; published?: boolean;
  metaTitle?: string | null; metaDescription?: string | null;
  batchNo?: string | null; expiryDate?: string | null; gstRate?: number | null;
};

/** Live character counter — the client will actually use the SEO fields,
 *  so the limits need to be visible rather than silently truncated. */
function Counter({ value, max }: { value: string; max: number }) {
  const near = value.length > max * 0.85;
  return (
    <span className={`mono text-[0.66rem] ${value.length > max ? 'text-out' : near ? 'text-low' : 'text-ink-soft'}`}>
      {value.length}/{max}
    </span>
  );
}

export function ProductForm({
  action, defaults = {}, categories, submitLabel,
}: {
  action: (prev: unknown, fd: FormData) => Promise<{ error: string } | void>;
  defaults?: ProductDefaults;
  categories: { id: string; name: string }[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [metaTitle, setMetaTitle] = useState(defaults.metaTitle ?? '');
  const [metaDesc, setMetaDesc] = useState(defaults.metaDescription ?? '');

  const panel = 'rounded-[4px] border border-paper-edge p-6';

  return (
    <form action={formAction} className="max-w-[42rem] space-y-5">
      <section className={panel}>
        <RuleLabel className="border-t-0 pt-0">Product</RuleLabel>
        <div className="mt-5 space-y-4">
          <Field label="Name *"><input name="name" required defaultValue={defaults.name} className={inputClass} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand"><input name="brand" defaultValue={defaults.brand ?? ''} className={inputClass} /></Field>
            <Field label="Composition / salt">
              <input name="saltName" defaultValue={defaults.saltName ?? ''} className={inputClass} placeholder="Paracetamol 650mg" />
            </Field>
          </div>
          <Field
            label="Short description *"
            hint="Shown on the product page and used for the search snippet. Write a real sentence or two — Google ignores one-line pages."
          >
            <textarea name="description" required rows={3} defaultValue={defaults.description} className={inputClass} />
          </Field>
          <Field label="Long description" hint="Separate paragraphs with a blank line.">
            <textarea name="content" rows={5} defaultValue={defaults.content ?? ''} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className={panel}>
        <RuleLabel className="border-t-0 pt-0">Pricing &amp; stock</RuleLabel>
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Selling price (₹) *"><input name="price" type="number" step="0.01" min="0" required defaultValue={defaults.price} className={`${inputClass} mono`} /></Field>
            <Field label="MRP (₹)"><input name="mrp" type="number" step="0.01" min="0" defaultValue={defaults.mrp ?? ''} className={`${inputClass} mono`} /></Field>
            <Field
              label="Cost price (₹)"
              hint="What you paid. Needed for profit — leave blank and this product is excluded from margin rather than estimated."
            >
              <input name="costPrice" type="number" step="0.01" min="0" defaultValue={defaults.costPrice ?? ''} className={`${inputClass} mono`} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Stock *"><input name="stock" type="number" min="0" required defaultValue={defaults.stock ?? 0} className={`${inputClass} mono`} /></Field>
            <Field label="Reorder level" hint="Alerts at or below this">
              <input name="reorderLevel" type="number" min="0" defaultValue={defaults.reorderLevel ?? 10} className={`${inputClass} mono`} />
            </Field>
            <Field label="Category">
              <select name="categoryId" defaultValue={defaults.categoryId ?? ''} className={inputClass}>
                <option value="">— none —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-6 pt-1 text-[0.87rem]">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="rxRequired" defaultChecked={defaults.rxRequired} className="h-4 w-4 accent-[var(--plum)]" />
              Prescription required
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="published" defaultChecked={defaults.published ?? true} className="h-4 w-4 accent-[var(--green)]" />
              Published (visible on the site)
            </label>
          </div>
        </div>
      </section>

      <section className={panel}>
        <RuleLabel className="border-t-0 pt-0">Batch, expiry &amp; tax</RuleLabel>
        <p className="mt-3 text-[0.78rem] text-ink-soft">
          A pharmacy may not sell expired stock. Set the expiry and the dashboard warns you before
          it lapses. GST is used on the printed invoice.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field label="Batch no." hint="From the strip / distributor bill">
            <input name="batchNo" defaultValue={defaults.batchNo ?? ''} className={`${inputClass} mono`} placeholder="e.g. B24J071" />
          </Field>
          <Field label="Expiry date" hint="Warns 60 days ahead">
            <input name="expiryDate" type="date" defaultValue={defaults.expiryDate ?? ''} className={`${inputClass} mono`} />
          </Field>
          <Field label="GST rate (%)" hint="Blank = 5% (most medicines)">
            <input name="gstRate" type="number" step="0.01" min="0" max="28" defaultValue={defaults.gstRate ?? ''} className={`${inputClass} mono`} placeholder="5" />
          </Field>
        </div>
      </section>

      <section className={panel}>
        <RuleLabel className="border-t-0 pt-0">Images</RuleLabel>
        <p className="mt-3 text-[0.78rem] text-ink-soft">
          The first image is the primary one — it appears on product cards, in search results and
          when the page is shared.
        </p>
        <div className="mt-4">
          <ImageManager name="images" initial={defaults.images ?? []} />
        </div>
      </section>

      <section className={panel}>
        <RuleLabel className="border-t-0 pt-0">SEO (optional)</RuleLabel>
        <p className="mt-3 text-[0.78rem] text-ink-soft">
          Leave blank and sensible defaults are generated. Fill these in to tune a page that
          isn&apos;t ranking.
        </p>
        <div className="mt-4 space-y-4">
          <Field label="Meta title" hint={<Counter value={metaTitle} max={70} />}>
            <input name="metaTitle" maxLength={70} value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Meta description" hint={<Counter value={metaDesc} max={170} />}>
            <textarea name="metaDescription" rows={2} maxLength={170} value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} className={inputClass} />
          </Field>
          <Field label="URL slug">
            <input name="slug" defaultValue={defaults.slug ?? ''} className={`${inputClass} mono`} placeholder="auto-generated from the name" />
          </Field>
        </div>
      </section>

      {state?.error && <p role="alert" className="text-[0.87rem] text-out">{state.error}</p>}

      <div className="flex gap-3">
        <Button tone="primary" type="submit" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
        <ButtonLink href="/admin/products" tone="quiet">Cancel</ButtonLink>
      </div>
    </form>
  );
}
