import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Prescription file storage.
 *
 * Two backends, chosen automatically:
 *  - Vercel Blob when BLOB_READ_WRITE_TOKEN is set (serverless hosts have an
 *    ephemeral filesystem — anything written to disk vanishes on redeploy).
 *  - Local disk otherwise (VPS, Render with a persistent disk, local dev).
 *
 * Files are stored under an unguessable key and are NEVER served statically.
 * The only way to read one is /api/prescriptions/file/[id], which checks that
 * the requester owns the prescription or is an admin. Medical documents must
 * not sit on a public URL.
 */

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'private-uploads');
const useBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

/* ─── Encryption at rest ────────────────────────────────────────────────
   Vercel Blob only offers `access: 'public'`. The key is 24 random bytes so
   the URL is unguessable, but "unguessable" is not access control — anyone
   who obtains the URL (a leaked log line, a proxy, a shared screenshot) could
   read the file, bypassing the ownership check on our serving route entirely.

   These are medical documents, so we encrypt them with AES-256-GCM before
   they leave the process. A leaked blob URL then yields ciphertext.

   The key comes from FILE_ENCRYPTION_KEY, or is derived from AUTH_SECRET via
   HKDF so this works with no extra configuration. Rotating AUTH_SECRET
   therefore makes existing prescriptions unreadable — set an explicit
   FILE_ENCRYPTION_KEY in production to decouple the two.
   ─────────────────────────────────────────────────────────────────────── */
function encryptionKey(): Buffer {
  const explicit = process.env.FILE_ENCRYPTION_KEY;
  if (explicit) {
    const buf = Buffer.from(explicit, 'base64');
    if (buf.length !== 32) throw new Error('FILE_ENCRYPTION_KEY must be 32 bytes, base64-encoded');
    return buf;
  }
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('Set FILE_ENCRYPTION_KEY or AUTH_SECRET to store prescriptions');
  return Buffer.from(crypto.hkdfSync('sha256', secret, 'genezenz-rx-salt', 'prescription-file-v1', 32));
}

// Layout: [12-byte IV][16-byte GCM tag][ciphertext]
function encrypt(plain: Buffer): Buffer {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

function decrypt(blob: Buffer): Buffer | null {
  try {
    if (blob.length < 28) return null;
    const iv = blob.subarray(0, 12);
    const tag = blob.subarray(12, 28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
    decipher.setAuthTag(tag);
    // GCM verifies integrity — a tampered file throws here rather than
    // returning corrupted bytes.
    return Buffer.concat([decipher.update(blob.subarray(28)), decipher.final()]);
  } catch {
    return null;
  }
}

export const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
export const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
  'image/heic': 'heic', 'application/pdf': 'pdf',
};

export function newKey(mime: string) {
  return `rx/${crypto.randomBytes(24).toString('hex')}.${EXT[mime] ?? 'bin'}`;
}

export async function putFile(key: string, data: Buffer, _mime: string): Promise<void> {
  const payload = encrypt(data);

  if (useBlob()) {
    const { put } = await import('@vercel/blob');
    // Stored as an opaque binary blob. Vercel Blob is public-by-URL, so the
    // ciphertext — never the plaintext — is what lives there.
    await put(key, payload, {
      access: 'public',
      contentType: 'application/octet-stream',
      addRandomSuffix: false,
    });
    return;
  }

  const full = path.join(UPLOAD_DIR, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, payload, { mode: 0o600 });
}

export async function getFile(key: string): Promise<Buffer | null> {
  let raw: Buffer | null = null;

  if (useBlob()) {
    const { head } = await import('@vercel/blob');
    const meta = await head(key).catch(() => null);
    if (!meta) return null;
    const res = await fetch(meta.url);
    if (!res.ok) return null;
    raw = Buffer.from(await res.arrayBuffer());
  } else {
    // Defence in depth: keys are generated from crypto.randomBytes and are
    // never user-supplied, but reject anything escaping the upload directory.
    const full = path.join(UPLOAD_DIR, key);
    if (!path.resolve(full).startsWith(path.resolve(UPLOAD_DIR))) return null;
    raw = await fs.readFile(full).catch(() => null);
  }

  return raw ? decrypt(raw) : null;
}

/**
 * Verify the file really is what its Content-Type claims, by checking magic
 * bytes. A browser-supplied MIME type is trivially forged — without this,
 * someone could upload an HTML or SVG file that runs script when opened.
 */
export function sniffMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buf.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (buf.subarray(4, 8).toString('ascii') === 'ftyp' && buf.subarray(8, 12).toString('ascii').startsWith('hei')) return 'image/heic';
  return null;
}
