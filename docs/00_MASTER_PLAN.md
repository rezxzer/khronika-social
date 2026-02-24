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
- Animations: CSS keyframes page transition, nextjs-toploader

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
- target_type text check (target_type in ('post','comment','user'))
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
**სრულია (2026-02-24).** მოიცავს:
- `/u/[username]`: header, stats, real posts (paginated), circles, Share/Block/Report
- `/settings/profile`: email display, account deletion (მკაცრი `DELETE` typed confirm)
- `POST /api/account/delete`: service role key cascade deletion (`SUPABASE_SERVICE_ROLE_KEY`)
- Blocked user → კონტენტი დამალული
- Report user completed via `database/0014_reports_user_target.sql`

### Phase 11.1 — Dark Mode Toggle ✅
**სრულია (2026-02-22).** მოიცავს:
- `ThemeToggle` component Navbar-ში (icon + dropdown full variant)
- System preference detection (`enableSystem`)
- Dark tokens უკვე არსებობდა CSS-ში

### Phase 11.2 — Search Results Page ✅
**სრულია (2026-02-22).** მოიცავს:
- `/search?q=` სრული ძებნის გვერდი (წრეები + პოსტები)
- Navbar search bar → `/search`, command palette "ძებნა" item
- Circle results: identity dot, member count; Post results: PostCard with pagination

### Phase 12 — Follow System ✅
**სრულია (2026-02-22).** მოიცავს:
- `follows` table + RLS + notification trigger (`0007_follows.sql`)
- `useFollow` hook: toggle + counts
- Profile: Follow/Unfollow button + follower/following stats
- `/u/[username]/followers` და `/u/[username]/following` list pages
- Notifications: 'follow' type — "გამოგიწერა"
- Account deletion cascade: follows cleanup

### Phase 13.1 — Google OAuth ✅
**სრულია (2026-02-22).** მოიცავს:
- Google OAuth ღილაკი login + register გვერდებზე
- `/auth/callback` client page (PKCE code → session exchange via browser client)
- Debug logging (dev-only) + sonner toast errors
- Supabase Auth Google provider (Dashboard-ში manual setup)

### Phase 14 — Direct Messages ✅
**სრულია (2026-02-22).** მოიცავს:
- `conversations` + `messages` tables + RLS (`0008_messages.sql`)
- `/messages` inbox (conversation list, unread badges, last message preview)
- `/messages/[id]` chat page (bubbles, auto-scroll, 5s polling)
- "მესიჯი" button on profile pages
- Navbar + sidebar: Messages unread count
- Account deletion cascade

### Phase 15.1 — Realtime Messages ✅
**სრულია (2026-02-22).** მოიცავს:
- Supabase Realtime `postgres_changes` → instant message delivery
- Removed polling from `useMessages`, `useConversations`, `useUnreadMessages`
- Mobile bottom nav: "მესიჯები" tab with unread badge
- Requires Supabase Dashboard: enable Realtime on `messages` + `conversations` tables

### Phase 16 — Realtime Notifications ✅
**სრულია (2026-02-22).** მოიცავს:
- `useUnreadCount`: Supabase Realtime INSERT/UPDATE subscriptions
- `/notifications` page: auto-refetch on new notification
- mark-as-read badge sync via `refreshBadge()`
- Requires Supabase Dashboard: enable Realtime on `notifications` table

### Phase 16.1 — Comment Replies ✅
**სრულია (2026-02-23).** მოიცავს:
- `parent_id` სვეტი comments ცხრილში (reply threading)
- Reply ღილაკი + input indicator + "↩ username-ს პასუხობს" label
- Non-member UX: "შეუერთდი წრეს" prompt ფორმის ნაცვლად

### Phase 16.2 — Messaging Polish ✅
**სრულია (2026-02-23).** მოიცავს:
- საკუთარი მესიჯის წაშლა (DELETE RLS policy + UI)
- ოპტიმისტური გაგზავნა (მყისიერი UI)
- Supabase Broadcast: send + delete სინქრონიზაცია (RLS-independent)
- Unread badge: 10s polling fallback + DELETE subscription
- REPLICA IDENTITY FULL on messages

