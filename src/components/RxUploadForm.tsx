'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from './Toast';
import { Button, Field, RuleLabel, inputClass } from './ui';

const MAX_MB = 8;

export function RxUploadForm() {
  const router = useRouter();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function pick(f: File | null) {
    setErr('');
    if (preview) URL.revokeObjectURL(preview); // don't leak object URLs
    if (!f) { setFile(null); setPreview(null); return; }
    if (f.size > MAX_MB * 1024 * 1024) {
      setErr(`That file is ${(f.size / 1024 / 1024).toFixed(1)} MB. The maximum is ${MAX_MB} MB.`);
      return;
    }
    setFile(f);
    setPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) return setErr('Please choose a file first.');
    setBusy(true);
    setErr('');

    const fd = new FormData(e.currentTarget);
    fd.set('file', file);

    const res = await fetch('/api/prescriptions/upload', { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      toast('Prescription uploaded — our pharmacist will review it');
      router.push('/profile');
      router.refresh();
    } else {
      setErr(data.message ?? 'Upload failed. Please try again.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <RuleLabel className="border-t-0 pt-0">Your prescription</RuleLabel>

      <label
        className="flex cursor-pointer flex-col items-center justify-center rounded-[4px] border-2 border-dashed border-paper-edge px-6 py-12 text-center transition-colors hover:border-green hover:bg-green-wash"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0] ?? null); }}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          className="sr-only"
          aria-label="Upload your prescription file"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Prescription preview" className="max-h-48 rounded-[3px] object-contain" />
        ) : (
          <>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="square" className="text-paper-edge" aria-hidden="true">
              <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
              <path d="M14 3v4h4M9 12h6M9 16h4" />
            </svg>
            <span className="mt-3 text-[0.9rem] font-medium">
              {file ? file.name : 'Tap to choose, or drag a file here'}
            </span>
            <span className="mono mt-1.5 text-[0.66rem] uppercase tracking-[0.06em] text-ink-soft">
              JPG · PNG · WEBP · HEIC · PDF — max {MAX_MB} MB
            </span>
          </>
        )}
      </label>

      {file && (
        <p className="mono text-[0.72rem] text-ink-soft">
          {file.name} · {(file.size / 1024).toFixed(0)} KB
          <button type="button" onClick={() => pick(null)} className="ml-3 text-out underline">remove</button>
        </p>
      )}

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Field label="Patient name"><input name="patientName" maxLength={80} className={inputClass} /></Field>
        <Field label="Doctor name"><input name="doctorName" maxLength={80} className={inputClass} /></Field>
      </div>

      <Field label="Notes" hint="Optional">
        <textarea name="notes" rows={2} maxLength={500} className={inputClass} placeholder="Anything the pharmacist should know" />
      </Field>

      {err && <p role="alert" className="text-[0.85rem] text-out">{err}</p>}

      <Button tone="primary" full type="submit" disabled={busy || !file}>
        {busy ? 'Uploading…' : 'Upload prescription'}
      </Button>
    </form>
  );
}
