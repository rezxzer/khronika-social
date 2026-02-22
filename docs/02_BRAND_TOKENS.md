# Khronika — Brand Tokens (სწრაფი რეფერენსი)

> ეს ფაილი არის სწრაფი lookup table. სრული წესებისთვის → `docs/01_DESIGN_SYSTEM.md`

---

## ფერები

### Base (Paper / Ink)
| Token | Light | Dark |
|---|---|---|
| background | `#FAFAF8` | `#0F0F10` |
| foreground | `#1A1A1A` | `#EAEAEA` |
| card | `#FFFFFF` | `#1A1A1A` |
| muted | `#F0EFED` | `#2A2A2A` |
| muted-fg | `#777777` | `#888888` |
| border | `#E8E7E5` | `#2A2A2A` |
| primary | `#1A1A1A` | `#EAEAEA` |

### Seal (ერთადერთი აქცენტი)
| Token | Light | Dark |
|---|---|---|
| seal | `#C19552` | `#D4A862` |
| seal-fg | `#FAFAF8` | `#0F0F10` |
| seal-muted | `#F5EDE0` | `#2A2518` |

---

## Circle პალიტრა (8 muted ტონი)
| # | სახელი | Hex |
|---|---|---|
| 1 | Dusty Rose | `#C9A6A6` |
| 2 | Seal Amber | `#C19552` |
| 3 | Sage | `#8FA68E` |
| 4 | Deep Teal | `#5A8A8A` |
| 5 | Steel Blue | `#7A9AB0` |
| 6 | Dusty Violet | `#9A8AA6` |
| 7 | Mauve | `#B89AA6` |
| 8 | Terracotta | `#C48A7A` |

გამოყენება: chip `rgba(hex, 0.1)`, strip `rgba(hex, 0.25)`, badge `rgba(hex, 0.08)`

---

## Typography
| ფონტი | Tailwind | გამოყენება |
|---|---|---|
| Inter | `font-sans` | Body, UI, ფორმები, ღილაკები |
| Source Serif 4 | `font-serif` | H1–H3, გვერდების სათაურები |

---

## Badge წესები (Post Types)
| ტიპი | სტილი |
|---|---|
| ამბავი / სწავლება | neutral border + muted text + seal dot |
| მოწვევა | seal border + seal text |

---

## Seal-ის წესები
- ✅ nav pill, selected states, premium indicators, invite badge
- ❌ primary CTA, body text, დიდი ფონები

---

## ფაილები (კოდი)
| რა | სად |
|---|---|
| CSS ტოკენები | `src/app/globals.css` |
| ფონტები | `src/app/layout.tsx` |
| Circle palette | `src/lib/ui/circle-style.ts` |
| Post badge | `src/components/ui/post-type-badge.tsx` |

# End
