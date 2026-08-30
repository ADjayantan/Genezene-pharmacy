import crypto from 'node:crypto';

// Mirror of src/lib/storage.ts
function encryptionKey(secret, explicit) {
  if (explicit) {
    const buf = Buffer.from(explicit, 'base64');
    if (buf.length !== 32) throw new Error('FILE_ENCRYPTION_KEY must be 32 bytes, base64-encoded');
    return buf;
  }
  if (!secret) throw new Error('Set FILE_ENCRYPTION_KEY or AUTH_SECRET');
  return Buffer.from(crypto.hkdfSync('sha256', secret, 'genezenz-rx-salt', 'prescription-file-v1', 32));
}
function encrypt(plain, k) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', k, iv);
  const body = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]);
}
function decrypt(blob, k) {
  try {
    if (blob.length < 28) return null;
    const d = crypto.createDecipheriv('aes-256-gcm', k, blob.subarray(0,12));
    d.setAuthTag(blob.subarray(12,28));
    return Buffer.concat([d.update(blob.subarray(28)), d.final()]);
  } catch { return null; }
}

let pass=0, fail=0;
const t=(n,c)=>{ try{ if(c()){console.log('  ✓',n);pass++} else {console.log('  ✗',n);fail++} }catch(e){console.log('  ✗',n,'—',e.message);fail++} };

const AUTH='Zx9k2LmQpR7vT4nJ8wY3bH6sF1dG5cA0eU2iO7yP9tK4rN6mX8vB3zQ1wS5jD7fL';
const k = encryptionKey(AUTH);

console.log('Encryption at rest:');
t('key is 32 bytes', () => k.length === 32);
t('key derivation is deterministic', () => encryptionKey(AUTH).equals(k));
t('different AUTH_SECRET → different key', () => !encryptionKey(AUTH+'x').equals(k));

const pdf = Buffer.concat([Buffer.from('%PDF-1.4\n'), crypto.randomBytes(4096)]);
const enc = encrypt(pdf, k);
t('round-trips a 4KB PDF exactly', () => decrypt(enc, k).equals(pdf));
t('ciphertext != plaintext', () => !enc.subarray(28).equals(pdf));
t('no plaintext PDF magic left in ciphertext', () => !enc.includes(Buffer.from('%PDF-')));
t('overhead is exactly 28 bytes', () => enc.length - pdf.length === 28);
t('same input → different ciphertext (random IV)', () => !encrypt(pdf,k).equals(encrypt(pdf,k)));

console.log('\nTamper / wrong-key resistance:');
const bad = Buffer.from(enc); bad[100] ^= 0xff;
t('flipped byte in body is REJECTED (GCM auth)', () => decrypt(bad, k) === null);
const badTag = Buffer.from(enc); badTag[20] ^= 0xff;
t('flipped auth tag is REJECTED', () => decrypt(badTag, k) === null);
const badIv = Buffer.from(enc); badIv[2] ^= 0xff;
t('flipped IV is REJECTED', () => decrypt(badIv, k) === null);
t('wrong key returns null, not garbage', () => decrypt(enc, encryptionKey('totally-different-secret-value-here')) === null);
t('truncated blob returns null', () => decrypt(enc.subarray(0,20), k) === null);
t('empty blob returns null', () => decrypt(Buffer.alloc(0), k) === null);

console.log('\nExplicit key:');
const explicit = crypto.randomBytes(32).toString('base64');
t('accepts a valid 32-byte base64 key', () => encryptionKey(null, explicit).length === 32);
t('rejects a short key', () => { try { encryptionKey(null, Buffer.alloc(16).toString('base64')); return false } catch { return true } });
t('explicit key ignores AUTH_SECRET', () => encryptionKey(AUTH, explicit).equals(Buffer.from(explicit,'base64')));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
