# Why elements sit where they sit

Layout decisions on this site are made against how people actually behave, not
taste. This file records the reasoning so it survives the next redesign — and
so you can answer the client when they ask "why is the search bar so big?"

---

## The one thing that makes a pharmacy different

Standard e-commerce psychology runs on urgency: countdown timers, "8 people are
viewing this", fake low-stock warnings. Those techniques work, which is exactly
why they are everywhere.

**They are wrong here, and this site does not use them.**

Someone buying medicine is frequently anxious, sometimes unwell, often shopping
for a sick parent or child. Manufacturing pressure in that state is
manipulation, and on a CDSCO-licensed pharmacy it is a reputational risk the
client cannot afford. The persuasion that belongs here is the honest kind:
remove friction, reduce anxiety, and tell the truth clearly.

The line we hold:

| Used | Never used |
|---|---|
| Real stock counts — "Only 4 left" is true | Fake scarcity or invented stock pressure |
| Real threshold — free delivery above ₹499 | Countdown timers |
| Real MRP struck through | Inflated "was" prices |
| Actual pharmacist availability | "12 people are viewing this" |
| Genuine reviews, when they exist | Invented ratings and customer counts |

---

## Placement decisions

### Search gets the primary position

**Principle:** F-pattern scanning, plus task-first design.

People do not browse a pharmacy. They arrive with a name in their head — "dolo
650", "amlodipine" — often read off a strip or a prescription. Search is the
task, and it sits first on the opening horizontal scan line, immediately after
the brand anchor.

- **Desktop:** widest element in the header, 30rem.
- **Mobile:** its own full-width row under the logo, rather than being squeezed
  between the wordmark and the icons. The reason most people opened the site
  should not be the smallest thing on the screen.

The dropdown shows direct matches, then a labelled **Related** group, so a
one-result search is never a dead end.

### Navigation order — serial position effect

First and last items in a list are the ones people remember and return to.

`Medicines · Upload Rx · Baby Care · Contact`

*Medicines* first because it is why they came. *Contact* last because it is the
escape hatch people reach for when they are unsure — and being unsure is common
here. Four items, not eight: Hick's law says every additional option slows the
decision for everybody, including the people who wanted the first one.

### Add to cart follows the thumb — Fitts's law

On a phone the inline buy button scrolls out of reach the moment someone starts
reading the composition and the warnings — which is precisely when they are
deciding. A sticky bar pins it to the bottom of the viewport, the easiest place
for a thumb to reach on a large phone.

It appears only after the inline button has scrolled away, so there are never
two identical buttons competing.

### Free delivery shows progress — goal gradient effect

People accelerate toward a goal they can see getting closer. "Add ₹87.00 for
free delivery" states a fact; a bar filling toward the threshold makes the
remaining distance feel small.

Honest, because the threshold and the saving are both real.

### Checkout shows three steps — Zeigarnik effect

An unfinished sequence nags at people, but only when they can see where they
are in it. Three visible steps also answer the question behind most checkout
abandonment: *how much more of this is there?*

The answer is "one screen", and now that is visible before they start.

### Privacy sits above the upload, not beside it

Anxiety about handing over a medical document peaks in the second before you
attach it. The assurance that the file is encrypted and visible only to
pharmacists is placed directly above the drop zone — in a sidebar across the
page, it does not get read at the moment it is needed.

### The phone number appears at every anxiety point

Product page, checkout, error page, 404. A pharmacy's answer to uncertainty is
a person on the phone, not a chat bubble. On mobile there is a call button in
the header itself.

### One accent colour — Von Restorff effect

The isolated element is the remembered one. Amber is the only warm colour on
the site, so it is unambiguous which thing on any screen is the action. Plum
appears only for prescription status and never decoratively, so it carries a
single, learnable meaning.

---

## Designed for an older customer base

A neighbourhood chemist in Ganapathy serves a lot of customers over sixty. This
is the audience most design systems quietly fail.

- **17px base text**, not the usual 16. The single most effective accessibility
  change for this group, and it costs nothing.
- **44px minimum touch targets** on coarse pointers. Below that, mis-taps rise
  sharply, and fastest among exactly these customers.
- **Warm paper rather than pure white.** Less glare, easier for tired eyes.
- **Deep green-black text rather than pure black.** High contrast without the
  harshness of #000 on #FFF.
- **No hover-only affordances.** Everything reachable by tap and by keyboard.

---

## Peak-end rule

People judge an experience by its most intense moment and its ending. For this
site the ending is the order confirmation, so it does real work: what was
ordered, where it is going, that a pharmacist will call to confirm, and by when
it will arrive. Not a bare "thank you".

The same logic makes the 404 and error pages calm and useful rather than clever.
Someone who needs medicine and hit a dead link should always find a way through
— including the phone number.

---

## What to measure

If the client wants proof rather than argument:

1. **Search usage rate** — should be high. If it is not, search is not
   prominent enough.
2. **Mobile add-to-cart rate before vs after the sticky bar.**
3. **Checkout completion** — the step indicator should lift it.
4. **Cart value distribution around ₹499** — a visible cluster just above the
   threshold means the progress bar is working.
5. **Calls received** — this should *not* go to zero. In a pharmacy a phone
   call is a successful outcome, not a failure of the interface.

That last one matters. Do not optimise the phone number away because it
"leaks" conversions out of the funnel. For this business it is the funnel.
