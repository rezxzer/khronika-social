# ქრონიკა — პროგრესის ტრეკერი (Changelog)

> ყოველი ახალი ფუნქციის დამატებისას აქ ვწერთ.
> ბოლო განახლება: 2026-02-22 (Phase 11.1)

---

## Phase 0 — Setup ✅

| რა გაკეთდა | ფაილები |
|---|---|
| Next.js 16 (App Router) + TypeScript | `package.json`, `tsconfig.json` |
| TailwindCSS v4 + PostCSS | `postcss.config.mjs`, `src/app/globals.css` |
| shadcn/ui (new-york style) | `components.json`, `src/components/ui/*` |
| Supabase client კონფიგურაცია | `src/lib/supabase/client.ts`, `.env.local` |
| Root layout + Navbar | `src/app/layout.tsx`, `src/components/navbar.tsx` |
| Landing page | `src/app/page.tsx` |
| cn() utility | `src/lib/utils.ts` |

---

## Phase 1 — Auth + Profiles ✅

| რა გაკეთდა | ფაილები |
|---|---|
| Login გვერდი (email/password) | `src/app/login/page.tsx` |
| Register გვერდი + email confirmation | `src/app/register/page.tsx` |
| `useAuth` hook (user, loading, signOut) | `src/hooks/use-auth.ts` |
| `useProfile` hook | `src/hooks/use-profile.ts` |
| Profile auto-create trigger (DB) | `database/0001_init.sql` |
| Profile edit გვერდი | `src/app/settings/profile/page.tsx` |
| Avatar upload (Supabase Storage: `avatars`) | `src/app/settings/profile/page.tsx` |
| Public profile გვერდი | `src/app/u/[username]/page.tsx` |
| Rate limit handling + cooldown timer | `src/app/register/page.tsx`, `src/app/login/page.tsx` |
| Email normalization + error translation | `src/lib/auth/normalize.ts` |

---

## Phase 2 — Circles ✅

| რა გაკეთდა | ფაილები |
|---|---|
| წრეების სია + search | `src/app/circles/page.tsx` |
| წრის შექმნა (name, slug, description, private toggle) | `src/app/circles/new/page.tsx` |
| წრის გვერდი (header, members, posts) | `src/app/c/[slug]/page.tsx` |
| Join / Leave ფუნქცია | `src/app/c/[slug]/page.tsx` |
| Circle identity (deterministic colors from slug) | `src/lib/ui/circle-style.ts` |
| Toast feedback ყველა ქმედებაზე | sonner integration |
| `useMyCircles` hook | `src/hooks/use-my-circles.ts` |

---

## Phase 2.5 — Visual Identity v4 ✅

