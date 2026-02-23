# Khronika — Project Context (for AI assistants)

> Last updated: 2026-02-22 (Phase 9.1 — Post Edit/Delete)
> This document is the single source of truth for any AI assistant helping develop Khronika.
> It will be updated incrementally as the project evolves.

---

## What is Khronika?

**Khronika (ქრონიკა)** is a circle-based social network built for Georgian-speaking communities. Content is organized into **Circles** (communities/groups), and every post has a type: **Story** (experience), **Lesson** (knowledge), or **Invite** (event/meetup). The feed shows only posts from circles the user has joined — no algorithmic chaos.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | TailwindCSS v4 + shadcn/ui |
| Backend / DB | Supabase (Auth, PostgreSQL, RLS, Storage) |
| Deployment | Vercel (auto-deploy from git) |
| Fonts | Inter (body/UI), Source Serif 4 (headings) — via next/font/google |
| Animations | framer-motion, nextjs-toploader |
| Icons | lucide-react |
| Toasts | sonner (shadcn/sonner) |
| Command Palette | cmdk |
| Theme | next-themes (light mode active, dark tokens defined, toggle not yet built) |
| Mobile Drawer | shadcn/ui Sheet (left-side drawer for < lg) |

---

## Current Design System (v4 — Final)

### Core Concept: "Gold Paper + Blue Accent"

