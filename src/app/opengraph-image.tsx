import { ImageResponse } from 'next/og';
import { site } from '@/lib/config';

/**
 * The card that shows when the homepage is shared on WhatsApp, Facebook or
 * Twitter. Without this, shared links render a blank or a screenshot — a real
 * loss for a business whose leads come through exactly those channels.
 *
 * Generated at the edge from the brand colours. No external assets, so it can
 * never break a share preview.
 */
export const runtime = 'edge';
export const alt = 'Genezenz Pharmacy — Online Pharmacy in Coimbatore';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', background: '#FAF7F2', padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 56, height: 56, borderRadius: 12, background: '#1F4A3D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 30, height: 30 }}>
              <div style={{ position: 'absolute', left: 12, top: 3, width: 6, height: 24, borderRadius: 3, background: '#FAF7F2' }} />
              <div style={{ position: 'absolute', left: 3, top: 12, width: 24, height: 6, borderRadius: 3, background: '#FAF7F2' }} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: '#1A2E28', letterSpacing: -0.5 }}>
            Genezenz <span style={{ color: '#5C6B65', fontWeight: 400 }}>Pharmacy</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ fontSize: 24, color: '#C2703D', letterSpacing: 4, fontWeight: 600 }}>
            CDSCO LICENSED · SINCE {site.founded}
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, color: '#1A2E28', lineHeight: 1.05, letterSpacing: -2, maxWidth: 900 }}>
            Online Pharmacy in Coimbatore
          </div>
          <div style={{ fontSize: 30, color: '#5C6B65', maxWidth: 820 }}>
            Genuine medicines, pharmacist-verified, delivered same-day from our counter in Ganapathy.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 40, fontSize: 24, color: '#1F4A3D', fontWeight: 600 }}>
          <span>Free delivery above ₹{site.offers.freeDeliveryAbove}</span>
          <span>·</span>
          <span>{site.phoneDisplay}</span>
        </div>
      </div>
    ),
    size,
  );
}
