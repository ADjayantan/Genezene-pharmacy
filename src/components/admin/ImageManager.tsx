'use client';

import { useState } from 'react';
import { MortarGlyph } from '@/components/ui';

/**
 * Image gallery editor.
 *
 * The first image is the primary one — it is what appears on cards, in search
 * and in the OpenGraph tag. "Make primary" reorders rather than adding a
 * separate flag, so there is exactly one source of truth for the order.
 *
 * The values are submitted as a single hidden input (newline separated) so the
 * whole form still works as a plain server action with no client-side
 * submission handler.
 */
export function ImageManager({ name, initial = [] }: { name: string; initial?: string[] }) {
  const [images, setImages] = useState<string[]>(initial);
  const [draft, setDraft] = useState('');
  const [err, setErr] = useState('');

  function add() {
    const url = draft.trim();
    if (!url) return;
    // Restrict to http(s). This value ends up in an <img src>, and z.url()
    // alone would happily accept javascript: or data:.
    try {
      if (!['http:', 'https:'].includes(new URL(url).protocol)) throw new Error();
    } catch {
      setErr('Enter a full image URL starting with https://');
      return;
    }
    if (images.includes(url)) { setErr('That image is already in the gallery.'); return; }
    setErr('');
    setImages([...images, url]);
    setDraft('');
  }

  const makePrimary = (i: number) =>
    setImages([images[i], ...images.filter((_, x) => x !== i)]);
  const remove = (i: number) => setImages(images.filter((_, x) => x !== i));

  return (
    <div>
      {/* One hidden field carries the whole gallery to the server action. */}
      <input type="hidden" name={name} value={images.join('\n')} />

      {images.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[3px] border border-dashed border-paper-edge px-4 py-5">
          <MortarGlyph size={32} className="text-paper-edge" />
          <p className="text-[0.82rem] text-ink-soft">
            No images yet. The product will show a placeholder — fine, but it converts worse than
            a real photograph of the pack.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(120px,1fr))]">
          {images.map((url, i) => (
            <li
              key={url}
              className={`rounded-[3px] border p-2 ${i === 0 ? 'border-green' : 'border-paper-edge'}`}
            >
              <div className="grid h-20 place-items-center bg-paper-deep">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-contain" />
              </div>

              <p className="mono mt-1.5 truncate text-[0.6rem] text-ink-soft" title={url}>
                {url.split('/').pop()}
              </p>

              <div className="mt-1.5 flex items-center justify-between gap-2">
                {i === 0 ? (
                  <span className="mono text-[0.58rem] uppercase tracking-[0.08em] text-green">Primary</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makePrimary(i)}
                    className="mono text-[0.58rem] uppercase tracking-[0.08em] text-ink-soft hover:text-green"
                  >
                    Make primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove image ${i + 1}`}
                  className="mono text-[0.58rem] uppercase tracking-[0.08em] text-out hover:underline"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setErr(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="https://res.cloudinary.com/…"
          aria-label="Image URL"
          className="mono flex-1 rounded-[3px] border border-paper-edge bg-paper px-3 py-2 text-[0.8rem] outline-none focus:border-green"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-[3px] border border-green px-4 text-[0.8rem] font-semibold text-green hover:bg-green-wash"
        >
          Add
        </button>
      </div>

      {err && <p role="alert" className="mt-2 text-[0.8rem] text-out">{err}</p>}

      <p className="mt-2 text-[0.72rem] text-ink-soft">
        Upload the photo to the shop&apos;s Cloudinary account and paste the URL here. Do not link
        images from 1mg, PharmEasy or Netmeds — that is their copyright, and they can change or
        block the file at any time, which would silently break the page.
      </p>
    </div>
  );
}
