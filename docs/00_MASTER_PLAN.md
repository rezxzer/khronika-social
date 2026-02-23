# Khronika (ქრონიკა) — Master Plan

## 0) იდეა ერთ წინადადებაში
„ქრონიკა“ არის **წრეებზე (თემებზე) დაფუძნებული სოციალური ქსელი**, სადაც კონტენტი არის „ამბავი/სწავლება/მოწვევა“ და არა უბრალოდ ქაოსური ფიდი.

---

## 1) მიზანი და რატომ ვქმნით
### მთავარი მიზანი
- შევქმნათ სოციალური ქსელი, რომელიც **ნდობას, თემებს და ხარისხიან კონტენტს** აძლიერებს.
- ფიდი უნდა იყოს „ჩემი წრეები“ — ანუ ადამიანი ხედავს იმ სივრცეს, სადაც რეალურად ეკუთვნის.

### რატომ განსხვავდება სხვებისგან
- ყველაფერი იწყება **წრეებიდან** (უბანი/კლასი/კლუბი/სკვადი/ხელობა/ოჯახი).
- პოსტი არ არის უბრალოდ „პოსტი“ — არის ტიპი:
  - **ამბავი (story)** — გამოცდილება/მნიშვნელობა
  - **სწავლება (lesson)** — მოკლე ცოდნა/რჩევა
  - **მოწვევა (invite)** — ღონისძიება/შეხვედრა/სკრიმი

---

## 2) MVP (პირველი რეალური ვერსია)
### აუცილებლად უნდა იყოს
1) ავტორიზაცია (Email/Google)
2) პროფილი (სახელი, ავატარი, ბიო)
3) წრეები (შექმნა/შეერთება/დატოვება)
4) წრეში პოსტები (ტექსტი + ფოტოები)
5) ფიდი (მხოლოდ ჩემი წრეების პოსტები)
6) კომენტარი + ლაიქი (reaction)
7) მარტივი მოდერაცია: რეპორტი/ბლოკი
8) Notifications (მინიმუმ: კომენტარი/რეაქცია ჩემს პოსტზე)

### რაც MVP-ში არ გვჭირდება (შემდეგი ეტაპია)
- ჩატი realtime
- ვიდეო ატვირთვები (შემდეგ)
- რეკომენდაციების მძიმე ალგორითმი

---

## 3) UX / დიზაინის წესები (ერთიანი სტილი)

> **UI Source of Truth:**
> - სრული დიზაინ სისტემა → `docs/01_DESIGN_SYSTEM.md` (v4)
> - ფერები/ფონტები/ტოკენები (სწრაფი ref) → `docs/02_BRAND_TOKENS.md`

