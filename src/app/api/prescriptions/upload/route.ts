import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { ALLOWED, MAX_BYTES, newKey, putFile, sniffMime } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: 'Please sign in to upload a prescription' }, { status: 401 });

  const rl = rateLimit(`rx:${session.sub}`, 10, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ message: 'Too many uploads. Please try again later.' }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ message: 'No file received' }, { status: 400 });

  if (file.size === 0) return NextResponse.json({ message: 'The file is empty' }, { status: 400 });
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ message: `File is too large. Maximum ${MAX_BYTES / 1024 / 1024} MB.` }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // Trust the bytes, not the browser's Content-Type header.
  const mime = sniffMime(buf);
  if (!mime || !ALLOWED.includes(mime)) {
    return NextResponse.json(
      { message: 'Unsupported file. Please upload a JPG, PNG, WEBP, HEIC or PDF.' },
      { status: 400 },
    );
  }

  const key = newKey(mime);
  await putFile(key, buf, mime);

  const rx = await db.prescription.create({
    data: {
      userId: session.sub,
      storageKey: key,
      mimeType: mime,
      sizeBytes: buf.length,
      originalName: typeof file.name === 'string' ? file.name.slice(0, 120) : null,
      patientName: (form?.get('patientName') as string)?.slice(0, 80) || null,
      doctorName: (form?.get('doctorName') as string)?.slice(0, 80) || null,
      notes: (form?.get('notes') as string)?.slice(0, 500) || null,
    },
  });

  return NextResponse.json({ ok: true, id: rx.id });
}
