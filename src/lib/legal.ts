import { site, fullAddress } from '@/lib/config';

/**
 * Legal / policy content.
 *
 * These are solid, India-appropriate DRAFTS — not a substitute for a lawyer.
 * Every page shows a review notice, and placeholders in ⟦double brackets⟧ mark
 * the details the client must fill: GSTIN, drug licence number, the
 * pharmacist-in-charge, and so on. Keeping them all here means the client (or
 * their lawyer) edits plain text in one file, not six React components.
 *
 * `updated` should be bumped whenever a policy changes — several of these
 * legally need a "last updated" date.
 */

export const LEGAL_UPDATED = '2026-08-30';

// Fill these from the client's registration documents before launch.
export const LEGAL_PLACEHOLDERS = {
  gstin: '⟦GSTIN — 15 digits⟧',
  licence: '⟦Drug Licence No. (Form 20 / 21)⟧',
  pharmacist: '⟦Pharmacist-in-charge name⟧',
  pharmacistReg: '⟦Pharmacy Council registration no.⟧',
};

export type LegalDoc = {
  slug: string;
  title: string;
  summary: string;
  body: { h?: string; p: string[] }[];
};

const P = LEGAL_PLACEHOLDERS;

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    summary: 'What we collect, why, and your rights under the DPDP Act 2023.',
    body: [
      { p: [
        `${site.name} ("we", "us") operates ${site.url}. This policy explains what personal data we collect, how we use it, and the rights you have under India's Digital Personal Data Protection Act, 2023.`,
      ]},
      { h: 'What we collect', p: [
        'Contact details you provide: name, phone number, email and delivery address.',
        'Order information: the medicines you buy and your order history.',
        'Prescriptions you upload, including any patient and doctor details on them.',
        'Enquiries you submit through our forms, WhatsApp, or social-media lead ads.',
        'Basic technical data your browser sends (IP address, device and browser type) needed to run and secure the site.',
      ]},
      { h: 'How we use it', p: [
        'To take, verify, prepare and deliver your order.',
        'To have a licensed pharmacist review your prescription before dispensing.',
        'To contact you about your order or enquiry.',
        'To meet our legal and record-keeping obligations as a licensed pharmacy.',
        'We do not sell your personal data, and we do not use it for advertising by third parties.',
      ]},
      { h: 'Prescriptions', p: [
        'Uploaded prescriptions are encrypted before storage and can be opened only by you and our pharmacists. They are retained for the period required by pharmacy regulations and are never published on a public link.',
      ]},
      { h: 'Who we share it with', p: [
        'Delivery partners, limited to what is needed to deliver your order.',
        'Our hosting and payment providers, who process data on our behalf under contract.',
        'Authorities, where the law requires it (for example, a drug inspector or a court order).',
      ]},
      { h: 'Your rights', p: [
        'You may ask us for a copy of your data, to correct it, or to delete it where we are not legally required to keep it.',
        `To exercise any of these, contact us at ${site.email} or ${site.phoneDisplay}.`,
      ]},
      { h: 'Cookies', p: [
        'We use only the cookies needed to run the site (for example, to keep you signed in and to remember your cart). Any analytics or marketing cookies are loaded only if you accept them in the cookie banner. See our Cookie Policy for detail.',
      ]},
      { h: 'Contact', p: [ `${site.name}, ${fullAddress()}. Email ${site.email}, phone ${site.phoneDisplay}.` ]},
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    summary: 'The cookies we use and how to control them.',
    body: [
      { p: [ 'A cookie is a small file a website stores in your browser. We keep our use of them to a minimum.' ]},
      { h: 'Essential cookies (always on)', p: [
        'These are required for the site to work and cannot be switched off: keeping you signed in, remembering the items in your cart, and protecting forms against abuse.',
      ]},
      { h: 'Analytics cookies (only with consent)', p: [
        'If you accept, we use privacy-respecting analytics to understand which pages are useful and to fix problems. These load only after you accept them in the cookie banner, and never before.',
      ]},
      { h: 'Controlling cookies', p: [
        'You can decline non-essential cookies in the banner shown on your first visit, and change your choice any time by clearing this site\'s data in your browser. Declining does not stop you using the shop.',
      ]},
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of Service',
    summary: 'The terms on which we sell to you.',
    body: [
      { p: [ `These terms govern your use of ${site.url} and any order you place with ${site.name}, a pharmacy licensed under ${P.licence}, GSTIN ${P.gstin}.` ]},
      { h: 'Orders', p: [
        'Placing an order is an offer to buy; a contract is formed when we confirm the order. We may decline or cancel an order — for example, if an item is out of stock, if a prescription cannot be verified, or if the order appears fraudulent.',
        'Prescription-only medicines are dispensed solely after a licensed pharmacist has verified a valid prescription.',
      ]},
      { h: 'Pricing', p: [
        'Prices are shown in Indian Rupees and include applicable taxes unless stated otherwise. If a price is listed in error, we will contact you before dispatching and you may cancel.',
      ]},
      { h: 'Medical disclaimer', p: [
        'Information on this site is for reference only and is not a substitute for professional medical advice. Always follow your doctor\'s instructions and read the pack insert. If unsure, speak to our pharmacist.',
      ]},
      { h: 'Limitation', p: [
        'Nothing in these terms limits any liability that cannot be limited by law, including for death or personal injury caused by negligence, or for anything arising from our failure to dispense safely.',
      ]},
      { h: 'Governing law', p: [ 'These terms are governed by the laws of India, and the courts of Coimbatore, Tamil Nadu have jurisdiction.' ]},
    ],
  },
  {
    slug: 'shipping',
    title: 'Shipping & Delivery',
    summary: 'Where we deliver, how long it takes, and what it costs.',
    body: [
      { h: 'Where we deliver', p: [
        `We deliver across Coimbatore, including ${site.serviceAreas.join(', ')} and nearby areas. If you are unsure whether we reach you, call ${site.phoneDisplay}.`,
      ]},
      { h: 'Timing', p: [
        `Orders placed before ${site.offers.dispatchCutoff} are dispatched the same day. Prescription orders are dispatched after a pharmacist has verified the prescription.`,
      ]},
      { h: 'Charges', p: [
        `Delivery is free on orders above ₹${site.offers.freeDeliveryAbove}. Below that, a delivery fee is shown at checkout before you confirm.`,
      ]},
      { h: 'Receiving your order', p: [
        'Please be available on the phone number given, as our delivery agent or pharmacist may call. Cold-chain and fragile items are packed appropriately; check them on delivery.',
      ]},
    ],
  },
  {
    slug: 'returns',
    title: 'Returns & Refunds',
    summary: 'When medicines can be returned, and how refunds work.',
    body: [
      { p: [ 'Medicines are handled under specific rules for safety reasons. Please read this before ordering.' ]},
      { h: 'What can be returned', p: [
        'Unopened, non-temperature-sensitive products in their original packaging may be returned within 7 days.',
        'For anything opened, temperature-sensitive, or damaged, call us on ' + site.phoneDisplay + ' first — we will resolve it case by case.',
      ]},
      { h: 'What cannot be returned', p: [
        'For safety, we generally cannot accept the return of medicines once they have left our control, except where the product is damaged, expired, or incorrect. This protects every customer from tampered stock.',
      ]},
      { h: 'If we sent the wrong or a damaged item', p: [
        'We replace it or refund it in full, including any delivery charge. Tell us within 48 hours of delivery with a photo where possible.',
      ]},
      { h: 'Refund timing', p: [
        'Approved refunds are issued to the original payment method, or as agreed for cash-on-delivery orders, typically within 5–7 working days.',
      ]},
    ],
  },
  {
    slug: 'prescription-policy',
    title: 'Prescription Policy',
    summary: 'How we handle prescription medicines.',
    body: [
      { p: [ 'We are a licensed pharmacy and dispense prescription medicines strictly against a valid prescription reviewed by our pharmacist.' ]},
      { h: 'What needs a prescription', p: [
        'Any medicine classified as prescription-only under the Drugs and Cosmetics Act — including Schedule H and Schedule H1 drugs — is dispensed only against a valid prescription from a registered medical practitioner.',
      ]},
      { h: 'How verification works', p: [
        'Upload a clear photo or PDF of your prescription. Our pharmacist checks that it is valid, current, and appropriate before we prepare the order. We may call you or your doctor if anything needs clarification. We never substitute a medicine without asking you.',
      ]},
      { h: 'Schedule H1 medicines', p: [
        'Certain medicines (Schedule H1) carry additional record-keeping requirements. For these we may ask for the original prescription and record the prescriber\'s details as the law requires.',
      ]},
      { h: 'Retention & privacy', p: [
        'Prescriptions are encrypted at rest, retained for the period required by pharmacy regulations, and accessible only to you and our pharmacists.',
      ]},
      { h: 'Pharmacist', p: [ `Pharmacist-in-charge: ${P.pharmacist} (${P.pharmacistReg}).` ]},
    ],
  },
];

export const legalBySlug = (slug: string) => LEGAL_DOCS.find((d) => d.slug === slug);
