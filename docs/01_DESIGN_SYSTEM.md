# Khronika — Design System (v2)

## 1) ბრენდის იდეა (ვიზუალური ხასიათი)
Khronika = **„მელანი ქაღალდზე"** — ტრადიციული სითბო + თანამედროვე სისუფთავე.
- სუფთა, თბილი ფონი (paper), მუქი ტექსტი (ink)
- ერთადერთი თბილი აქცენტი: **seal** (#C19552) — ბეჭდის ტონი
- მკაფიო ჰედლაინები serif ფონტით, ბევრი whitespace
- UI არ „ყვირის"; მთავარი ყურადღება — კონტენტზე

---

## 2) ფერების სისტემა

### Base ნეიტრალები (Paper / Ink)
| Token | Light | Dark |
|---|---|---|
| background (paper) | `#FAFAF8` | `#0F0F10` |
| foreground (ink) | `#1A1A1A` | `#EAEAEA` |
| card | `#FFFFFF` | `#1A1A1A` |
| muted | `#F0EFED` | `#2A2A2A` |
| muted-foreground | `#777777` | `#888888` |
| border | `#E8E7E5` | `#2A2A2A` |
| primary (CTA) | `#1A1A1A` | `#EAEAEA` |
| primary-foreground | `#FAFAF8` | `#0F0F10` |

### Seal Accent (ერთადერთი აქცენტი)
| Token | Light | Dark |
|---|---|---|
| seal | `#C19552` | `#D4A862` |
| seal-foreground | `#FAFAF8` | `#0F0F10` |
| seal-muted | `#F5EDE0` | `#2A2518` |

#### სად გამოიყენება seal:
- ✅ Active nav pill background (`bg-seal-muted`)
- ✅ Premium/selected states (მაგ: owner badge accent)
- ✅ Invite badge — seal outline + seal text
- ✅ Story/Lesson badge-ების seal dot
- ✅ Subtle highlights, focus ring accents

#### სად **არ** გამოიყენება:
- ❌ Primary CTA ღილაკები (ისინი ink-black უნდა დარჩეს)
- ❌ ტექსტის ფერი ზოგადად (მხოლოდ badge/accent კონტექსტში)
- ❌ ფონის ფერი დიდ ფართობზე

### Dark Mode
ტოკენები განსაზღვრულია CSS-ში (`.dark` class). Dark mode toggle — **შემდეგ ეტაპზე**.
ტოკენები უკვე მზადაა:
- Background: `#0F0F10`, Surface: `#1A1A1A`, Border: `#2A2A2A`
- Text: `#EAEAEA`, Text-muted: `#888888`
- Seal: `#D4A862` (ოდნავ ღია dark-ზე visibility-სთვის)

---

## 3) Circle Identity (მუტირებული პალიტრა)

ყოველ წრეს slug-იდან დეტერმინისტულად ენიჭება ფერი 8 მუტირებული ტონიდან.
ესთეტიკა: **„ფერადი მელანი ძველ ქაღალდზე"** — არა ნეონი, არა gradient.

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

### გამოყენება:
- **Icon chip**: `rgba(color, 0.1)` ფონი + hex ტექსტი
- **Card strip**: `rgba(color, 0.25)` solid ზოლი (h-1 list-ში, h-2 detail-ზე)
- **Badge**: `rgba(color, 0.08)` ფონი + hex ტექსტი + `rgba(color, 0.25)` border

იმპლემენტაცია: `src/lib/ui/circle-style.ts` → `getCircleAccent(slug)`

---

## 4) Typography

### ფონტები
| ფონტი | CSS Variable | Tailwind | გამოყენება |
|---|---|---|---|
| **Inter** | `--font-inter` | `font-sans` | Body, UI, ფორმები, ღილაკები |
| **Source Serif 4** | `--font-source-serif` | `font-serif` | H1–H3, გვერდების სათაურები |

### იერარქია (Tailwind)
- **H1**: `font-serif text-4xl md:text-5xl font-bold tracking-tight`
- **H2**: `font-serif text-2xl md:text-3xl font-bold tracking-tight`
- **H3**: `text-xl font-semibold` (sans — card სათაურებზე)
- **Body**: `text-base leading-7`
- **Small/Meta**: `text-sm text-muted-foreground`

### სად გამოიყენება serif:
- Landing hero H1 + section H2
- Circles page H1 ("წრეები")
- Circle detail H1 (circle.name)
- Profile display_name
- **არ** გამოიყენება: ფორმების labels, ღილაკები, navbar, badges

---

## 5) Layout სტანდარტი

### Container
- max-width: **1100px**
- გვერდის padding: **px-4 (mobile), px-6 (desktop)**

### App Shell — შემდეგ ეტაპზე
Desktop-ზე 3 სვეტი:
- Left sidebar: navigation + circles shortcuts
- Center: main content (feed / circle / post)
- Right sidebar: notifications / suggestions

Mobile-ზე:
- ყველაფერი ერთ სვეტად (center-only)
- sidebar ელემენტები გადადის Drawer/Dropdown-ში

---

## 6) Spacing / Grid წესები
- Section spacing: **py-14 md:py-20**
- Card padding: **p-4 md:p-6**
- Form field gap: **space-y-3**
- Page header gap: **mb-6 md:mb-8**

---

## 7) Shapes / Radius / Shadows
- Cards: `rounded-xl`
- Buttons/Inputs: `rounded-lg`
- Pills/Badges: `rounded-full`
- Hover: `shadow-sm → shadow-md` (სუბტილურად)
- Border: ყოველთვის თხელი, არა მძიმე

---

## 8) Components (shadcn/ui) სტანდარტები

### Buttons
- **Primary**: ink-black (`#1A1A1A`). 1 გვერდზე მაქსიმუმ 1 ძლიერი CTA.
- **Secondary/Outline**: მეორეხარისხოვანი მოქმედებები
- **Ghost**: Navbar, secondary actions
- Hover: shadow-md + 1px lift; Press: scale(0.98)

### Cards
- Header (title + meta) → Body (content) → Footer (actions)
- Hover: `-translate-y-0.5 + shadow-md` (200ms, ease-out)
- Circle cards: accent strip ზემოთ + icon chip მარცხნივ

### Forms
- Input height: ~36–44px
- Labels ზემოთ
- Error/Success ყოველთვის Alert კომპონენტით
- Focus: smooth border-color + ring transition (150ms)

### Badges (Post Types)
პილის სტილი — outlined, არა filled.

| ტიპი | სტილი |
|---|---|
| **ამბავი (story)** | neutral border + muted text + პატარა seal dot |
| **სწავლება (lesson)** | neutral border + muted text + პატარა seal dot |
| **მოწვევა (invite)** | seal border + seal text (უმაღლესი პრიორიტეტი) |

იმპლემენტაცია: `src/components/ui/post-type-badge.tsx`

### Avatars
- Navbar: 32–36px
- Profile header: 72–96px
- Placeholder: initials

### Empty states
- Icon + სათაური + 1 წინადადება + ერთი ღილაკი

### Loading states
- Skeleton grid (Cards), ფორმებზე spinner მხოლოდ submit-ზე

---

## 9) გვერდების დიზაინის პატერნები

### Landing (/)
- Hero: serif H1 + მოკლე ტექსტი + 2 CTA (ink-black primary + outline secondary)
- Feature cards (3): icon chip + sans title + description
- Background: paper gradient + grain texture

### Auth (/login, /register)
- Centered card: max-w-[400px]
- Logo ზემოთ, clear heading + helper text
- Errors: Alert (AlertCircle icon)

### Feed (/feed)
- Page header: „ფიდი" + create post (შემდეგ ეტაპზე)
- Post cards: avatar + name + time + content + PostTypeBadge + actions

### Circles (/circles)
- Serif H1 + search + create button
- Card grid: accent strip + icon chip + name + privacy badge + member count

### Circle detail (/c/[slug])
- Accent cover strip (h-2) + icon chip + serif H1 + badges
- Join/Leave buttons + toast feedback
- Posts section placeholder

### Profile (/u/[username])
- Avatar (80px) + serif display_name + @username + bio
- Posts placeholder

### Settings (/settings/profile)
- Form card + avatar uploader
- Save: full-width mobile, right-aligned desktop

---

## 10) UI ტექსტების წესები (ქართული)
- მოკლე, პირდაპირი
- 1 მოქმედება = 1 ღილაკი
- შეცდომა: რა მოხდა + რა ქნა იუზერმა

მაგ:
- „ვერ შეიქმნა წრე — სლაგი დაკავებულია"
- „ატვირთვა ვერ მოხერხდა — სცადე სხვა სურათი"

---

## 11) Motion & Microinteractions

### პრინციპი
სუბტილური, სწრაფი, ელეგანტური. `prefers-reduced-motion` → ანიმაციები მინიმალურია/გამორთული.

### სიჩქარეები
- Fast: 120–160ms (hover, focus)
- Normal: 180–240ms (cards, transitions)
- Slow: 280–360ms (modal open/close)

### Easing
- default: `ease-out`
- emphasis: `ease-in-out` (იშვიათად)

### Page Transitions
- fade + 4px slide (framer-motion, 200ms)
- Route change progress bar: 2px, ink-colored (#1A1A1A)

### Navigation Feedback
- Progress bar ზედა ნაწილში (nextjs-toploader)
- Submit ღილაკზე spinner მხოლოდ იმ ღილაკზე
- Success/Error: sonner toast (bottom-right)

---

## 12) Delight დეტალები
- Landing background: paper gradient + grain texture (SVG feTurbulence, opacity 0.02)
- Iconography: lucide icons, ერთ სტილში
- Empty states: icon + ტექსტი + CTA
- Command Palette: Ctrl/Cmd+K, ქართული ძებნა
- Active nav pill: seal-muted ფონით, spring animation

---

## 13) QA Checklist

### ფერები და ტოკენები
- [ ] Paper background (#FAFAF8) ყველა გვერდზე
- [ ] Ink text (#1A1A1A) ყველა ტექსტზე
- [ ] Primary CTA ink-black (არა seal)
- [ ] Seal გამოიყენება მხოლოდ ნებადართულ ადგილებში
- [ ] Circle identity muted palette-ით (არა ნეონი)

### Typography
- [ ] H1/H2 serif ფონტით key pages-ზე
- [ ] Body/UI Inter-ით
- [ ] Font variables ჩატვირთულია layout.tsx-ში

### კომპონენტები
- [ ] ყველა card ერთნაირი radius/shadow
- [ ] ყველა ფორმას consistent spacing + Alerts
- [ ] PostTypeBadge outline pill სტილით
- [ ] Toast feedback circle actions-ზე

### ინტერაქცია
- [ ] hover/active/focus ყველგან აქვს
- [ ] route transitions მუშაობს
- [ ] reduced motion მუშაობს
- [ ] mobile-ზე hover effects არ „აწუხებს"

### Layout
- [ ] ყველა გვერდს ერთნაირი container/max-width (1100px)
- [ ] Mobile-ზე არაფერი „გადმოდის"
- [ ] Navbar ყველა გვერდზე ერთი და იგივე

# End
