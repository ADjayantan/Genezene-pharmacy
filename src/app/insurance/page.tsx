import { permanentRedirect } from 'next/navigation';

/**
 * The standalone insurance guide has been retired.
 *
 * It was written as an SEO play, but the traffic it attracts has no buying
 * intent: someone searching "can I claim medicine bills on insurance" is
 * researching a policy, not looking for a chemist in Ganapathy. It also
 * carried a standing disclaimer burden for a shop that is not an insurance
 * intermediary — a liability with no upside.
 *
 * The one genuinely useful part, that we issue GST invoices for claims, now
 * lives on the contact page where someone who needs it will actually be.
 *
 * Kept as a 301 rather than deleted so any existing link or index entry lands
 * somewhere useful instead of a 404.
 *
 * Safe to delete this folder entirely once you are sure nothing links here.
 */
export default function RetiredInsurancePage(): never {
  permanentRedirect('/contact');
}
