import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySignature, fetchLead, normaliseFields, sourceFromPlatform } from '@/lib/meta';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// crypto.timingSafeEqual needs Node, not Edge.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ─────────────────────────────────────────────────────────────
   GET — Meta's one-time subscription handshake.
   When you paste the callback URL into the Meta App dashboard,
   Meta calls this with a challenge. Echo it back verbatim
   (as plain text, NOT JSON) or the subscription won't save.
   ───────────────────────────────────────────────────────────── */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token && token === process.env.META_VERIFY_TOKEN) {
    return new Response(challenge ?? '', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
  return new Response('Forbidden', { status: 403 });
}

/* ─────────────────────────────────────────────────────────────
   POST — a real leadgen event.

   Meta expects a 200 FAST. If we're slow or we 500, Meta retries
   with backoff and eventually disables the subscription. So:
   verify → acknowledge → process. Never make Meta wait on our DB.
   ───────────────────────────────────────────────────────────── */
export async function POST(req: Request) {
  // The signature check below is the real gate. This only stops an attacker
  // burning CPU on HMAC computation by flooding the endpoint. Meta's real
  // traffic is nowhere near this ceiling.
  const rl = rateLimit(`meta:${clientIp(req)}`, 300, 60_000);
  if (!rl.ok) return new Response('Rate limited', { status: 429 });

  // Raw body, untouched — required for the HMAC to match.
  const raw = await req.text();

  if (!verifySignature(raw, req.headers.get('x-hub-signature-256'))) {
    console.warn('[meta-webhook] rejected: bad signature');
    return new Response('Invalid signature', { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  // Fire and forget — Meta gets its 200 immediately.
  processEntries(body).catch((e) => console.error('[meta-webhook] processing error', e));

  return NextResponse.json({ received: true });
}

async function processEntries(body: any) {
  for (const entry of body?.entry ?? []) {
    for (const change of entry?.changes ?? []) {
      if (change.field !== 'leadgen') continue;

      const v = change.value ?? {};
      const leadgenId: string | undefined = v.leadgen_id;
      if (!leadgenId) continue;

      // Meta retries on any hiccup, so the same leadgen_id can arrive
      // several times. externalId is @unique — check before we spend
      // a Graph API call.
      const existing = await db.lead.findUnique({ where: { externalId: leadgenId } });
      if (existing) continue;

      const lead = await fetchLead(leadgenId);
      if (!lead) continue;

      const f = normaliseFields(lead.field_data);

      try {
        await db.lead.create({
          data: {
            externalId: leadgenId,
            source: sourceFromPlatform(lead.platform),
            name: f.name,
            email: f.email,
            phone: f.phone,
            message: f.message,
            raw: f.all,
            formId: lead.form_id ?? v.form_id,
            pageId: v.page_id ? String(v.page_id) : undefined,
            campaignId: lead.campaign_id,
            adId: lead.ad_id ?? v.ad_id,
            createdAt: lead.created_time ? new Date(lead.created_time) : undefined,
          },
        });
        console.log('[meta-webhook] saved lead', leadgenId, lead.platform);
      } catch (e: any) {
        // P2002 = unique violation → a concurrent retry beat us. Harmless.
        if (e?.code !== 'P2002') throw e;
      }
    }
  }
}
