import crypto from 'node:crypto';
import type { LeadSource } from '@prisma/client';

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || 'v21.0'}`;

export const metaConfigured = () =>
  Boolean(process.env.META_APP_SECRET && process.env.META_PAGE_ACCESS_TOKEN);

/**
 * Verify Meta's X-Hub-Signature-256 header.
 *
 * WHY THIS MATTERS: the webhook URL is public. Without this check, anyone
 * who guesses the URL can POST fake leads into the client's dashboard —
 * or worse, spam it. Meta signs every payload with the App Secret; we
 * recompute the HMAC over the RAW body and compare in constant time.
 *
 * The body MUST be the untouched raw string. JSON.parse → re-stringify
 * changes key order/whitespace and the signature will never match.
 */
export function verifySignature(rawBody: string, header: string | null): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !header?.startsWith('sha256=')) return false;

  const expected = crypto.createHmac('sha256', appSecret).update(rawBody, 'utf8').digest();
  let received: Buffer;
  try {
    received = Buffer.from(header.slice(7), 'hex');
  } catch {
    return false;
  }
  // timingSafeEqual throws on length mismatch — guard first.
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(received, expected);
}

export type MetaLead = {
  id: string;
  created_time: string;
  platform?: string;          // "fb" | "ig" — how we know the channel
  form_id?: string;
  campaign_id?: string;
  ad_id?: string;
  is_organic?: boolean;
  field_data?: { name: string; values: string[] }[];
};

/**
 * The webhook only hands us a leadgen_id. The actual answers live behind
 * the Graph API and require the Page token with `leads_retrieval`.
 */
export async function fetchLead(leadgenId: string): Promise<MetaLead | null> {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) return null;

  const fields = 'id,created_time,platform,form_id,campaign_id,ad_id,is_organic,field_data';
  const url = `${GRAPH}/${leadgenId}?fields=${fields}&access_token=${encodeURIComponent(token)}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    console.error('[meta] lead fetch failed', res.status, await res.text().catch(() => ''));
    return null;
  }
  return res.json();
}

/** Lead-ad forms use varying field keys. Normalise the common ones. */
export function normaliseFields(fieldData: MetaLead['field_data'] = []) {
  const map = new Map<string, string>();
  for (const f of fieldData) map.set(f.name.toLowerCase(), f.values?.[0] ?? '');

  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = map.get(k);
      if (v) return v;
    }
    // Fallback: fuzzy match, e.g. a custom field literally named "your_full_name".
    for (const [k, v] of map) if (keys.some((key) => k.includes(key)) && v) return v;
    return undefined;
  };

  return {
    name: pick('full_name', 'name', 'first_name'),
    email: pick('email'),
    phone: pick('phone_number', 'phone', 'mobile'),
    message: pick('message', 'enquiry', 'comments', 'what_do_you_need'),
    all: Object.fromEntries(map),
  };
}

export function sourceFromPlatform(platform?: string): LeadSource {
  if (platform === 'ig' || platform === 'instagram') return 'INSTAGRAM';
  if (platform === 'fb' || platform === 'facebook') return 'FACEBOOK';
  return 'OTHER';
}
