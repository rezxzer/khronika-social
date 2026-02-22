# Khronika — Brand Tokens (სწრაფი რეფერენსი)

> ბოლო განახლება: 2026-02-22
> სრული წესებისთვის → `docs/01_DESIGN_SYSTEM.md`
> CSS source of truth → `src/app/globals.css`

---

## პალიტრის კონცეფცია

**ოქროს ფონი + ლურჯი აქცენტი**
- ფონი, card-ები, sidebar, border — ყველაფერი ოქროსფერი
- CTA ღილაკები, active states, progress bar — ლურჯი (seal)
- თეთრი (#FFFFFF) არსად

---

## ოქროს ნეიტრალები (Gold Base)

| Token | Light | Dark |
|---|---|---|
| background | `#F0E2C8` | `#1A1408` |
| foreground | `#1C1108` | `#F0E2C8` |
| card | `#F7EDDA` | `#241C0E` |
| muted | `#E8D5B5` | `#2E2412` |
| muted-fg | `#7A6545` | `#A89070` |
| border | `#D4C4A0` | `#3A2E18` |
| primary | `#2C1A08` | `#F0E2C8` |
| primary-fg | `#F5E6C8` | `#1A1408` |
| secondary | `#EBDBC2` | `#2E2412` |
| sidebar | `#ECD9B8` | `#1A1408` |

---

## Seal — ლურჯი აქცენტი

| Token | Light | Dark |
|---|---|---|
| seal | `#3B82F6` | `#60A5FA` |
| seal-fg | `#FFF8E7` | `#1A1408` |
| seal-muted | `#DBEAFE` | `#1E3A5F` |
| seal-light | `#EFF6FF` | `#152238` |

**Seal = ლურჯი.** გამოიყენება: CTA buttons, nav active, logo bg, progress bar, badges.
**არ გამოიყენება:** ფონის ფერად, body text-ად, borders.

---

## Circle პალიტრა (8 muted ტონი)

| # | სახელი | Hex |
|---|---|---|
| 1 | Dusty Rose | `#C9A6A6` |
| 2 | Dark Gold | `#B8860B` |
| 3 | Sage | `#8FA68E` |
| 4 | Deep Teal | `#5A8A8A` |
| 5 | Steel Blue | `#7A9AB0` |
| 6 | Dusty Violet | `#9A8AA6` |
| 7 | Mauve | `#B89AA6` |
| 8 | Terracotta | `#C48A7A` |

Sidebar-ში: colored dots · Card-ებზე: accent strip + icon chip

---

## Typography

| ფონტი | Tailwind | გამოყენება |
|---|---|---|
| Inter | `font-sans` | Body, UI, ფორმები, ღილაკები |
| Source Serif 4 | `font-serif` | H1–H3, post titles, key headings |

---

## Badge წესები (Post Types)

| ტიპი | სტილი |
|---|---|
| ამბავი / სწავლება | neutral border + muted text |
| მოწვევა | seal border + seal text |

---

## ფაილები (კოდი)

| რა | სად |
|---|---|
| CSS ტოკენები | `src/app/globals.css` |
| ფონტები | `src/app/layout.tsx` |
| Circle palette | `src/lib/ui/circle-style.ts` |
| Post badge | `src/components/ui/post-type-badge.tsx` |

# End
