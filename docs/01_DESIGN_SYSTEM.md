# Khronika — Design System (v4)

> ბოლო განახლება: 2026-02-22
> CSS source of truth: `src/app/globals.css`

## 1) ბრენდის კონცეფცია

**Khronika = „ოქროს ქაღალდი"** — მბრწყინავი, თბილი, პრემიუმ ესთეტიკა.
- ოქროსფერი ფონი ყველგან (არა თეთრი, არა ნაცრისფერი)
- ლურჯი აქცენტი CTA ღილაკებზე, active states, progress bar
- Serif ჰედლაინები, ბევრი whitespace
- UI-ს ხასიათი: თბილი, მდიდარი, ქართული

---

## 2) ფერების სისტემა

### ოქროს ნეიტრალები (Gold Base)
| Token | Light | Dark |
|---|---|---|
| background | `#F0E2C8` | `#1A1408` |
| foreground | `#1C1108` | `#F0E2C8` |
| card | `#F7EDDA` | `#241C0E` |
| card-foreground | `#1C1108` | `#F0E2C8` |
| popover | `#F7EDDA` | `#241C0E` |
| muted | `#E8D5B5` | `#2E2412` |
| muted-foreground | `#7A6545` | `#A89070` |
| border | `#D4C4A0` | `#3A2E18` |
| input | `#D4C4A0` | `#3A2E18` |
| primary | `#2C1A08` | `#F0E2C8` |
| primary-foreground | `#F5E6C8` | `#1A1408` |
| secondary | `#EBDBC2` | `#2E2412` |
| accent | `#EBDBC2` | `#2E2412` |
| sidebar | `#ECD9B8` | `#1A1408` |

> **მნიშვნელოვანი:** თეთრი (#FFFFFF) არსად გამოიყენება. ყველა ფონი ოქროს ტონისაა.

### Seal (ლურჯი აქცენტი — CTA ღილაკები)
| Token | Light | Dark |
|---|---|---|
| seal | `#3B82F6` | `#60A5FA` |
| seal-foreground | `#FFF8E7` | `#1A1408` |
| seal-muted | `#DBEAFE` | `#1E3A5F` |
| seal-light | `#EFF6FF` | `#152238` |

#### სად გამოიყენება seal (ლურჯი):
- ✅ მთავარი CTA ღილაკები (შექმნა, გამოქვეყნება, რეგისტრაცია, Post)
- ✅ Active nav pill / underline
- ✅ ლოგოს background
- ✅ Progress bar
- ✅ Notification badge
- ✅ Avatar ring accents
- ✅ Type selector pills (selected state)
- ✅ Quick action accent links
- ✅ Trending dots

#### სად **არ** გამოიყენება seal:
- ❌ Body text (ტექსტი ყავისფერი/მუქია)
- ❌ ფონის ფერი (ფონი ოქროა, არა ლურჯი)
- ❌ Card backgrounds
- ❌ Borders (ბორდერი ოქროსფერი)

---

## 3) Circle Identity (8 მუტირებული ტონი)

ყოველ წრეს slug-იდან დეტერმინისტულად ენიჭება ფერი.

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

Sidebar-ში: ფერადი dots (2.5x2.5 rounded-full)

---

## 4) Typography

| ფონტი | CSS Variable | Tailwind | გამოყენება |
|---|---|---|---|
| **Inter** | `--font-inter` | `font-sans` | Body, UI, ფორმები, ღილაკები |
| **Source Serif 4** | `--font-source-serif` | `font-serif` | H1–H3, გვერდების სათაურები, post titles |

---

## 5) Layout

### Navbar (h-14)
- ლოგო (ლურჯი bg) + "Khronika" | Nav links (underline სტილი) | Search bar (center) | Bell + Messages + ლურჯი "შექმნა" btn + Avatar + username

### AppShell (3 სვეტი desktop)
- Left (180px): Home, Feed, Circles, Notifications (badge), Messages + MY CIRCLES (colored dots)
- Center: main content
- Right (240px): Welcome/onboarding widget + Quick Actions + Trending

---

## 6) კომპონენტები

### Buttons
- **Seal (primary CTA)**: `bg-seal text-seal-foreground` — ლურჯი, rounded-full hero-ზე
- **Default (secondary)**: მუქი ყავისფერი (`bg-primary`)
- **Outline**: ოქროს border + hover
- **Ghost**: nav actions

### Post Card
- Avatar (10x10, seal ring) + "Author **in CircleName**" + time + ... menu
- PostTypeBadge (ქვემოთ, time-ის გვერდით)
- Content: serif title (bold) + body preview
- Media: 3 images row
- Action bar (border-t): ❤ წითელი heart, 💬 comment, Share, More

### Post Composer / Feed Composer
- Avatar + "What's on your mind?" expandable
- Type pills: 📖 Story, 🎓 Lesson, 📨 Invite (ლურჯი selected)
- Circle selector dropdown (Feed Composer-ში)
- ლურჯი "Post" button

### Empty States
- ოქროს ფონი + ლურჯი icon + ლურჯი CTA

### Right Sidebar Widgets
- **Welcome**: Avatar + progress bar (ლურჯი) + task checklist
- **Quick Actions**: Create Post, Join Circle, Invite Friends
- **Trending**: seal dots + #tags + counts

---

## 7) Hero / Landing

- ოქროს gradient background (oklch radial gradients)
- Serif H1: "Your **Stories**, Your **Circles**" — ოქროს gradient text
- ლურჯი "+ Create Circle" CTA + მუქი "⊕ Explore Circles"
- Stats row: Circles · Stories · Georgia · Worldwide
- Bottom CTA section: ლურჯი "უფასოდ დაიწყე"

---

## 8) Background ეფექტი

Body-ზე ფიქსირებული gradient:
- 3 radial gradient (oklch ოქროს ტონები)
- linear gradient seal-light → background
- SVG grain texture (opacity 0.015)

---

## 9) QA Checklist

- [ ] ოქროს background ყველა გვერდზე (არა თეთრი!)
- [ ] ოქროს card-ები (არა თეთრი!)
- [ ] ლურჯი CTA ღილაკები
- [ ] ლურჯი ლოგო navbar-ში
- [ ] ლურჯი progress bar
- [ ] ოქროს gradient landing hero
- [ ] Colored circle dots sidebar-ში
- [ ] წითელი heart post action bar-ში
- [ ] "in CircleName" post header-ში
- [ ] Serif title post card-ში
- [ ] Footer: social icons + "Made with ❤ in Georgia"

# End