### Phase 17.1 — Feed Algorithm ✅
**სრულია (2026-02-23).** მოიცავს:
- 3-tab feed: „ჩემი წრეები" / „გამოწერილები" / „ტრენდული"
- Trending: ბოლო 7 დღის პოსტები reactions count-ით
- Blocklist + dedup + pagination + empty states ყველა tab-ზე
- Mobile-friendly pill toggle

### Phase 17.2 — Image Optimization ✅
**სრულია (2026-02-23).** მოიცავს:
- `next.config.ts` remotePatterns: Supabase Storage domain
- PostCard media grid: `<img>` → `next/image` (fill, sizes, lazy)
- Post detail media: `<img>` → `next/image` (responsive sizes)
- Georgian alt texts, aspect ratio preserved, no DB changes

### Phase 17.3 — Performance Optimization ✅
**სრულია (2026-02-23).** მოიცავს:
- `framer-motion` → CSS `@keyframes` PageTransition (~30KB removed)
- Dynamic imports: `CommandPalette`, `MobileDrawer`, `PostEditDialog`
- `React.memo` PostCard, `useMemo` visiblePosts
- `loading.tsx` skeletons: feed, notifications, messages, chat
- No UI/UX or DB changes

### Phase 17.4 — Typing Indicator ✅
**სრულია (2026-02-23).** მოიცავს:
- Supabase Realtime Presence: `typing:{conversationId}` channel
- `useTypingIndicator` hook: track/untrack, throttle (2s), auto-clear (3s)
- Animated "წერს..." UI between messages and input
- No DB or manual Supabase changes

### Phase 18.1 — Push Notifications (v1, messages-only) ✅
**სრულია (2026-02-24).** მოიცავს:
- Native Web Push + VAPID (no FCM)
- Service Worker: push event + notification click → open chat
- `useWebPush` hook: subscribe/unsubscribe/permission management
- API route `/api/push/send`: server-side notification sending via `web-push`
- Settings UI: push toggle Card with Switch
- DB: `push_subscriptions` table + RLS
- Manual steps: VAPID keys, migration 0012

### Phase 19.1 — Video Uploads (v1) ✅
**სრულია (2026-02-24).** მოიცავს:
- `posts.media_kind` + `posts.video_url` (single video model)
- `post-videos` storage bucket + RLS policies
- Composer video upload (mp4/webm), max size validation, progress UI
- PostCard video preview + post detail full video controls
- Rule: image-only ან video-only (no mix in one post)
- Backward compatibility: old image posts unchanged
- Migration compatibility fix: `jsonb_array_length(media_urls)` for Supabase `jsonb` schema
- Polish pass completed:
  - PostCard natural ratio, loading fallback, duration badge
  - Mobile controls usability polish
  - Post detail spacing/typography tune
- Polish ეტაპზე schema/upload-flow არ შეცვლილა

### Phase 20 — Push Notifications v2 ✅
**სრულია (2026-02-24).** მოიცავს:
- Web Push გაფართოება `reaction` / `comment` / `follow` ივენთებზე (messages legacy flow შენარჩუნებით)
- Reuse არქიტექტურა:
  - `/api/push/send` generic/type-aware route + shared `src/lib/push/server.ts`
  - client fire-and-forget helper `src/lib/push/client.ts`
  - არსებული `push_subscriptions` + VAPID + service worker ინფრასტრუქტურა
- Trigger bindings:
  - reaction: მხოლოდ like-add
  - comment: მხოლოდ წარმატებული create
  - follow: მხოლოდ follow-add
- Service Worker click routing polish: `data.link` პრიორიტეტი, `conversationId` legacy fallback, safe fallback `/notifications`
- Reliability: push failure არ აჩერებს მთავარ action UX-ს; self-target skip guard დაცულია

**Out of scope (v2):**
- per-type push preferences
- batching/digest
- quiet hours
- ახალი notification კატეგორიები

### Phase 21 — Video v2 Lite ✅
**სტატუსი:** Video v2 Lite დასრულებულია ✅ (Step 1–5)