| რა გაკეთდა | ფაილები |
|---|---|
| Gold background (#F0E2C8) + Blue seal (#3B82F6) | `src/app/globals.css` |
| #FFFFFF სრულად ამოღებული | `src/app/globals.css` |
| Source Serif 4 typography (H1–H3) | `src/app/layout.tsx` |
| Circle Identity (8-color muted palette) | `src/lib/ui/circle-style.ts` |
| Page transitions (framer-motion) | `src/components/page-transition.tsx` |
| Route progress bar (nextjs-toploader) | `src/app/layout.tsx` |
| Command palette (Ctrl+K) | `src/components/command-palette.tsx` |
| AppShell 3-column layout | `src/components/layout/app-shell.tsx` |
| Left sidebar (nav + My Circles) | `src/components/layout/left-sidebar.tsx` |
| Right sidebar (onboarding, actions, trending) | `src/components/layout/right-sidebar.tsx` |
| PostTypeBadge (outlined pill) | `src/components/ui/post-type-badge.tsx` |
| PostCard redesign (serif titles, red heart, action bar) | `src/components/posts/post-card.tsx` |
| FeedComposer (compose from feed) | `src/components/posts/feed-composer.tsx` |
| Landing page gold gradient hero | `src/app/page.tsx` |
| Footer | `src/components/footer.tsx` |
| ThemeProvider | `src/components/providers.tsx` |
| Design docs | `docs/01_DESIGN_SYSTEM.md`, `docs/02_BRAND_TOKENS.md` |

---

## Phase 3 — Posts v1 ✅

| რა გაკეთდა | ფაილები |
|---|---|
| PostComposer (story/lesson/invite type) | `src/components/posts/post-composer.tsx` |
| ტექსტი (min 3 chars) + ფოტო upload (max 4) | `src/components/posts/post-composer.tsx` |
| Supabase Storage bucket: `posts` | `database/0005_storage_posts.sql` |
| პოსტები circle page-ზე | `src/app/c/[slug]/page.tsx` |
| Post detail გვერდი | `src/app/p/[id]/page.tsx` |
| FeedComposer with circle selector | `src/components/posts/feed-composer.tsx` |

---

## Phase 4 — Feed ✅

| რა გაკეთდა | ფაილები |
|---|---|
| /feed — joined circles-ის პოსტები | `src/app/feed/page.tsx` |
| PostCard (author, time, type badge, media, actions) | `src/components/posts/post-card.tsx` |
| Empty state + CTA | `src/app/feed/page.tsx` |
| "Load more" pagination (page size 20, `.range()`) | `src/app/feed/page.tsx` |

---

## Phase 5 — Comments + Reactions ✅

| რა გაკეთდა | ფაილები |
|---|---|
| Comment system on /p/[id] (list, add, delete own) | `src/app/p/[id]/page.tsx` |
| Delete confirmation UX | `src/app/p/[id]/page.tsx` |
| Reaction (like) toggle + optimistic UI | `src/app/p/[id]/page.tsx`, `src/components/posts/post-card.tsx` |
| Real comment/reaction counts on PostCard | `src/components/posts/post-card.tsx` |
| `useReactions` hook (batched liked-state) | `src/hooks/use-reactions.ts` |
| Red filled heart / outline toggle | `src/components/posts/post-card.tsx` |
| Comment icon → /p/[id]?focus=comment | `src/components/posts/post-card.tsx` |

---

## Phase 6 — Notifications + Moderation ✅

| რა გაკეთდა | ფაილები |
|---|---|
| DB triggers: auto-create notifications | `database/0002_rls.sql` |
| /notifications page + mark-as-read | `src/app/notifications/page.tsx` |
| Unread badge (Navbar + Left sidebar) | `src/components/navbar.tsx`, `src/components/layout/left-sidebar.tsx` |
| `useUnreadCount` hook | `src/hooks/use-notifications.ts` |
| PostCard overflow: Report post | `src/components/posts/post-card.tsx` |
| PostCard overflow: Block user | `src/components/posts/post-card.tsx` |
| Blocked users filtered from /feed, /c/[slug] | `src/app/feed/page.tsx`, `src/app/c/[slug]/page.tsx` |
| /settings/blocked page (unblock) | `src/app/settings/blocked/page.tsx` |
| `useBlocklist` hook | `src/hooks/use-blocklist.ts` |

---

## Phase 7 — Launch Polish Pack v1 ✅

| რა გაკეთდა | ფაილები |
|---|---|
| Mobile hamburger menu + Sheet drawer (< lg) | `src/components/mobile-drawer.tsx` |
| Navbar compact layout for mobile | `src/components/navbar.tsx` |
| Bottom navigation bar for mobile (< sm) | `src/components/bottom-nav.tsx` |
| PostCard responsive media grid + mobile padding | `src/components/posts/post-card.tsx` |
| main content pb-20 for BottomNav clearance | `src/app/layout.tsx` |
| Toaster position → top-center | `src/app/layout.tsx` |
| "Load more" pagination on /feed and /c/[slug] | `src/app/feed/page.tsx`, `src/app/c/[slug]/page.tsx` |
| SEO: site-wide metadata template | `src/app/layout.tsx` |
| Per-page metadata (static pages) | `src/app/*/layout.tsx` |
| Dynamic metadata (generateMetadata) | `src/app/c/[slug]/layout.tsx`, `src/app/p/[id]/layout.tsx`, `src/app/u/[username]/layout.tsx` |
| Server Supabase client (for metadata) | `src/lib/supabase/server.ts` |
| robots.txt | `public/robots.txt` |
| Sitemap | `src/app/sitemap.ts` |

---

## Phase 8.1 — Explore Circles + Real Onboarding ✅

| რა გაკეთდა | ფაილები |
|---|---|
| /circles/explore page (popular + active this week) | `src/app/circles/explore/page.tsx` |
| Inline Join button on explore cards + optimistic UI | `src/app/circles/explore/page.tsx` |
| Explore link: sidebar, mobile drawer, /circles header | `src/components/layout/left-sidebar.tsx`, `src/components/mobile-drawer.tsx`, `src/app/circles/page.tsx` |
| Right sidebar: real trending circles from DB | `src/components/layout/right-sidebar.tsx` |
| `useTrendingCircles` hook | `src/hooks/use-trending-circles.ts` |
| Right sidebar: real onboarding widget (3 steps) | `src/components/layout/right-sidebar.tsx` |
| `useOnboarding` hook (profile, circle, post checks) | `src/hooks/use-onboarding.ts` |
| Feed empty state → CTA to /circles/explore | `src/app/feed/page.tsx` |

---

## Phase 8.2 — Sharing + Invites ✅

| რა გაკეთდა | ფაილები |
|---|---|
| Share utility (Web Share API / clipboard / prompt) | `src/lib/share.ts` |
| PostCard: "გაზიარება" button (share/copy post link) | `src/components/posts/post-card.tsx` |
| /p/[id]: Share button in reaction bar | `src/app/p/[id]/page.tsx` |
| /c/[slug]: Share button in circle header | `src/app/c/[slug]/page.tsx` |
| /c/[slug]: "მოწვევა" button (public circles) | `src/app/c/[slug]/page.tsx` |
| Invite Dialog (link + copy + native share) | `src/app/c/[slug]/page.tsx` |
| UTM params: ?ref=share, ?ref=invite | `src/lib/share.ts` |

---

## Phase 8.3 — Launch Safety & Ops Pack ✅

| რა გაკეთდა | ფაილები |
|---|---|
| /rules page (Community Rules, Georgian) | `src/app/rules/page.tsx` |
| /privacy page (Privacy Policy, Georgian) | `src/app/privacy/page.tsx` |
| /contact page (Contact info, Georgian) | `src/app/contact/page.tsx` |
| Footer links → real legal pages | `src/components/footer.tsx` |
| Vercel Analytics (privacy-friendly) | `src/app/layout.tsx`, `@vercel/analytics` |
| Admin reports page (/admin/reports) | `src/app/admin/reports/page.tsx` |
| isAdmin() helper (env-based access) | `src/lib/admin.ts` |
| Admin link in navbar dropdown (admin-only) | `src/components/navbar.tsx` |
| NEXT_PUBLIC_ADMIN_USER_IDS env var | `.env.example`, `.env.local` |
| **Vercel deploy დადასტურებული ✅** | admin panel, legal pages, footer — ყველაფერი მუშაობს production-ზე |

---

## Phase 8.4 — Admin Server-side Hardening ✅

| რა გაკეთდა | ფაილები |
|---|---|
| `@supabase/ssr` ინტეგრაცია (cookie-based auth) | `package.json`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts` |
| Supabase session middleware | `src/middleware.ts` |
| Server-only admin check (ADMIN_USER_IDS) | `src/lib/admin-server.ts` |
| Server-side admin gate layout | `src/app/admin/layout.tsx` |
| Admin reports → server component | `src/app/admin/reports/page.tsx` |
| Interactive reports list (client) | `src/components/admin/reports-list.tsx` |
| .env.example: ADMIN_USER_IDS + SUPABASE_SERVICE_ROLE_KEY | `.env.example` |
| NEXT_PUBLIC_ADMIN_USER_IDS deprecated (UI only) | `src/lib/admin.ts` (unchanged, cosmetic) |

**რატომ**: `NEXT_PUBLIC_ADMIN_USER_IDS` client-ზე ექსპოზდებოდა — ნებისმიერ ბრაუზერში ჩანდა. ახლა admin ვერიფიკაცია სრულად server-side-ია (`ADMIN_USER_IDS` + `SUPABASE_SERVICE_ROLE_KEY`), client-ს არ აქვს წვდომა.

---

## Phase 11.1 — Dark Mode Toggle ✅

| რა გაკეთდა | ფაილები |
|---|---|
| ThemeToggle component (icon + full variants) | `src/components/theme-toggle.tsx` |
| Navbar: icon toggle + dropdown menu item | `src/components/navbar.tsx` |
| ThemeProvider: enableSystem | `src/components/providers.tsx` |

**UX**: Navbar-ში მზე/მთვარის icon. User dropdown-ში "მუქი რეჟიმი" / "ნათელი რეჟიმი" ტექსტით. System preference-ს ავტომატურად ცნობს.

---

## Phase 10 — Profile ✅

| რა გაკეთდა | ფაილები |
|---|---|
| Public Profile: header + accent strip + stats | `src/app/u/[username]/page.tsx` |
| Real posts list + "მეტის ჩატვირთვა" pagination | `src/app/u/[username]/page.tsx` |
| User circles section (public only) | `src/app/u/[username]/page.tsx` |
| Stats row: posts, circles, reactions | `src/app/u/[username]/page.tsx` |
| Self action: "პროფილის რედაქტირება" | `src/app/u/[username]/page.tsx` |
| Visitor actions: Share + Block/Unblock | `src/app/u/[username]/page.tsx` |
| Blocked user → "კონტენტი მიუწვდომელია" | `src/app/u/[username]/page.tsx` |
| Email display (read-only) | `src/app/settings/profile/page.tsx` |
| Account deletion (მკაცრი confirm) | `src/app/settings/profile/page.tsx` |
| Account delete API route | `src/app/api/account/delete/route.ts` |
| Report user | ⬜ Phase 11 (DB enum მხოლოდ 'post','comment') |

**UX**: ავტორი ხედავს „რედაქტირება", სხვა ხედავს „გაზიარება"+„დაბლოკვა". Blocked user-ის პროფილზე პოსტები/წრეები დამალულია. ანგარიშის წაშლა მოითხოვს „წაშლა" ტექსტის ჩაწერას.

---

## Phase 9.1 — Post Edit/Delete ✅

| რა გაკეთდა | ფაილები |
|---|---|
| PostCard: author overflow menu (Edit/Delete) | `src/components/posts/post-card.tsx` |
| PostEditDialog (reusable edit modal) | `src/components/posts/post-edit-dialog.tsx` |
| Delete confirm dialog + toast | `src/components/posts/post-card.tsx` |
| /p/[id]: author Edit/Delete actions | `src/app/p/[id]/page.tsx` |
| /feed: onDeleted/onEdited callbacks | `src/app/feed/page.tsx` |
| /c/[slug]: onDeleted/onEdited callbacks | `src/app/c/[slug]/page.tsx` |

**UX**: ავტორი ხედავს „რედაქტირება" + „წაშლა"; სხვა მომხმარებელი ხედავს „დაარეპორტე" + „დაბლოკე". წაშლა მოითხოვს დადასტურებას (Dialog). რედაქტირება ხსნის მოდალს content + type ცვლილებით. Media editing v1-ში არ არის.

---

## Database Migrations

| ფაილი | აღწერა | Supabase-ში გაშვებული? |
|---|---|:---:|
| `database/0001_init.sql` | Tables: profiles, circles, circle_members, posts, comments, reactions, reports, blocklist, notifications + profile trigger | ✅ |
| `database/0002_rls.sql` | RLS policies, helper functions, notification triggers | ✅ |
| `database/0003_profile_metadata_patch.sql` | Profile trigger patch (display_name from metadata) | ✅ |
| `database/0004_storage_avatars.sql` | Avatars bucket policies (bucket must be created manually, Public ON) | ✅ |
| `database/0005_storage_posts.sql` | Posts media bucket policies (bucket must be created manually, Public ON) | ✅ |
| `database/0006_reports_select_policy.sql` | Reports SELECT policy + `get_admin_reports` RPC function | ✅ |

---

## shadcn/ui კომპონენტები (დაინსტალირებული)

Button, Card, Input, Label, Avatar, Badge, Dialog, DropdownMenu, Command, Skeleton, Switch, Textarea, Sheet, Sonner

---

## Phase 11.2 — Search Results Page ✅ (2026-02-22)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `src/app/search/page.tsx` | სრული ძებნის გვერდი — წრეები (name/slug/description ilike) + პოსტები (content ilike) | ✅ |
| `src/app/search/layout.tsx` | SEO metadata | ✅ |
| `src/components/navbar.tsx` | Search bar → `/search` (ნაცვლად command palette-ის) | ✅ |
| `src/components/command-palette.tsx` | "ძებნა" item-ის დამატება | ✅ |

**UX:**
- Circle results: identity dot, name, description, member count
- Post results: PostCard + likes + edit/delete + "მეტის ჩატვირთვა" (page size 20)
- Empty state: search prompt icon
- Mobile search icon → `/search`

---

## რა არ არის ჯერ გაკეთებული (Phase 11+)

- [x] Dark mode toggle UI
- [x] Search results page
- [ ] Google OAuth login
- [ ] Messages / chat system
- [ ] Performance optimization (lazy loading, bundle analysis)
- [ ] Image optimization (next/image for user media)
- [ ] Video uploads
- [ ] Realtime subscriptions

---

# END
