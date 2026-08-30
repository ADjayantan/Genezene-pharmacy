/**
 * Genezenz Pharmacy — single source of truth for brand + business data.
 * Pulled from the existing production site (genezenz-pharmacy).
 * SEO schema, footer, contact page and the WhatsApp widget all read from here.
 */
export const site = {
  name: 'Genezenz Pharmacy',
  legalName: 'Genezenz Pharmacy',
  tagline: 'Your Trusted Online Pharmacy',
  founded: '2014',
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),

  description:
    'Order genuine medicines, healthcare products, and vitamins online from Genezenz Pharmacy in Ganapathy, Coimbatore. Upload your prescription for fast, CDSCO-licensed, same-day medicine delivery across Coimbatore.',

  keywords: [
    // Primary High-Volume
    'online pharmacy Coimbatore', 'buy medicines online Coimbatore', 'medicine delivery Coimbatore',
    // Local / Hyper-local
    'medical shop Ganapathy', 'pharmacy near me Ganapathy', '24/7 medical shop Coimbatore', 
    'best pharmacy in Coimbatore', 'Genezenz Pharmacy', 'medical store Saravanampatti',
    // Action-oriented
    'prescription upload pharmacy online', 'order prescription drugs online Coimbatore', 
    'same day medicine delivery Coimbatore', 'buy healthcare products online',
    // Niche / Trust signals
    'CDSCO licensed pharmacy', 'genuine medicines online', 'pharmacist verified online store',
    'Ayurvedic medicines Coimbatore', 'baby care products online', 'health supplements Coimbatore'
  ],

  phone: '+918044560873',
  phoneDisplay: '+91 80445 60873',
  email: 'care@genezenz-pharmacy.in',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '918044560873',

  address: {
    street: 'No. 6 & 7, Adhi Vinayagar Complex, Gopalsamy Temple Street',
    locality: 'Ganapathy',
    city: 'Coimbatore',
    region: 'Tamil Nadu',
    postal: '641006',
    country: 'IN',
  },

  geo: {
    // Ganapathy, Coimbatore. TODO(handover): replace with the exact pin from the
    // client's Google Business Profile — local pack ranking is distance-sensitive.
    lat: Number(process.env.NEXT_PUBLIC_BUSINESS_LAT || 11.0405),
    lng: Number(process.env.NEXT_PUBLIC_BUSINESS_LNG || 76.9899),
  },

  hours: [
    {
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      open: '09:00',
      close: '20:00',
    },
  ],

  social: {
    facebook: 'https://www.facebook.com/people/Genezenz-Pharmacy/100076967169526/',
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
  },

  /* Regulatory identity — a licensed pharmacy must display these. Fill from the
     registration documents before launch; until then they read as TODO so it is
     obvious they are unset rather than silently blank. */
  compliance: {
    gstin: process.env.NEXT_PUBLIC_GSTIN || 'GSTIN: to be added',
    drugLicence: process.env.NEXT_PUBLIC_DRUG_LICENCE || 'Drug Licence No.: to be added',
    pharmacist: process.env.NEXT_PUBLIC_PHARMACIST || 'Pharmacist-in-charge: to be added',
    pharmacistReg: process.env.NEXT_PUBLIC_PHARMACIST_REG || '',
  },

  brand: {
    // Apothecary Editorial. The old site's teal read as generic —
    // every national pharmacy uses a variation of it. Deep apothecary
    // green on warm paper is both more distinctive and easier to read.
    primary: '#1F4A3D',   // green
    primaryDark: '#163329',
    paper: '#FAF7F2',
    accent: '#C2703D',    // amber — the single warm signal
    rx: '#7B3F5E',        // plum — prescription status only
  },

  offers: {
    freeDeliveryAbove: 499,
    firstOrderCode: 'GENEZENZ10',
    signupCode: 'FIRST50',
    dispatchCutoff: '2 PM',
  },

  // Areas the pharmacy actually delivers to. Each one becomes a local
  // landing page — this is what wins "medical shop near me" searches.
  serviceAreas: [
    'Ganapathy',
    'Saibaba Colony',
    'RS Puram',
    'Peelamedu',
    'Gandhipuram',
    'Singanallur',
    'Saravanampatti',
    'Thudiyalur',
  ],
} as const;

export const fullAddress = () =>
  `${site.address.street}, ${site.address.locality}, ${site.address.city} – ${site.address.postal}`;

export const whatsappLink = (text?: string) =>
  `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const mapsLink = () =>
  `https://maps.google.com/?q=${encodeURIComponent('Genezenz Pharmacy Ganapathy Coimbatore')}`;
