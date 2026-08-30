# Accessibility notes

Audited by static scan across all pages and components. WCAG 2.1 AA targeted.

## Verified

- **Every `<img>` has `alt`.** Decorative images use `alt=""`; product images
  use the product name.
- **Every icon-only link/button has an `aria-label`** (cart, account, call,
  chat toggle, WhatsApp, remove-image).
- **Every form input is labelled** — via the shared `<Field label>` wrapper, a
  wrapping `<label>`, or an explicit `aria-label` (search, chat, image URL,
  prescription file).
- **Visible focus ring** on every interactive element (`:focus-visible`,
  2px green, 2px offset) — defined once in globals.css.
- **`prefers-reduced-motion`** disables animation and smooth scrolling.
- **One `<h1>` per page**; headings descend in order.
- **Semantic landmarks**: `header`, `nav`, `main`, `footer`, `address`.
- **Errors use `role="alert"`**, not colour alone. Status uses `role="status"`.
- **Live regions**: toasts are `aria-live="polite"`.
- **Skip link** to `#main` is the first focusable element.
- **Wide content scrolls inside its own container**; the page body never scrolls
  sideways (tables, the lead inbox).
- **Tap targets ≥ 44px** on coarse pointers; 17px base text — chosen for an
  older customer base.
- **Theme-aware**: full light and dark palettes; colours are defined as tokens,
  never hardcoded per element.

## Check on the real device before launch

Static analysis cannot prove these — do them on a real phone:

- **Colour contrast** in both light and dark mode with a contrast checker,
  especially `--ink-soft` text on `--paper-deep`, and the amber/low-stock tones.
- **Keyboard-only** pass through search → product → cart → checkout → order.
- **Screen reader** (TalkBack on Android) smoke test on the homepage and
  checkout — confirm the order of announcements makes sense.
- **200% browser zoom** — layout should reflow without horizontal scroll.

## Known acceptable trade-off

- The CSP keeps `'unsafe-inline'` on `script-src` because Next.js needs it for
  hydration. This is a security note, not an accessibility one, and is
  documented in the security audit.