- **Background**: Shimmering gold everywhere (#F0E2C8). No white (#FFFFFF) anywhere.
- **Accent (seal)**: Blue (#3B82F6 light / #60A5FA dark) — used for CTA buttons, active nav, logo, progress bar.
- **Text**: Dark brown (#1C1108) on gold backgrounds.
- **Cards**: Warm gold (#F7EDDA), not white.
- **Borders**: Muted gold (#D4C4A0).

### Full Color Tokens (CSS Variables in `src/app/globals.css`)

**Light Mode:**
```
--background: #F0E2C8      (gold paper)
--foreground: #1C1108      (dark brown text)
--card: #F7EDDA            (lighter gold)
--muted: #E8D5B5           (muted gold)
--muted-foreground: #7A6545 (soft brown)
--border: #D4C4A0          (gold border)
--primary: #2C1A08         (dark brown CTA)
--primary-foreground: #F5E6C8
--secondary: #EBDBC2
--sidebar: #ECD9B8
--seal: #3B82F6            (BLUE — main accent)
--seal-foreground: #FFF8E7
--seal-muted: #DBEAFE
--seal-light: #EFF6FF
```

**Dark Mode:**
```
--background: #1A1408      (deep bronze)
--foreground: #F0E2C8      (gold text)
--card: #241C0E
--muted: #2E2412
--border: #3A2E18
--seal: #60A5FA            (lighter blue)
--seal-foreground: #1A1408
--seal-muted: #1E3A5F
--seal-light: #152238
```

### Seal (Blue) Usage Rules

**USE seal for:**
- CTA buttons (Create, Publish, Register, Post)
- Active nav underline/pill
- Logo background
- Progress bar (NextTopLoader color="#3B82F6")
- Notification badges
- Avatar ring accents
- Post type selector pills (selected)
- Quick action accent links
- Trending section dots

**DO NOT use seal for:**
- Body text (text is brown/dark)
- Background fills (background is gold)
- Card backgrounds
- Borders

### Typography

| Font | Tailwind | Usage |
|---|---|---|
| Inter | `font-sans` | Body, UI, forms, buttons |
| Source Serif 4 | `font-serif` | H1–H3, page titles, post titles |

### Circle Identity

Each circle gets a deterministic color from its slug (8-color muted palette):
- Dusty Rose #C9A6A6, Dark Gold #B8860B, Sage #8FA68E, Deep Teal #5A8A8A
- Steel Blue #7A9AB0, Dusty Violet #9A8AA6, Mauve #B89AA6, Terracotta #C48A7A

Used as: small colored dots in sidebar, accent strips on cards, icon chip backgrounds.

### Background Effect

Body has a fixed multi-layer gradient:
- 3 radial gradients (oklch gold tones)
- Linear gradient from seal-light to background
- SVG fractal noise grain overlay at 1.5% opacity

---

## What Has Been Built (Completed Phases)

### Phase 0 — Setup ✅
- Next.js project initialized with App Router
- TailwindCSS v4 + PostCSS configured
- shadcn/ui components installed (Button, Card, Input, Label, Avatar, Badge, Dialog, DropdownMenu, Command, Skeleton, Switch, Textarea, Sonner)
- Supabase client configured (`src/lib/supabase/client.ts`)
- Environment variables set up (`.env.local`, `.env.example`)

### Phase 1 — Auth + Profiles ✅
- Email/password login and registration working
- Supabase Auth integrated (client-side)
- `useAuth` and `useProfile` hooks
- Profile creation on first login
- `/settings/profile` page with avatar upload (Supabase Storage bucket: `avatars`)
- `/u/[username]` public profile page
- Rate limit error handling with cooldown timers (Georgian messages)
- Email normalization utility

### Phase 2 — Circles ✅
- Circle creation (`/circles/new`)
- Circle listing (`/circles`) with search
- Join / Leave circle functionality
- Circle detail page (`/c/[slug]`) with header, members, posts
- Circle identity system (deterministic colors from slug)
- Toast feedback on all actions

### Phase 2.5 — Visual Identity v4 ✅
- Gold background (#F0E2C8) + Blue seal accent (#3B82F6)
- No white anywhere
- Source Serif 4 for headings
- Interaction Pack: page transitions (framer-motion), route progress bar, command palette (Ctrl+K), hover states, grain texture
- AppShell 3-column layout (left sidebar, center content, right sidebar)
- Left sidebar: navigation + "My Circles" with colored dots
- Right sidebar: Welcome/onboarding widget, Quick Actions, Trending
- Navbar: logo, nav links (underline style), search, bell/messages, seal Create btn, avatar+username
- PostTypeBadge (outlined pill style)
- PostCard redesign (serif titles, "in CircleName", red heart, action bar)
- FeedComposer (compose from feed with circle selector)
- Landing page with gold gradient hero
- Footer with social icons

### Phase 3 — Posts v1 ✅
- PostComposer with type selection (story/lesson/invite)
- Text content required (min 3 chars)
- Photo upload (up to 4 images, Supabase Storage bucket: `posts`)
- Posts displayed on circle page (`/c/[slug]`)
- Post detail page (`/p/[id]`)
- FeedComposer on `/feed` with circle selector

### Phase 4 — Feed ✅
- `/feed` shows posts from joined circles
- PostCard with author, time, type badge, content, media, actions
- Empty state with CTA to browse circles
- "Load more" pagination (page size 20) via Supabase `.range()`

### Phase 5 — Comments + Reactions ✅
- Comment system on `/p/[id]` (list, add, delete own)
- Reaction (like) toggle with optimistic UI
- Real comment and reaction counts on PostCard
- `useReactions` hook for batched liked-state fetching
- Red filled heart when liked, outline when not
- Comment icon navigates to `/p/[id]?focus=comment`

### Phase 6 — Notifications + Moderation ✅
- DB triggers auto-create notifications on comment/reaction
- `/notifications` page with mark-as-read (individual + bulk)
- Unread badge in Navbar + Left sidebar
- PostCard overflow menu: Report post + Block user
- Blocked users' content hidden from /feed and /c/[slug]
- `/settings/blocked` page to manage blocked users
- `useUnreadCount`, `useBlocklist` hooks

### Phase 7 — Launch Polish Pack v1 ✅
- Mobile responsiveness: hamburger menu + left-side Sheet drawer on < lg
- Navbar compact layout for small screens (search icon → command palette)
- PostCard responsive media grid + tighter mobile padding
- "Load more" pagination on /feed and /c/[slug] (page size 20)
- SEO: site-wide metadata template, per-page metadata (static + dynamic `generateMetadata`)
- `public/robots.txt` + `src/app/sitemap.ts`
- Server-side Supabase client (`src/lib/supabase/server.ts`) for metadata fetching

### Phase 8.1 — Explore Circles + Real Onboarding ✅
- `/circles/explore` page with "პოპულარული წრეები" (by member count) and "აქტიური ამ კვირაში" (by post count last 7 days)
- Inline Join button on explore cards (with optimistic UI)
- "Explore" link in Left sidebar, Mobile drawer, and /circles page header
- Right sidebar: real trending circles from DB (top 5 active this week, `useTrendingCircles` hook)
- Right sidebar: real onboarding widget with 3 DB-computed steps (`useOnboarding` hook):
  - Profile complete (username + display_name)
  - Joined a circle (circle_members count >= 1)
  - Created a post (posts count >= 1)
- Onboarding widget auto-hides when all steps complete
- Feed empty state enhanced with strong CTA to `/circles/explore`

### Phase 8.2 — Sharing + Invites ✅
- Shared utility `src/lib/share.ts`: Web Share API on mobile → clipboard copy on desktop → prompt fallback
- PostCard action bar: working "გაზიარება" button copies/shares post link `/p/[id]?ref=share`
- Post detail `/p/[id]`: Share button in reaction bar
- Circle header `/c/[slug]`: Share button next to member count + "მოწვევა" (Invite) button (seal accent, public circles only)
- Invite Dialog: shows circle link with `?ref=invite`, copy button, and native share option on mobile
- All share links include `?ref=share` or `?ref=invite` UTM parameter

### Phase 8.3 — Launch Safety & Ops Pack ✅
- Legal pages: `/rules` (Community Rules), `/privacy` (Privacy Policy), `/contact` (Contact info) — all Georgian
- Footer links wired to real legal pages
- Vercel Analytics (`@vercel/analytics`) integrated in root layout — privacy-friendly, no IP storage
- Admin reports page `/admin/reports`:
  - Originally client-side gated via `NEXT_PUBLIC_ADMIN_USER_IDS` (deprecated in Phase 8.4)
  - Shows all reports ordered by time, with reporter name, target type, reason
  - Actions: "ნახვა" (link to target), "განხილული" (mark reviewed, client-side), "დაბლოკე" (block author via blocklist)
- Admin utility: `src/lib/admin.ts` — client-side `isAdmin()` (UI hiding only)

### Phase 8.4 — Admin Server-side Hardening ✅
- **Security**: Admin access now enforced server-side — NOT reliant on client-exposed `NEXT_PUBLIC_ADMIN_USER_IDS`
- Server-only env vars: `ADMIN_USER_IDS` (comma-separated UUIDs) + `SUPABASE_SERVICE_ROLE_KEY`
- `@supabase/ssr` integration: cookie-based auth for server components
- `src/middleware.ts`: Supabase session refresh on every request (syncs auth cookies)
- `src/lib/supabase/server.ts`: `createAuthServerClient()` (reads session from cookies) + `createAdminClient()` (service-role, bypasses RLS)
- `src/lib/admin-server.ts`: server-only `isAdminServer()` — reads `ADMIN_USER_IDS`
- `src/app/admin/layout.tsx`: server-side gate — calls `notFound()` for non-admins
- `src/app/admin/reports/page.tsx`: converted to server component — fetches reports via service-role client
- `src/components/admin/reports-list.tsx`: client-side interactive list (mark reviewed, block)
- `src/lib/admin.ts` retained for navbar UI hiding only (`NEXT_PUBLIC_ADMIN_USER_IDS`, optional)
- `src/lib/supabase/client.ts`: upgraded to `createBrowserClient` from `@supabase/ssr` (stores auth tokens in cookies + localStorage)

---

### Phase 9.1 — Post Edit/Delete ✅
- Author-only Edit and Delete actions in PostCard overflow menu and `/p/[id]` detail page
- Edit: opens `PostEditDialog` (Dialog modal) — change content + post type, media read-only for v1
- Delete: confirmation Dialog → removes post → toast "პოსტი წაიშალა" → card removed from list
- `/p/[id]` delete redirects to circle page
- Non-author users see Report/Block instead (unchanged)
- RLS enforced: only author can UPDATE/DELETE own posts
- `src/components/posts/post-edit-dialog.tsx`: reusable editor dialog
- `onDeleted` / `onEdited` callbacks wired in `/feed` and `/c/[slug]` for live list updates

---

### Phase 10 — Profile (დაგეგმილია) 📋
> სრული გეგმა: `docs/04_PROFILE_PHASE10.md`

სკოპი:
- `/u/[username]` enhancement: real posts (paginated), user circles, stats row, Block/Report/Share
- `/settings/profile` extension: email display, account deletion (hard delete via service role API)
- Blocked user profile → content hidden
- Mobile-first, same UX patterns (Load more, PostCard reuse, sonner toasts)
- DB schema changes არ სჭირდება (existing tables sufficient)
- Account deletion needs `SUPABASE_SERVICE_ROLE_KEY` (already configured for admin)

---

## What Is NOT Built Yet

### Phase 9 — Remaining Polish
- Dark mode toggle (tokens exist, toggle UI not built)
- Google OAuth login
- Search results page (currently only command palette)
- Messages / chat system
- Performance optimization (lazy loading, bundle analysis)
- Image optimization (next/image for user media)

---

## File Structure

```
src/
├── middleware.ts                ← Supabase session refresh (cookie sync for server auth)
├── app/
│   ├── globals.css              ← CSS tokens (source of truth for colors)
│   ├── layout.tsx               ← Root layout (fonts, providers, navbar, metadata template)
│   ├── sitemap.ts               ← Static sitemap for SEO
│   ├── page.tsx                 ← Landing page
│   ├── rules/page.tsx           ← Community rules
│   ├── privacy/page.tsx         ← Privacy policy
│   ├── contact/page.tsx         ← Contact info
│   ├── admin/
│   │   ├── layout.tsx           ← Server-side admin gate (notFound if not admin)
│   │   └── reports/page.tsx     ← Admin reports (server component, service-role fetch)
│   ├── login/
│   │   ├── layout.tsx           ← SEO metadata
│   │   └── page.tsx
│   ├── register/
│   │   ├── layout.tsx           ← SEO metadata
│   │   └── page.tsx
│   ├── feed/
│   │   ├── layout.tsx           ← SEO metadata
│   │   └── page.tsx             ← Feed with "Load more" pagination
│   ├── circles/
│   │   ├── layout.tsx           ← SEO metadata
│   │   ├── page.tsx             ← Circle listing
│   │   ├── new/page.tsx         ← Create circle
│   │   └── explore/page.tsx     ← Explore / discover circles
│   ├── c/[slug]/
│   │   ├── layout.tsx           ← Dynamic SEO (generateMetadata)
│   │   └── page.tsx             ← Circle detail + posts + "Load more"
│   ├── p/[id]/
│   │   ├── layout.tsx           ← Dynamic SEO (generateMetadata)
│   │   └── page.tsx             ← Post detail + comments
│   ├── u/[username]/
│   │   ├── layout.tsx           ← Dynamic SEO (generateMetadata)
│   │   └── page.tsx             ← Public profile
│   ├── notifications/
│   │   ├── layout.tsx           ← SEO metadata
│   │   └── page.tsx
│   └── settings/
│       ├── layout.tsx           ← SEO metadata
│       ├── profile/page.tsx
│       └── blocked/page.tsx
├── components/
│   ├── navbar.tsx               ← Responsive navbar with hamburger on mobile
│   ├── bottom-nav.tsx           ← Fixed bottom navigation for mobile (< sm)
│   ├── mobile-drawer.tsx        ← Sheet-based left drawer for < lg
│   ├── footer.tsx
│   ├── providers.tsx            ← ThemeProvider wrapper
│   ├── command-palette.tsx      ← Ctrl+K global search
│   ├── page-transition.tsx      ← framer-motion wrapper
│   ├── layout/
│   │   ├── app-shell.tsx        ← 3-column layout
│   │   ├── left-sidebar.tsx
│   │   └── right-sidebar.tsx
│   ├── posts/
│   │   ├── post-card.tsx        ← Responsive PostCard with moderation
│   │   ├── post-composer.tsx    ← Composer inside circle page
│   │   ├── post-edit-dialog.tsx ← Reusable edit dialog (content + type)
│   │   └── feed-composer.tsx    ← Composer on /feed with circle selector
│   ├── admin/
│   │   └── reports-list.tsx     ← Client-side interactive reports table
│   └── ui/                      ← shadcn components
│       ├── button.tsx, card.tsx, input.tsx, label.tsx, avatar.tsx
│       ├── badge.tsx, skeleton.tsx, switch.tsx, textarea.tsx
│       ├── dialog.tsx, dropdown-menu.tsx, command.tsx
│       ├── sheet.tsx, sonner.tsx
│       └── post-type-badge.tsx
├── hooks/
│   ├── use-auth.ts
│   ├── use-profile.ts
│   ├── use-my-circles.ts
│   ├── use-reactions.ts
│   ├── use-notifications.ts
│   ├── use-blocklist.ts
│   ├── use-onboarding.ts       ← 3-step onboarding progress
│   └── use-trending-circles.ts ← Top active circles this week
├── lib/
│   ├── utils.ts                 ← cn() helper
│   ├── share.ts                 ← Share utility (Web Share API / clipboard / prompt fallback)
│   ├── admin.ts                 ← Client-side isAdmin() (UI hiding only, NEXT_PUBLIC_ADMIN_USER_IDS)
│   ├── admin-server.ts          ← Server-side isAdminServer() (reads ADMIN_USER_IDS, never exposed to client)
│   ├── supabase/client.ts       ← Supabase browser client (@supabase/ssr, stores tokens in cookies)
│   ├── supabase/server.ts       ← createServerSupabase() (anon), createAuthServerClient() (cookie auth), createAdminClient() (service role)
│   ├── auth/normalize.ts        ← Email normalize, error translate, rate limit detect
│   └── ui/circle-style.ts       ← Deterministic circle colors
├── public/
│   └── robots.txt               ← SEO robots file
├── docs/
│   ├── 00_MASTER_PLAN.md        ← Full project plan
│   ├── 01_DESIGN_SYSTEM.md      ← Design system v4
│   ├── 02_BRAND_TOKENS.md       ← Quick color/font reference
│   └── CONTEXT.md               ← THIS FILE
└── database/
    ├── 0001_init.sql            ← Tables: profiles, circles, circle_members, posts, comments, reactions, reports, blocklist, notifications
    ├── 0002_rls.sql             ← Row-level security policies + triggers
    ├── 0003_profile_metadata_patch.sql
    ├── 0004_storage_avatars.sql ← Avatars bucket policies
    ├── 0005_storage_posts.sql   ← Posts media bucket policies
    └── 0006_reports_select_policy.sql ← Reports SELECT policy + admin RPC
```

---

## Manual Supabase Steps (must do once)

These steps cannot be automated via migrations and must be done manually in the Supabase Dashboard:

1. **Create `avatars` storage bucket:**
   - Dashboard → Storage → New Bucket → Name: `avatars`, Public: **ON**
   - Then run `database/0004_storage_avatars.sql` in SQL Editor

2. **Create `posts` storage bucket:**
   - Dashboard → Storage → New Bucket → Name: `posts`, Public: **ON**
   - Then run `database/0005_storage_posts.sql` in SQL Editor

3. **Run all SQL migrations in order:**
   - `0001_init.sql` → `0002_rls.sql` → `0003_profile_metadata_patch.sql` → `0004_storage_avatars.sql` → `0005_storage_posts.sql` → `0006_reports_select_policy.sql`

4. **Set environment variables on Vercel:**
   - `ADMIN_USER_IDS` = comma-separated admin UUIDs (server-only, **required** for admin security gate)
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase service role key (server-only, for admin data access)
   - `NEXT_PUBLIC_ADMIN_USER_IDS` = same UUIDs (optional — only shows/hides admin link in navbar UI)

---

## Database Schema (Supabase PostgreSQL)

Tables: `profiles`, `circles`, `circle_members`, `posts`, `comments`, `reactions`, `reports`, `blocklist`, `notifications`

Key relationships:
- `posts.circle_id` → `circles.id`
- `posts.author_id` → `profiles.id`
- `comments.post_id` → `posts.id`
- `reactions.post_id` → `posts.id` (unique per user)
- `circle_members` links users to circles with role (owner/mod/member)

RLS enabled: users can only read public circle posts, insert when logged in, update/delete only own content.

---

## Admin Access Control

**Server-side enforced.** The admin gate does NOT rely on client-exposed env vars for security.

| Env var | Scope | Purpose |
|---|---|---|
| `ADMIN_USER_IDS` | Server-only | Comma-separated UUIDs. Used by `src/lib/admin-server.ts` for security gate. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Service role key — admin data fetching (bypasses RLS). Never exposed to browser. |
| `NEXT_PUBLIC_ADMIN_USER_IDS` | Client (optional) | Same UUIDs. Only used to show/hide admin link in navbar. **Has NO security role.** |

**Architecture:**
- `src/app/admin/layout.tsx` reads user session from cookies (`@supabase/ssr`), checks `ADMIN_USER_IDS`. Returns `notFound()` if not admin.
- `src/app/admin/reports/page.tsx` is a server component — fetches reports using service-role client (no admin IDs sent from client).
- `src/middleware.ts` refreshes Supabase session cookies on every request.
- Client-side `isAdmin()` in `src/lib/admin.ts` is cosmetic only (navbar UI hiding).

---

## Development Guidelines

1. **Language**: Code and filenames in English. UI text in Georgian (ქართული).
2. **Styling**: Always use the existing CSS variable tokens. Never hardcode colors. Never use white (#FFFFFF).
3. **Components**: Use shadcn/ui components. Custom components go in `src/components/`.
4. **Seal accent**: Blue (#3B82F6) only for interactive elements (buttons, active states). Background stays gold.
5. **Typography**: `font-serif` for headings/titles, `font-sans` for everything else.
6. **Supabase**: Client-side: `supabase` from `@/lib/supabase/client`. Server auth: `createAuthServerClient()`. Admin ops: `createAdminClient()` (service role). Respect RLS for user-facing queries.
7. **Error handling**: Show Georgian toast messages via sonner. Graceful empty states.
8. **Accessibility**: Support `prefers-reduced-motion`. Focus-visible styles on interactive elements.
9. **Mobile-first (critical!)**: Every new feature MUST work on mobile (375px+). Check:
   - Buttons/actions accessible via `BottomNav` or in-page UI (not hidden behind desktop-only sidebars).
   - No horizontal overflow — use responsive grid (`grid-cols-1 sm:grid-cols-*`).
   - Padding: `p-3 sm:p-5` pattern for compact mobile spacing.
   - Toasts at `top-center` (bottom is occupied by BottomNav).
   - Dialogs/Sheets: use `sm:max-w-md` to avoid full-bleed on desktop.
   - Test at 375px viewport width before considering a feature complete.

---

## How to Use This Document

Paste this entire document at the beginning of a conversation with any AI assistant (ChatGPT, Claude, etc.) and then describe the specific task you want help with. Example:

> "Here is my project context: [paste CONTEXT.md]
>
> Now help me implement Phase 5: Comments + Reactions. Start with the comment list and composer on the post detail page /p/[id]."

The assistant will have full context about the stack, design, colors, file structure, and what's already built.

---

# END