### პალიტრის კონცეფცია (v4)
- **ოქროს ფონი** — background, card, sidebar, border — ყველაფერი ოქროსფერი (#F0E2C8)
- **ლურჯი აქცენტი** — seal (#3B82F6) — CTA ღილაკები, active states, progress bar
- **თეთრი არსად** — #FFFFFF არ გამოიყენება
- Card-based UI, ბევრი whitespace

### Layout
- Max width: 1100px
- 3 მთავარი ზონა:
  - Top Navbar (ლოგო + nav + search + bell/messages + CTA + avatar)
  - Left: Nav + My Circles (colored dots, desktop-ზე)
  - Center: Feed / Content
  - Right: Welcome widget + Quick Actions + Trending (desktop-ზე)

### Typography
- **Inter** — body/UI
- **Source Serif 4** — H1–H3, key page titles, post titles
- Button ტექსტი: მკაფიო მოქმედება (შეერთდი / დატოვე / დაწერე)

### UI Components (shadcn/ui)
- Button, Card, Tabs, Dialog, DropdownMenu, Badge, Skeleton, Toast, Command, Sonner
- Icons: lucide-react
- Animations: framer-motion, nextjs-toploader

### Theme
- Light mode — მზადაა (Visual Identity v4: ოქროს ფონი + ლურჯი აქცენტი)
- Dark mode tokens — CSS-ში განსაზღვრულია (მუქი ბრინჯაო), toggle შემდეგ ეტაპზე

---

## 4) ინფორმაციის არქიტექტურა (Routes)
### Public
- / (Landing)
- /login
- /register

### Authenticated
- /feed
- /circles
- /circles/new
- /c/[slug] (Circle page + posts)
- /p/[id] (Post detail)
- /settings/profile
- /notifications

---

## 5) მონაცემთა მოდელი (Supabase/Postgres)
### tables
**profiles**
- id uuid (PK, = auth.users.id)
- username text unique
- display_name text
- avatar_url text
- bio text
- created_at timestamptz default now()

**circles**
- id uuid PK
- owner_id uuid references profiles(id)
- name text
- slug text unique
- description text
- is_private boolean default false
- created_at timestamptz default now()

**circle_members**
- circle_id uuid references circles(id)
- user_id uuid references profiles(id)
- role text check (role in ('owner','mod','member'))
- joined_at timestamptz default now()
- unique(circle_id, user_id)

**posts**
- id uuid PK
- circle_id uuid references circles(id)
- author_id uuid references profiles(id)
- type text check (type in ('story','lesson','invite'))
- content text
- media_urls jsonb default '[]'
- created_at timestamptz default now()

**comments**
- id uuid PK
- post_id uuid references posts(id)
- author_id uuid references profiles(id)
- content text
- created_at timestamptz default now()

**reactions**
- post_id uuid references posts(id)
- user_id uuid references profiles(id)
- type text default 'like'
- created_at timestamptz default now()
- unique(post_id, user_id)

**reports**
- id uuid PK
- reporter_id uuid references profiles(id)
- target_type text check (target_type in ('post','comment'))
- target_id uuid
- reason text
- created_at timestamptz default now()

**blocklist**
- blocker_id uuid references profiles(id)
- blocked_id uuid references profiles(id)
- created_at timestamptz default now()
- unique(blocker_id, blocked_id)

**notifications**
- id uuid PK
- user_id uuid references profiles(id)  -- ვისაც ეშვება
- actor_id uuid references profiles(id) -- ვინც გააკეთა
- type text check (type in ('comment','reaction'))
- entity_id uuid
- is_read boolean default false
- created_at timestamptz default now()

---

## 6) უსაფრთხოება (RLS) — მოკლე წესები
- Public circle: პოსტების კითხვა ყველას შეუძლია
- Private circle: პოსტების კითხვა მხოლოდ წევრებს
- Insert post/comment/reaction: მხოლოდ logged-in user
- Update/Delete: მხოლოდ ავტორს შეუძლია
- Circle mods: შეუძლიათ წრეში პოსტ/კომენტის წაშლა (MVP-ში შეიძლება owner+mod)
- Blocklist: ვინც დაბლოკე — მისი კონტენტი შენ ფიდში არ ჩანს

---

## 7) ტექნოლოგიური სტეკი (დასამტკიცებლად)
- Next.js (App Router) + TypeScript
- TailwindCSS + shadcn/ui
- Supabase: Auth, Postgres, RLS, Storage
- Deployment: Vercel
- Optional later: Realtime, Edge Functions

---

## 8) Folder სტრუქტურა (რეკომენდაცია)
- app/
  - (public)/ (landing, login, register)
  - (auth)/ (feed, circles, etc)
- components/
  - ui/ (shadcn)
  - feed/
  - circles/
- lib/
  - supabase/
  - auth/
  - validators/
- docs/
  - 00_MASTER_PLAN.md (ეს ფაილი)
  - 01_DESIGN_SYSTEM.md (დიზაინ სისტემა v4)
  - 02_BRAND_TOKENS.md (ფერები/ფონტები quick ref)
- database/
  - 0001_init.sql
  - 0002_rls.sql
  - ...

---

## 9) ეტაპები (Roadmap) + Definition of Done
### Phase 0 — Setup
**Done როცა:**
- Next.js პროექტი მზადაა
- Tailwind + shadcn/ui დაყენებულია
- Supabase env-ები გამართულია
- Basic layout + navbar ჩანს

### Phase 1 — Auth + Profiles
**Done როცა:**
- Login/Register მუშაობს
- first login-ზე profiles row ავტომატურად იქმნება
- /settings/profile-ზე რედაქტირება + avatar upload მუშაობს

### Phase 2 — Circles
**Done როცა:**
- Circle შექმნა მუშაობს
- Circle list + search მუშაობს
- Join/Leave მუშაობს
- /c/[slug] გვერდი ჩანს

### Phase 2.5 — Visual Identity v4 ✅
**სრულია.** მოიცავს:
- ოქროს ფონი (#F0E2C8) + ლურჯი seal აქცენტი (#3B82F6)
- თეთრი (#FFFFFF) სრულად ამოღებულია
- Source Serif 4 typography (H1–H3, post titles)
- Circle Identity (muted 8-color palette)
- Interaction Pack (page transitions, command palette, toast, hover states)
- AppShell 3-column layout + sidebar widgets
- PostTypeBadge outline pill სტილი
- FeedComposer + PostCard redesign
- დოკუმენტაცია: `docs/01_DESIGN_SYSTEM.md` (v4), `docs/02_BRAND_TOKENS.md`

### Phase 3 — Posts (შემდეგი UI milestone: AppShell + PostComposer)
**Done როცა:**
- PostComposer აქვს type არჩევა (story/lesson/invite)
- ტექსტი აუცილებელია
- ფოტო ატვირთვა 1-4 ცალი
- პოსტები ჩანს circle page-ზე

### Phase 4 — Feed
**Done როცა:**
- /feed აჩვენებს მხოლოდ წევრი წრეების პოსტებს
- Pagination / infinite scroll მუშაობს
- Post card-ს აქვს ავტორი, დრო, რეაქციები, კომენტარების რაოდენობა

### Phase 5 — Comments + Reactions ✅
**სრულია.** მოიცავს:
- /p/[id] პოსტის დეტალი კომენტარების სისტემით
- კომენტარის დამატება/წაშლა (only own) + დადასტურება
- reaction (like) toggle ოპტიმისტური UI-ით
- რეალური counts PostCard-ზე
- `useReactions` hook ბათჩ-ფეჩინგით
- Comment icon → `/p/[id]?focus=comment` ნავიგაცია

### Phase 6 — Notifications + Moderation ✅
**სრულია.** მოიცავს:
- DB triggers ავტომატურად ქმნის notifications-ს comment/reaction-ზე
- `/notifications` გვერდი mark-as-read-ით (individual + bulk)
- Unread badge Navbar-ში + Left sidebar-ში
- PostCard overflow menu: Report + Block
- დაბლოკილი მომხმარებლის კონტენტი იფილტრება /feed და /c/[slug]-ზე
- `/settings/blocked` გვერდი განბლოკვის ფუნქციით
- `useUnreadCount`, `useBlocklist` hooks

### Phase 7 — Launch Polish Pack v1 ✅
**სრულია.** მოიცავს:
- მობაილ რესპონსივი: hamburger მენიუ + Sheet drawer < lg
- Navbar compact layout მობაილზე
- PostCard responsive media + tighter mobile padding
- "მეტის ჩატვირთვა" pagination /feed და /c/[slug]-ზე (page size 20)
- SEO: metadata template, per-page metadata, generateMetadata dynamic pages-ზე
- `public/robots.txt` + `src/app/sitemap.ts`

### Phase 8.1 — Explore Circles + Real Onboarding ✅
**სრულია.** მოიცავს:
- `/circles/explore` გვერდი პოპულარული + აქტიური წრეებით
- Inline Join ღილაკი explore card-ებზე
- Explore ლინკი sidebar-ში, mobile drawer-ში, /circles header-ში
- Right sidebar: რეალური trending წრეები DB-დან (`useTrendingCircles`)
- Right sidebar: რეალური onboarding widget 3 ნაბიჯით (`useOnboarding`)
- Feed empty state გაუმჯობესებული CTA-ით `/circles/explore`-ზე

### Phase 8.2 — Sharing + Invites ✅
**სრულია.** მოიცავს:
- საერთო share utility (`src/lib/share.ts`): Web Share API მობაილზე, clipboard copy დესკტოპზე
- PostCard-ზე "გაზიარება" ღილაკი — პოსტის ლინკს აზიარებს/კოპირებს
- პოსტის დეტალურ გვერდზე (`/p/[id]`) Share ღილაკი reaction bar-ში
- წრის გვერდზე (`/c/[slug]`) Share + "მოწვევა" ღილაკები header-ში
- Invite Dialog: წრის ლინკი + copy ღილაკი + native share მობაილზე
- UTM პარამეტრები: `?ref=share` და `?ref=invite`

### Phase 8.3 — Launch Safety & Ops Pack ✅
**სრულია.** მოიცავს:
- სამართლებრივი გვერდები: `/rules`, `/privacy`, `/contact` (ქართულად)
- Footer ლინკები რეალურ გვერდებზე
- Vercel Analytics — privacy-friendly pageview tracking
- `/admin/reports` — ადმინის რეპორტების განხილვის გვერდი
- `isAdmin()` helper (`NEXT_PUBLIC_ADMIN_USER_IDS` env var-ით)
- რეპორტის ქმედებები: ნახვა, განხილული, ავტორის დაბლოკვა

### Phase 8.4 — Admin Server-side Hardening ✅
**სრულია (2026-02-22).** მოიცავს:
- Admin access server-side enforced (`ADMIN_USER_IDS` + `SUPABASE_SERVICE_ROLE_KEY`)
- `@supabase/ssr` ინტეგრაცია: cookie-based auth server components-ისთვის
- `src/middleware.ts`: Supabase session refresh
- `src/app/admin/layout.tsx`: server-side admin gate (`notFound()`)
- `/admin/reports` converted to server component (service-role fetch)
- `NEXT_PUBLIC_ADMIN_USER_IDS` deprecated (UI hiding only, optional)

### Phase 9.1 — Post Edit/Delete ✅
**სრულია (2026-02-22).** მოიცავს:
- ავტორის PostCard overflow: „რედაქტირება" + „წაშლა"
- Edit Dialog: content + type ცვლილება, media read-only
- Delete: confirm dialog → წაშლა → toast → card removal
- `/p/[id]` detail page-ზეც Edit/Delete ავტორისთვის
- `onDeleted`/`onEdited` callbacks feed/circle pages-ში

### Phase 10 — Profile ✅
**სრულია (2026-02-22).** მოიცავს:
- `/u/[username]`: header, stats, real posts (paginated), circles, Share/Block
- `/settings/profile`: email display, account deletion (მკაცრი confirm)
- `POST /api/account/delete`: service role key cascade deletion
- Blocked user → კონტენტი დამალული
- Report user → Phase 11 (DB enum limit)

### Phase 11 — Remaining Polish (შემდეგი)
**Done როცა:**
- Dark mode toggle UI მუშაობს
- Google OAuth ინტეგრირებულია
- Follow/Friend system (new DB table)
- Search results page
- Performance optimization

---

## 10) Cursor-ის წესები (კრიტიკული)
ჩვენ ვწერთ **ინგლისურ პრომპტებს**, მაგრამ Cursor-ის **პასუხი უნდა იყოს ქართულად**.

### პრომპტის შაბლონი (ყოველ დავალებაზე ჩასასმელი)
Paste this at the top of every Cursor request:

**ENGLISH PROMPT HEADER**
You are an expert full-stack engineer. Build the requested feature in Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase.
Rules:
- Write code and filenames in English.
- Respond to me in Georgian language.
- Keep changes minimal and consistent with existing structure.
- Include: file paths, code blocks, and a short checklist to verify locally.
- Prefer server actions or route handlers when appropriate.
- Security: respect RLS assumptions; do not bypass auth.

---

## 11) მონეტიზაცია (შემდეგ ეტაპზე, მაგრამ წინასწარ იდეა)
- VIP circles (private paid)
- Creator subscriptions
- Donations (one-time)
- Pro badges / themes

---

## 12) წარმატების მეტრიკები (MVP)
- 7 დღეში: რამდენმა შექმნა წრე
- რამდენმა დაწერა 1 პოსტი
- რამდენმა დატოვა კომენტარი
- retention: დაბრუნდა თუ არა 3 დღეში

---

## 13) „არ დაგვავიწყდეს“ (Checklist)
- DB migrations versioned
- RLS policies tested
- Storage bucket rules
- Error/toast UX
- Empty states
- **Mobile-first (კრიტიკული!):**
  - ყველა ახალ ფუნქციაში buttons/actions ხელმისაწვდომი მობაილზე (375px+)
  - BottomNav: Feed, Explore, Create, Notifications, Profile
  - MobileDrawer (hamburger): nav + My Circles
  - No horizontal overflow (responsive grid)
  - Padding: p-3 sm:p-5
  - Toasts: top-center (BottomNav covers bottom)
  - Dialog/Sheet: sm:max-w-md
  - Test at 375px viewport before shipping

---

# END