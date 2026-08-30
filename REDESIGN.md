# Redesign — Apothecary Editorial

The whole application, rebuilt on a new visual system. No page was left on the
old teal styling.

## Why it changed

The previous design used teal on white with rounded cards and soft shadows.
That is the same territory Apollo, Netmeds and PharmEasy already occupy, with
budgets this client cannot match. Competing there loses.

Genezenz's real advantage is that it is a counter in Ganapathy with pharmacists
who know their customers. The design now says that: warm paper, deep ink,
editorial serif, print-literate rather than app-literate.

## The system

| | Value |
|---|---|
| Paper | `#FAF7F2` — warm off-white, never `#FFF` |
| Ink | `#1A2E28` — deep green-black, never `#000` |
| Green | `#1F4A3D` — the only action colour |
| Amber | `#C2703D` — the single warm accent |
| Plum | `#7B3F5E` — **prescription status only**, never decorative |
| Display | Fraunces (variable serif) |
| Body | Karla |
| Data | JetBrains Mono, tabular numerals |
| Radius | 3px controls, 4px cards. Pills only for tags |
| Elevation | None. Separation is done with 1px hairlines |

Fonts are self-hosted via `next/font` — no runtime request to Google, no layout
shift, and they keep working if that CDN is blocked.

Tokens live on `:root` and are mapped into Tailwind with `@theme inline`. Without
`inline`, Tailwind bakes the light values into the class output and dark mode
silently does nothing.

## Signature devices

These are what make it distinctive rather than merely tasteful. All five are
defined once in `src/components/ui.tsx`; hand-rolling them per page is how a
design system quietly dies.

1. **Rule-and-label heading** — hairline, small-caps mono label, then the serif
   heading. Reads like an entry in a reference volume. 50 usages.
2. **Label band** — composition, manufacturer and schedule on a tinted band with
   a green left border, all in mono. Reads like a dispensing label. This is the
   most distinctive element on a product page.
3. **Outline numerals** — serif numeral in a 1px circle, never a filled disc.
4. **Index-card products** — square corners, hairline border, 2px top rule.
   Green normally, **plum when prescription-only**, so Rx status registers
   before a single word is read.
5. **Mortar glyph** — the image placeholder is a drawn mortar and pestle, never
   an emoji.

## Rules enforced across all 80 files

Verified by scan, not by assertion:

- No leftover `brand-*`, `slate-*`, `gray-*`, `rounded-lg/xl/2xl` or `shadow-*`
- No emoji in production UI (`✓` as a list bullet is typography, not an icon)
- No hardcoded hex outside `config.ts`, `globals.css`, the logo, the WhatsApp
  brand green, and the channel tints in the lead table. The two in `layout.tsx`
  are `themeColor` values, which cannot reference a CSS variable.
- Every `<img>` has `alt`. Every error uses `role="alert"`. Toasts use
  `aria-live`.
- Focus ring on every interactive element; `prefers-reduced-motion` respected.

## Notable decisions

**The paper backdrop solves a real problem.** 102 of the 124 catalogue images
are broken or hotlinked from competitors. A warm neutral background makes
phone-shot pack photography read as deliberate; the same photo on pure white
looks improvised.

**The admin panel is denser and flatter than the storefront.** Nobody is being
persuaded there — a pharmacist clearing the morning queue wants rows, not
padding.

**Empty states offer a way forward.** An empty product search says the
pharmacist can source most medicines and links to contact. An empty search is a
lead opportunity, not a dead end.

**The 404 page is calm.** No cartoon, no joke. Someone who needs medicine and
hit a dead link should get a route through, including the phone number.

## Verification

```
80 files parsed        — 0 syntax errors
80 files audited       — 0 unresolved imports, 0 client/server boundary violations
npm test               — 35 assertions passing
```

Design tokens, signature-device usage, accessibility attributes and colour
hardcoding were all checked by scanning the source, not by eye.


---

## Later changes

**Admin is invisible to customers.** No link to `/admin` exists on any customer
surface — not the header, footer or account page. Staff bookmark the URL. The
two login doors are genuinely separate: `/api/auth/login` takes a `scope`, so
the customer form cannot mint an admin session, and the admin form rejects a
customer account with the same generic message rather than confirming the
account exists but lacks permission.

**Search shows related products.** `/api/search` returns `{ matches, related }`.
Related is anchored on the best match and driven by the same similarity engine
as the product page. It is rendered under a labelled *Related* heading so a
suggestion is never mistaken for a direct match — on a list of medicines that
distinction matters. A one-result search is no longer a dead end.

**The insurance page was retired.** It attracted search traffic with no buying
intent and carried a standing disclaimer burden for a shop that is not an
insurance intermediary. `/insurance` is now a 301 to `/contact`, where the one
useful part — that we issue GST invoices for claims — now lives. The folder can
be deleted outright once nothing links to it.