**მიზანი:**
- Video v1-ის არსებული UX/ინფრა გადავიყვანოთ უფრო production-ready მიმართულებით:
  - უკეთესი ატვირთვის წესები/ვალიდაცია
  - metadata consistency
  - poster thumbnail strategy
  - performance/playback polish

**რეკომენდებული გზაა (Phase 21):** Video v2 Lite
- არსებული upload flow-ის შენარჩუნება (low risk)
- stricter validation policy
- metadata fields consistency plan
- poster strategy (simple + fallback)
- playback polish

**ალტერნატივა (შემდეგ ეტაპზე):** Video v2 Full Pipeline
- transcoding/compression background jobs
- multi-rendition/adaptive streaming
- storage path/versioning + job architecture

**Phase 21 Lite — Done როცა:**
- Validation rules მკაფიოდ მუშაობს composer-ებში
- Video metadata თანმიმდევრულია card/detail rendering-ში
- Poster strategy არის (primary + fallback)
- Playback UX სტაბილურია მობაილ/დესკტოპზე
- Docs synced (`CONTEXT`, `MASTER_PLAN`, `PROGRESS`, phase doc)

**Step-level progress note (Lite scope closeout):**
- Step 1 ✅ Validation rules unification
- Step 2 ✅ Metadata consistency contract
- Step 3 ✅ Poster/Fallback strategy (UI-level)
- Step 4 ✅ Playback UX polish + graceful video error states
- Step 5 ✅ QA finalization + verification gates + final docs sync

**Out of scope (Phase 21 Lite):**
- სრული transcoding pipeline
- adaptive streaming production rollout
- advanced video security/DRM

### Phase 22 — Video v2 Full Pipeline (Implementation in progress)
**სტატუსი:** Step 7 დასრულებულია ✅, Phase 22 = partial/blocker
**Blocker მიზეზი:** live external provider callback E2E not yet verified in real traffic

**მიზანი:**
- ვიდეო ქვეინფრასტრუქტურის გადასვლა production-grade pipeline-ზე:
  - async processing (job lifecycle)
  - transcoding/compression
  - adaptive playback sources

**Minimum production-worthy scope (v1):**
- queue/job orchestration (`queued`, `processing`, `completed`, `failed`, `retrying`)
- original + processed outputs storage convention
- playback manifest/source selection with safe fallback
- processing failure visibility (user-facing concise state + ops-facing diagnostics)

**Architecture options (planning):**
- Option A: app-managed async jobs + storage outputs
- Option B: queue-based orchestration + external processing service ✅ (decision lock)

**Decision locks (current):**
- `video_processing_events` table შედის v1-ში (mandatory observability)
- Processing failure default: graceful unavailable state
- Original progressive fallback: optional-only, მხოლოდ policy/security checks-ის გავლისას
- Implementation order: provider-agnostic foundation → provider adapter → gated rollout

**Step progress (implementation):**
- Step 1 ✅ DB foundation migration: `database/0015_video_pipeline_foundation.sql`
- Step 1 verification ✅ manual DB sanity checks passed in Supabase
- SQL snippet note: `pg_policies` checks use `policyname` (environment-specific)
- Step 2 ✅ provider-agnostic contracts layer:
  - `src/lib/video-pipeline/types.ts`
  - `src/lib/video-pipeline/status.ts`
  - `src/lib/video-pipeline/contracts.ts`
  - API contract routes: `create`, `status/read`, `retry` (contract-side only)
- Step 2 intentionally out-of-scope: queue/worker execution, provider signature/webhook integration, UI states
- Step 3 ✅ orchestration skeleton layer:
  - `src/lib/video-pipeline/queue.ts`
  - `src/lib/video-pipeline/worker.ts`
  - `src/lib/video-pipeline/retry.ts`
  - create/retry routes now trigger provider-agnostic dispatch hooks
- Step 3 intentionally out-of-scope: provider adapter integration, webhook signature handling, UI/feature-flag rollout
- Step 4 ✅ provider adapter integration layer:
  - `src/lib/video-pipeline/provider-adapter.ts` (submit + callback normalization/verification boundary)
  - `src/app/api/video-assets/webhook/route.ts` (signed callback handling + status mapping/persistence)
  - `src/lib/video-pipeline/worker.ts` updated to submit claimed jobs through adapter boundary
- Step 4 security/idempotency:
  - HMAC signature verification with secret-based callback validation
  - replay protection via timestamp window + nonce replay checks
  - duplicate callbacks safely skipped (idempotent path)
- Step 4 intentionally out-of-scope: UI changes, feature flags/rollout wiring, admin/ops UI
- Step 5 ✅ UI lifecycle integration layer:
  - `src/lib/video-pipeline/client.ts` added for authenticated `create/status` consumption
  - composer lifecycle surface (non-blocking) added in `feed-composer` and `post-composer`
  - `post-card` + `/p/[id]` now render lifecycle-aware states from owner-side `video_assets` status
  - ready state prefers processed playback outputs, legacy `posts.video_url` fallback preserved
- Step 5 intentionally out-of-scope: provider/webhook security changes, queue/worker logic changes, DB/schema changes, feature flags
- Step 6 ✅ server reliability and ops visibility polish:
  - `src/lib/video-pipeline/retry.ts`: jittered backoff + retry ETA
  - `src/lib/video-pipeline/worker.ts`: attempt increment on claim + correlated event payload standardization + auto-retry exhausted event
  - `src/app/api/video-assets/retry/route.ts`: status-conditioned retry update + concurrent conflict handling
  - `src/app/api/video-assets/[postId]/events/route.ts`: owner-only ops/event visibility endpoint
- Step 6 intentionally out-of-scope: UI redesign, provider security model rewrite, DB major expansion, feature flags/admin dashboard
- Step 7 ✅ closeout gate:
  - QA matrix + regression audit completed for Step 1–6 flow
  - minimal fix applied: retry attempt double-increment removed in retry route
  - verification gates passed: `npx tsc --noEmit` ✅, `npm run build` ✅
  - Phase 22 truth-aligned as **partial/blocker** pending live external provider callback E2E verification in real traffic
- Blocker lift checklist (complete mark-მდე):
  - real provider callback success path დადასტურებული
  - real provider callback failed path დადასტურებული
  - retry path დადასტურებული end-to-end
  - events visibility trace დადასტურებული (`/api/video-assets/[postId]/events` + `video_processing_events`)
  - security checks runtime-ზე დადასტურებული (signature/replay/duplicate handling)
- Required evidence artifacts:
  - timestamped request/response logs
  - `video_processing_events` examples (success/fail/retry/security)
  - request ids (`providerJobId`, `providerRequestId`, optional provider event id)
  - მოკლე screenshot/capture evidence runtime checks-იდან

**Phase 22 v1-ში არ შედის:**
- DRM / live streaming
- advanced per-title encoding optimization
- multi-region media replication strategy

**Done როცა (planning gate):**
- არქიტექტურული არჩევანი ერთ ვარიანტზე დაფიქსირებულია
- DB/storage/API ცვლილებების გეგმა დოკუმენტურად შეთანხმებულია
- rollout/QA/risk plan დამტკიცებულია
- მხოლოდ ამის შემდეგ გადავდივართ code implementation-ზე

### Hotfixes — 2026-02-24 ✅
- Profile false not-found after settings update:
  - cause: stale `notFound` state in `src/app/u/[username]/page.tsx`
  - fix: reset flag before fetch and on successful fetch
- Mobile PostCard video invisible issue:
  - cause: readiness depended mostly on `onLoadedData` event
  - fix: readiness widened to `onLoadedMetadata` + `onCanPlay` (+existing `onLoadedData`)

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
  - BottomNav: Feed, Explore, Messages, Notifications, Profile
  - MobileDrawer (hamburger): nav + My Circles
  - No horizontal overflow (responsive grid)
  - Padding: p-3 sm:p-5
  - Toasts: top-center (BottomNav covers bottom)
  - Dialog/Sheet: sm:max-w-md
  - Test at 375px viewport before shipping

---

# END