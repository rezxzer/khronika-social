# ქრონიკა — პროგრესის ტრეკერი (Changelog)

> ყოველი ახალი ფუნქციის დამატებისას აქ ვწერთ.
> ბოლო განახლება: 2026-02-24 (Phase 22 Step 7 — QA/verification/docs closeout completed, partial status)

## Hotfixes — 2026-02-24 ✅

- **Profile page false "not found" after settings update**
  - სიმპტომი: `/settings/profile`-ში განახლების შემდეგ ზოგჯერ `/u/[username]` გვერდზე ჩნდებოდა "მომხმარებელი ვერ მოიძებნა"
  - root cause: `src/app/u/[username]/page.tsx`-ში `notFound` state ერთხელ `true` თუ ხდებოდა, შემდეგ წარმატებულ fetch-ზე ყოველთვის არ ნულდებოდა
  - fix: `fetchProfile()` დასაწყისში და წარმატებულ fetch branch-ში დაემატა `setNotFound(false)`
  - commit: `07c2fee`

- **Mobile-ზე ვიდეოები PostCard-ში არ ჩანდნენ**
  - სიმპტომი: ტელეფონზე feed/card-ში ვიდეო პოსტები ზოგჯერ არ ჩნდებოდა (ფოტოები კი ჩანდა)
  - root cause: `src/components/posts/post-card.tsx`-ში ვიდეო render იყო `opacity-0` სანამ მხოლოდ `onLoadedData` არ მოვიდოდა; mobile browser-ებზე ეს event შეიძლება დაგვიანდეს/არასტაბილური იყოს
  - fix: readiness gate გაფართოვდა — `setVideoReady(true)` დაემატა `onLoadedMetadata` და `onCanPlay`-ზეაც
  - commit: (current push)

## Phase 21 — Video v2 Lite ✅ (Step 1–5 დასრულებულია)

- სტატუსი: Lite scope დასრულებულია (validation + consistency + poster/fallback + playback/error UX + QA/verification/docs)
- შექმნილია docs-first plan: `docs/05_VIDEO_PHASE21.md`
- რეკომენდებული implementation track: Video v2 Lite (validation + metadata consistency + poster strategy + playback polish)
- Video v2 Full Pipeline დაფიქსირდა როგორც შემდეგი არქიტექტურული ვარიანტი (არა ამ ეტაპზე)
- Phase 20 closeout confirmed: push v2 დასრულებულია და deploy-ზე დადასტურებულია
- Step 1 completed: validation rules unification (`post-composer` + `feed-composer`) shared util-ით
- Step 2 completed: media mapping/normalization contract გათანაბრდა feed/circle/profile/search/detail/card paths-ში
- Step 3 completed: poster-first fallback strategy გაძლიერდა `PostCard` + `/p/[id]`-ზე
- Step 4 completed: playback UX polish + graceful error states (loading/ready/error flow) `PostCard` + `/p/[id]`-ზე, Step 3 poster behavior-ის შენარჩუნებით
- Step 5 completed: final QA matrix + regression pass + `npx tsc --noEmit` ✅ + `npm run build` ✅ + docs final sync

## Phase 22 — Video v2 Full Pipeline (Implementation in progress)

- სტატუსი: Step 7 დასრულებულია ✅ (QA/verification/docs closeout), **Phase 22 = partial/blocker**
- blocker reason (single source wording): live external provider callback E2E not yet verified in real traffic
- Lite ✅ დასრულების შემდეგ დაფიქსირდა next scope:
  - async processing pipeline
  - transcoding/compression outputs
  - adaptive playback source strategy
  - job lifecycle + retry/failure handling
- მომზადდა docs-first planning package:
  - architecture options (A/B) + recommendation
  - DB/storage/API ცვლილებების გეგმა (ჯერ migration/code გარეშე)
  - phased rollout + QA matrix + risk/mitigation
- decision locks დაფიქსირდა:
  - Option B არქიტექტურა
  - `video_processing_events` mandatory v1
  - fail default = graceful unavailable; optional original fallback with policy/security checks
  - provider-agnostic foundation first
- მიმდინარე სტატუსი: Step 7 დასრულებულია ✅, Phase 22 ჯამური სტატუსი = **partial/blocker** (live external provider callback E2E not yet verified in real traffic)
- Step 1 completed (DB foundation):
  - ახალი enum: `video_processing_status`
  - ახალი table: `video_assets` (v1 one-asset-per-post, constraints/indexes + updated_at trigger)
  - ახალი table: `video_processing_events` (mandatory v1 observability)
  - RLS skeleton: owner read + guarded insert; no owner update/delete policy
  - migration: `database/0015_video_pipeline_foundation.sql`
  - manual DB sanity verification: **PASSED ✅** (enum/indexes/RLS/policies/trigger confirmed in Supabase)
  - verification note: `pg_policies` query snippets should use `policyname` column in this Supabase environment (not `polname`)
- Step 2 completed (provider-agnostic server contracts):
  - lifecycle/status rules: `src/lib/video-pipeline/status.ts` (`canTransitionStatus`, `isRetryAllowed`)
  - domain/error contracts: `src/lib/video-pipeline/types.ts`
  - API request/response + idempotency/webhook normalization contracts: `src/lib/video-pipeline/contracts.ts`
  - API contract routes:
    - `POST /api/video-assets/create`
    - `GET /api/video-assets/[postId]`
    - `POST /api/video-assets/retry`
  - compatibility preserved with existing `posts.video_url` / `posts.media_kind`
  - intentionally NOT included in Step 2: queue/worker execution, provider signature/webhook integration, UI changes
- Step 3 completed (provider-agnostic orchestration skeleton):
  - queue/dispatch layer: `src/lib/video-pipeline/queue.ts`
  - worker behavior: `src/lib/video-pipeline/worker.ts` (claim/lock, status progression hooks, terminal-fail/retry scheduling helpers, event logging)
  - retry/backoff policy: `src/lib/video-pipeline/retry.ts`
  - create/retry entry hooks updated to call non-blocking orchestration dispatch
  - intentionally NOT included in Step 3: provider adapter/webhook signature, UI changes, feature flags/rollout wiring
- Step 4 completed (provider adapter integration + webhook/callback handling):
  - ახალი adapter boundary: `src/lib/video-pipeline/provider-adapter.ts` (provider submit + signed callback normalize/verify)
  - orchestration hook გაძლიერდა: `src/lib/video-pipeline/worker.ts` ახლა claim-ის შემდეგ provider submit path-ს იძახებს და შესაბამის `video_processing_events`-ს წერს
  - ახალი route: `POST /api/video-assets/webhook` (`src/app/api/video-assets/webhook/route.ts`) callback → internal status mapping-ით და `canTransitionStatus` guard-ით
  - output persistence დაემატა `video_assets`-ში (`manifest/progressive/poster/thumbnail` + metadata fields)
  - idempotency/replay safety: duplicate event-id/nonce გზები non-destructive skip რეჟიმით
  - security: HMAC signature verification (`x-video-signature`), replay window (`x-video-timestamp`) და nonce-based replay protection (`x-video-nonce`)
  - intentionally NOT included in Step 4: UI changes, feature flags/rollout wiring, admin/ops UI
- Step 5 completed (UI lifecycle states integration):
  - new client consumer helper: `src/lib/video-pipeline/client.ts` (`create/status` APIs)
  - composer lifecycle surface added after video publish (non-blocking) in:
    - `src/components/posts/feed-composer.tsx`
    - `src/components/posts/post-composer.tsx`
  - `PostCard` + `/p/[id]` now consume owner asset status and surface lifecycle states:
    - `queued` / `processing` / `retrying` / `failed` / `ready`
  - ready path prefers processed playback (`progressiveUrl`, `posterUrl`/`thumbnailUrl`) როცა ხელმისაწვდომია
  - legacy fallback (`posts.video_url`) intentionally preserved for compatibility
  - intentionally NOT included in Step 5: provider/webhook security changes, queue/worker logic changes, DB schema changes
- Step 6 completed (server-focused retries/failure/ops polish):
  - retry policy hardening: jittered backoff + retry ETA helper (`src/lib/video-pipeline/retry.ts`)
  - orchestration traceability hardening (`src/lib/video-pipeline/worker.ts`):
    - dispatch correlation (`dispatchId`) propagated into event payloads
    - claim now increments `attempt_count` on processing claim
    - terminal failure / auto-retry events standardized with context payloads
    - auto-retry exhausted path now emits explicit event
  - retry route edge-case hardening (`src/app/api/video-assets/retry/route.ts`):
    - optimistic update now status-conditioned
    - concurrent transition conflict returns `409 INVALID_STATE` with details
    - conflict event logged (`retry_conflict`)
  - minimal ops visibility surface added:
    - `GET /api/video-assets/[postId]/events` (owner-only status + recent event log, server/db oriented)
  - intentionally NOT included in Step 6: UI redesign, provider signature model rewrite, DB schema expansion, feature flags/admin UI
- Step 7 completed (QA / verification / docs closeout gate):
  - QA closeout matrix executed for create/processing/ready-failed/retry/events-visibility + Step 5 UI lifecycle regression
  - minimal bug fix applied:
    - retry path attempt counter double-increment issue corrected in `src/app/api/video-assets/retry/route.ts`
  - verification gates:
    - `npx tsc --noEmit` ✅
    - `npm run build` ✅
  - final status truth-alignment:
    - Phase 22 **not marked complete**
    - marked as **partial/blocker** until live external provider callback E2E is verified in real traffic
- Blocker lift checklist (Phase 22 complete mark-მდე):
  - real provider callback success path დადასტურდეს
  - real provider callback failed path დადასტურდეს
  - retry path დადასტურდეს end-to-end
  - events visibility trace დადასტურდეს (`/api/video-assets/[postId]/events` + `video_processing_events`)
  - security checks runtime-ზე დადასტურდეს (signature/replay/duplicate handling)
- Required evidence artifacts:
  - timestamped callback request/response logs
  - `video_processing_events` sample rows (success/fail/retry/security)
  - request identifiers (`providerJobId`, `providerRequestId`, optional provider event id)
  - მოკლე runtime screenshots/captures (high-level proof)
- Separate mini-scope update — Duplicate Video Prevention (exact duplicate, same owner):
  - Step 1 ✅ DB foundation: `database/0016_video_assets_source_hash.sql` (`source_file_sha256` + owner/hash unique partial index)
  - Step 2 ✅ server enforcement: create/register path now validates hash and maps duplicates/races to `DUPLICATE_VIDEO`
  - Step 3 ✅ composer wiring: client SHA-256 precheck in feed/post composers + pre-publish duplicate block warning
  - note: Phase 22 status wording unchanged (still partial/blocker; separate track)

## Phase 20 — Push Notifications v2 ✅

- სტატუსი: დასრულებულია
- Pre-sync: scope დამტკიცებულია მხოლოდ server layer-ზე — generic/type-aware push delivery (reaction/comment/follow), backward compatibility `/api/push/send` messages flow-სთან
- Post-sync (Step 1): დაემატა shared server helper `src/lib/push/server.ts` (payload builder, recipient resolver, subscription delivery, 404/410 deactivate)
- Post-sync (Step 1): `/api/push/send` გაფართოვდა backward-compatible რეჟიმში — ძველი `{ conversationId }` message flow უცვლელად მუშაობს და დაემატა generic/type-aware request მხარდაჭერა (`recipientId` + `type` + optional `link/title/body`)
- Post-sync (Step 1): response სტრუქტურა გახდა მკაფიო (`ok/sent/attempted/deactivated/skipped/mode` ან error `code`)
- ამ ნაბიჯში client trigger binding არ შედის (Step 2-ში დაიბმება)
- Pre-sync (Step 2): იწყება client fire-and-forget trigger bindings (`reaction like-add`, `comment create`, `follow add`) + `public/sw.js` click routing polish (`data.link` first, legacy message fallback)
- Post-sync (Step 2): დაემატა shared client helper `src/lib/push/client.ts` — fire-and-forget push call + dev-only debug logging (`console.debug`)
- Post-sync (Step 2): trigger bindings დაემატა წარმატებულ action-ებზე:
  - `useReactions`: მხოლოდ like-add insert success-ზე (`unlike` არ აგზავნის)
  - `/p/[id]`: comment insert success + reaction like-add success
  - `useFollow`: მხოლოდ follow-add success-ზე (`unfollow` არ აგზავნის)
- Post-sync (Step 2): self-target guard დაცულია client layer-შიც (`actor === recipient` skip), push failure არ აჩერებს მთავარ UX flow-ს
- Post-sync (Step 2): `public/sw.js` click routing გაუმჯობესდა — `data.link` პრიორიტეტი, messages legacy `conversationId` fallback, link-ის არარსებობაზე safe fallback `/notifications`, existing tab focus + navigate მხარდაჭერით
- Post-sync (Step 3 QA/Finalization):
  - E2E checked: reaction like-add → push, unlike → no push; comment create → push; follow add → push, unfollow → no push
  - Legacy messages flow checked: chat send კვლავ იძახებს `/api/push/send` (conversation-based flow intact)
  - Verification: `npx tsc --noEmit` ✅, `npm run build` ✅
  - Build notes: Next.js workspace root warning (multiple lockfiles), middleware deprecation warning (proxy migration note)
- v2 out-of-scope (intentionally არაა დამატებული): per-type preferences, batching/digest, quiet hours, ახალი notification კატეგორიები

## Phase 10.2 — Settings Final Polish + Account Deletion ✅

- სტატუსი: დასრულებულია
- `/settings/profile`: email სექცია მკაფიო read-only disabled input-ით (mobile-friendly)
- Account deletion dialog: typed confirm სტანდარტი `DELETE`, confirm button strict disabled-state-ით
- Delete flow: loading + double-submit protection + ქართული toast feedback
- `POST /api/account/delete`: `createAdminClient()` reuse + table-by-table error surfaced response
- დამატებითი cleanup: `push_subscriptions` წაშლა account deletion chain-ში

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
| Visitor actions: Share + Block/Unblock + Report user | `src/app/u/[username]/page.tsx` |
| Blocked user → "კონტენტი მიუწვდომელია" | `src/app/u/[username]/page.tsx` |
| Email display (read-only, disabled input) | `src/app/settings/profile/page.tsx` |
| Account deletion (`DELETE` typed confirm + loading guard) | `src/app/settings/profile/page.tsx` |
| Account delete API route (service-role, step error surfacing) | `src/app/api/account/delete/route.ts` |
| User report enum support | `database/0014_reports_user_target.sql` |

**UX**: ავტორი ხედავს „რედაქტირება", სხვა ხედავს „გაზიარება"+„დაბლოკვა"+„დაარეპორტე". Blocked user-ის პროფილზე პოსტები/წრეები დამალულია. ანგარიშის წაშლა მოითხოვს ზუსტად `DELETE` ტექსტის ჩაწერას.

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
| `database/0007_follows.sql` | Follows table + RLS + notification trigger (follow type) | ✅ |
| `database/0008_messages.sql` | Conversations + messages tables + RLS policies | ✅ |
| `database/0009_comment_replies.sql` | Comments parent_id column (reply threading) | ✅ |
| `database/0010_message_delete_policy.sql` | Messages DELETE RLS policy (sender only) | ✅ |
| `database/0011_messages_replica_identity.sql` | REPLICA IDENTITY FULL on messages | ✅ |
| `database/0012_push_subscriptions.sql` | Push subscriptions table + RLS | ✅ |
| `database/0013_video_posts.sql` | Video post schema + post-videos bucket policies | ✅ |
| `database/0014_reports_user_target.sql` | `report_target_type` enum-ში `user` value-ის დამატება | ✅ |
| `database/0015_video_pipeline_foundation.sql` | Phase 22 Step 1: `video_processing_status` + `video_assets` + `video_processing_events` + RLS skeleton | ✅ |

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

## Phase 12 — Follow System ✅ (2026-02-22)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `database/0007_follows.sql` | follows table + RLS + notification trigger (follow type) | ✅ |
| `src/hooks/use-follow.ts` | Follow/unfollow toggle + follower/following counts hook | ✅ |
| `src/app/u/[username]/page.tsx` | Follow button + 5-stat row (followers, following, posts, circles, reactions) | ✅ |
| `src/app/u/[username]/followers/page.tsx` | Followers list page with pagination | ✅ |
| `src/app/u/[username]/following/page.tsx` | Following list page with pagination | ✅ |
| `src/app/notifications/page.tsx` | 'follow' notification type support (icon, text, link to profile) | ✅ |
| `src/app/api/account/delete/route.ts` | follows cleanup added to cascade deletion | ✅ |

**DB ცვლილებები:**
- ახალი ტაბულა: `follows` (follower_id, following_id, created_at, PK composite, no_self_follow constraint)
- `notification_type` enum: 'follow' value added
- Trigger: `on_follow_create_notify` — auto-creates notification on follow

---

## Phase 13.1 — Google OAuth ✅ (2026-02-22)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `src/app/login/page.tsx` | Google OAuth ღილაკი + divider "ან" | ✅ |
| `src/app/register/page.tsx` | Google OAuth ღილაკი + divider "ან" | ✅ |
| `src/app/auth/callback/page.tsx` | OAuth callback — client PKCE code → session exchange | ✅ |

**Fix (2026-02-22):** callback გადაკეთდა `route.ts` → `page.tsx` client component. Server-side route handler PKCE verifier-ს ვერ ხედავდა. ახლა browser Supabase client-ით ხდება `exchangeCodeForSession` + debug logging + sonner toasts.

**Manual setup საჭიროა:**
- Google Cloud Console: OAuth 2.0 Client ID (Web)
- Supabase Dashboard → Auth → Providers → Google → Enable + paste credentials
- Redirect URI: `https://<project>.supabase.co/auth/v1/callback`
- Supabase Dashboard → Auth → URL Configuration → add `https://your-domain/auth/callback`

---

## Phase 14 — Direct Messages ✅ (2026-02-22)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `database/0008_messages.sql` | conversations + messages tables, RLS policies | ✅ |
| `src/hooks/use-conversations.ts` | Conversation list + unread count (30s polling) | ✅ |
| `src/hooks/use-messages.ts` | Chat messages + send + mark read (5s polling) | ✅ |
| `src/app/messages/layout.tsx` | SEO metadata | ✅ |
| `src/app/messages/page.tsx` | Inbox — conversation list, unread badges, time ago | ✅ |
| `src/app/messages/[id]/page.tsx` | Chat — message bubbles, date separators, auto-scroll | ✅ |
| `src/app/u/[username]/page.tsx` | "მესიჯი" button — creates/finds conversation | ✅ |
| `src/components/navbar.tsx` | Messages icon → /messages with unread badge | ✅ |
| `src/components/layout/left-sidebar.tsx` | Messages nav link with unread badge | ✅ |
| `src/app/api/account/delete/route.ts` | messages + conversations cascade cleanup | ✅ |

**DB ცვლილებები:**
- `conversations` (participant_1, participant_2, last_message_at, unique pair, no self-chat)
- `messages` (conversation_id, sender_id, content, is_read, created_at)
- RLS: only participants can select/insert/update

---

## Phase 15.1 — Realtime Messages ✅ (2026-02-22)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `src/hooks/use-messages.ts` | Supabase Broadcast for send/delete (replaced postgres_changes) | ✅ |
| `src/hooks/use-conversations.ts` | Realtime on conversations + messages + 10s polling fallback | ✅ |
| `src/components/bottom-nav.tsx` | "მესიჯები" tab + unread badge (replaced "შექმნა") | ✅ |

**UX ცვლილებები:**
- ჩატში მესიჯები მყისიერად ჩნდება (polling-ის ნაცვლად Realtime)
- Inbox ავტომატურად განახლდება ახალი მესიჯისას
- Unread badge ავტომატურად განახლდება
- მობილურ bottom nav-ზე "მესიჯები" ტაბი დაემატა

**Manual Supabase Steps:**
- Supabase Dashboard → Database → Replication → Enable Realtime on `messages` and `conversations` tables

---

## Phase 16 — Realtime Notifications ✅ (2026-02-22)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `src/hooks/use-notifications.ts` | Realtime INSERT (count +1) + UPDATE (refetch) subscriptions | ✅ |
| `src/app/notifications/page.tsx` | Realtime INSERT → auto-refetch + `refreshBadge()` on mark-as-read | ✅ |

**UX ცვლილებები:**
- ახალი comment/reaction/follow notification-ზე navbar badge მყისიერად იზრდება
- `/notifications` გვერდზე ახალი notification ავტომატურად ჩნდება (page refresh-ის გარეშე)
- mark-as-read / mark-all-as-read: badge მყისიერად სინქრონიზდება

**Manual Supabase Steps:**
- Supabase Dashboard → Database → Replication → Enable Realtime on `notifications` table

---

## Phase 16.1 — Comment Replies ✅ (2026-02-23)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `database/0009_comment_replies.sql` | parent_id column + index on comments | ✅ |
| `src/app/p/[id]/page.tsx` | Reply button, reply indicator, reply-to label, non-member prompt | ✅ |

**ცვლილებები:**
- `comments` ცხრილში `parent_id` სვეტი (self-referencing FK, nullable, cascade delete)
- თითოეულ კომენტარზე "პასუხი" ღილაკი (მხოლოდ წრის წევრებისთვის)
- Input-ის ზემოთ "**username**-ს პასუხობ" indicator + X ღილაკი გასაუქმებლად
- Reply კომენტარებზე "↩ username-ს პასუხობს" label
- **RLS fix**: არაწევრებს კომენტარის ფორმის ნაცვლად "კომენტარის დასაწერად შეუერთდი წრეს" ჩანს
- Membership check: `circle_members` query `fetchPost`-ში

---

## Phase 16.2 — Messaging Polish ✅ (2026-02-23)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `database/0010_message_delete_policy.sql` | Messages DELETE RLS policy (sender only) | ✅ |
| `database/0011_messages_replica_identity.sql` | REPLICA IDENTITY FULL on messages | ✅ |
| `src/hooks/use-messages.ts` | Broadcast send/delete, optimistic UI, deleteMessage | ✅ |
| `src/hooks/use-conversations.ts` | Unread badge: 10s polling fallback + DELETE subscription | ✅ |
| `src/app/messages/[id]/page.tsx` | Delete UI: hover trash + confirmation | ✅ |

**ცვლილებები:**
- **მესიჯის წაშლა**: `messages_delete_sender` RLS policy — მხოლოდ გამგზავნი წაშლის საკუთარს
- **ოპტიმისტური გაგზავნა**: მესიჯი მყისიერად ჩანს, server-ის შემდეგ ნამდვილი ID-ით ჩანაცვლდება
- **Supabase Broadcast (pub/sub)**: postgres_changes-ს ჩაანაცვლა (RLS subquery-სთან არასანდო იყო)
  - `new_message` event: გამგზავნი broadcasts → მიმღებს მყისიერად ეჩვენება
  - `message_deleted` event: გამგზავნი broadcasts → მიმღებს მყისიერად ქრება
- **Unread badge**: 10-წამიანი polling fallback + DELETE event subscription
- **REPLICA IDENTITY FULL**: messages table-ზე (DELETE events-ში ყველა სვეტი)
- **Chat UI**: hover-ზე trash icon საკუთარ მესიჯებზე + "წაშლა / არა" confirmation

**კონფიდენციალურობა (RLS summary):**
- `messages_select_participant`: მხოლოდ მონაწილეები კითხულობენ
- `messages_insert_sender`: მხოლოდ მონაწილე წერს
- `messages_update_read`: მხოლოდ მიმღები ნიშნავს წაკითხულად
- `messages_delete_sender`: მხოლოდ გამგზავნი წაშლის

---

## Phase 17.1 — Feed Algorithm ✅ (2026-02-23)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `src/app/feed/page.tsx` | 3-tab feed: circles / following / trending | ✅ |

**ცვლილებები:**
- **3-tab pill toggle**: „ჩემი წრეები" (CircleDot), „გამოწერილები" (Users), „ტრენდული" (Flame)
- **Circles tab**: არსებული ლოგიკა — joined circles-ის პოსტები, ქრონოლოგიურად
- **Following tab**: `follows` table → `following_ids` → `posts.author_id in(...)` — გამოწერილი მომხმარებლების პოსტები
- **Trending tab**: ბოლო 7 დღის პოსტები reactions count-ით (desc), tie-breaker: created_at desc
  - Trending query: reactions table → post_id group count → sorted → paginated fetch
  - Fallback: თუ reactions არ არის, ქრონოლოგიური ბოლო 7 დღის პოსტები
- **Blocklist filter**: `blockedIds` ფილტრი ყველა tab-ზე
- **Dedup**: `Set<post.id>` — დუბლიკატები ფილტრდება append-ისას
- **Empty states**: ყველა tab-ს აქვს ქართული empty state + CTA (circles → explore, following → search)
- **Pagination**: "მეტის ჩატვირთვა" ყველა tab-ზე (PAGE_SIZE=20)
- **Mobile**: pill tabs horizontally scrollable, compact design

---

## Phase 17.2 — Image Optimization ✅ (2026-02-23)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `next.config.ts` | `images.remotePatterns` — Supabase Storage domain | ✅ |
| `src/components/posts/post-card.tsx` | media grid `<img>` → `next/image` (fill, sizes, lazy) | ✅ |
| `src/app/p/[id]/page.tsx` | post detail media `<img>` → `next/image` (responsive sizes) | ✅ |

**დეტალები:**
- `remotePatterns`: `https://qojrzjonlsynzgqpqsbj.supabase.co/storage/v1/object/public/**`
- PostCard: `fill` layout, `sizes="(max-width: 640px) 100vw, 33vw"`, `aspect-[4/3]`
- Post detail: dynamic `sizes` (1-column: `100vw/672px`, 2-column: `50vw/336px`), `aspect-[4/3]`
- Georgian alt: `პოსტის ფოტო 1`, `პოსტის ფოტო 2`, etc.
- ავტომატური lazy loading, WebP/AVIF conversion, responsive srcset — Vercel Image Optimization
- DB ცვლილებები: არ სჭირდება
- Avatar-ები (`shadcn/ui Avatar`) უკვე `<img>` ტეგით მუშაობს `AvatarImage`-ის მეშვეობით — ბრაუზერის lazy loading-ით, ცვლილება არ სჭირდება (პატარა ზომა, cache-friendly)

---

## Phase 17.3 — Performance Optimization ✅ (2026-02-23)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `src/components/page-transition.tsx` | `framer-motion` → CSS `@keyframes` animation (~30KB removed) | ✅ |
| `src/components/navbar.tsx` | Dynamic import: `CommandPalette`, `MobileDrawer` (`next/dynamic`, `ssr: false`) | ✅ |
| `src/components/posts/post-card.tsx` | `React.memo` + dynamic import `PostEditDialog` | ✅ |
| `src/app/feed/page.tsx` | `useMemo` visiblePosts, static `EMPTY_STATES` outside component | ✅ |
| `src/app/feed/loading.tsx` | Server-side skeleton (tab pills + post cards) | ✅ |
| `src/app/notifications/loading.tsx` | Server-side skeleton (header + notification rows) | ✅ |
| `src/app/messages/loading.tsx` | Server-side skeleton (conversation list) | ✅ |
| `src/app/messages/[id]/loading.tsx` | Server-side skeleton (chat bubbles + input) | ✅ |
| `package.json` | Removed `framer-motion` dependency | ✅ |

**დეტალები:**
- **Bundle reduction**: `framer-motion` (~30KB gzipped) წაშლილია — მხოლოდ `page-transition.tsx`-ში გამოიყენებოდა, CSS animation-ით ჩანაცვლდა
- **Code splitting**: `CommandPalette` (cmdk dialog), `MobileDrawer` (Sheet), `PostEditDialog` — ყველა lazy-loaded `next/dynamic`-ით, initial bundle-ში აღარ შედის
- **Re-render prevention**: `PostCard` wrapped in `React.memo` — ლისტში ახალი პოსტის ჩატვირთვისას ძველი card-ები აღარ re-render-დება
- **Memoization**: `visiblePosts` filter `useMemo`-ით — ყოველ render-ზე არ გაეშვება `.filter()`
- **Static hoisting**: `EMPTY_STATES` object გატანილია component-ის გარეთ module-level-ზე
- **Server skeletons**: 4 `loading.tsx` ფაილი — JS ჩატვირთვამდე ბრაუზერი skeleton-ს აჩვენებს (server-streamed HTML)
- **`prefers-reduced-motion` respected**: CSS animation duration 0.01ms in reduced-motion mode (already existed)
- DB ცვლილებები: არ სჭირდება
- UI/UX ცვლილებები: არ არის

---

## Phase 17.4 — Typing Indicator ✅ (2026-02-23)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `src/hooks/use-typing-indicator.ts` | Supabase Presence hook — track/untrack, throttle, auto-clear | ✅ |
| `src/app/messages/[id]/page.tsx` | Hook integration + "წერს..." animated UI | ✅ |

**დეტალები:**
- **Presence channel**: `typing:{conversationId}`, key = `currentUserId`
- **Throttle**: max 1 `track()` call per 2 seconds (prevents flood on fast typing)
- **Auto-clear**: 3-second inactivity timeout → `untrack()` (indicator disappears)
- **Send/empty clears**: მესიჯის გაგზავნა ან input-ის გასუფთავება → `untrack()` დაუყოვნებლივ
- **Self-filter**: Presence state-ში მხოლოდ სხვა user-ის `typing: true` ჩანს
- **UI**: animated dots (3 bounce) + "X წერს..." text, messages-ის ქვემოთ, input-ის ზემოთ
- **Cleanup**: unmount-ზე channel remove + timeout clear
- DB ცვლილებები: არ სჭირდება
- Manual Supabase steps: არ სჭირდება (Presence built-in)

---

## Phase 18.1 — Push Notifications (v1, messages-only) ✅ (2026-02-24)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `database/0012_push_subscriptions.sql` | `push_subscriptions` table + RLS (own subs only) | ✅ |
| `public/sw.js` | Service Worker: push event → showNotification, click → open chat | ✅ |
| `src/hooks/use-web-push.ts` | Subscribe/unsubscribe hook, permission check, SW registration | ✅ |
| `src/app/api/push/send/route.ts` | Server-side sending: Bearer auth, `web-push` library, expired cleanup | ✅ |
| `src/app/settings/profile/page.tsx` | Push toggle Card with Switch component | ✅ |
| `src/hooks/use-messages.ts` | Fire-and-forget POST to `/api/push/send` after message send | ✅ |
| `package.json` | Added `web-push` + `@types/web-push` | ✅ |

**არქიტექტურა:**
- **Native Web Push API + VAPID** (არა FCM) — zero vendor lock-in, no heavy SDK
- **Service Worker** (`public/sw.js`): `push` event → `showNotification()`, `notificationclick` → open/focus `/messages/{conversationId}`
- **`useWebPush` hook**: state machine (`unsupported` → `default` → `denied` | `granted` → `subscribed`)
- **API route** `/api/push/send`: Bearer token auth → verify sender → find recipient → query `push_subscriptions` → `webpush.sendNotification()` → cleanup expired (410 Gone)
- **Trigger**: `useMessages.sendMessage()` → fire-and-forget fetch after successful DB insert + broadcast
- **Settings UI**: Card with Switch toggle — opt-in only, no auto-request
- **Notification**: `{ title: senderDisplayName, body: "ახალი პირადი მესიჯი", data: { conversationId } }`
- **RLS**: users manage only own subscriptions (SELECT/INSERT/UPDATE/DELETE)

**Manual steps:**
1. `npx web-push generate-vapid-keys` → generate VAPID key pair
2. `.env.local`-ში დამატება: `NEXT_PUBLIC_VAPID_PUBLIC_KEY=...`, `VAPID_PRIVATE_KEY=...`
3. (optional) `VAPID_SUBJECT=mailto:admin@khronika.ge`
4. Supabase SQL Editor-ში: `database/0012_push_subscriptions.sql` გაშვება

---

## Phase 19.1 — Video Uploads (v1) ✅ (2026-02-24)

| ფაილი | აღწერა | სტატუსი |
|---|---|---|
| `database/0013_video_posts.sql` | `posts.media_kind` + `posts.video_url`, `post-videos` bucket + RLS | ✅ |
| `src/components/posts/post-composer.tsx` | Circle post composer: video upload, validation, progress bar | ✅ |
| `src/components/posts/feed-composer.tsx` | Feed composer: video upload, validation, progress bar | ✅ |
| `src/components/posts/post-card.tsx` | Video preview player in card (`preload=\"metadata\"`) | ✅ |
| `src/app/p/[id]/page.tsx` | Full video player controls on detail page | ✅ |
| `src/components/posts/post-edit-dialog.tsx` | Video preview support in edit dialog | ✅ |
| `src/app/feed/page.tsx` | `PostData` mapping: `media_kind`/`video_url` fallback | ✅ |
| `src/app/c/[slug]/page.tsx` | `PostData` mapping: `media_kind`/`video_url` fallback | ✅ |
| `src/app/u/[username]/page.tsx` | `PostData` mapping: `media_kind`/`video_url` fallback | ✅ |
| `src/app/search/page.tsx` | `PostData` mapping: `media_kind`/`video_url` fallback | ✅ |

**არქიტექტურა:**
- **Media model**: `posts.media_kind` (`none`/`image`/`video`) + `posts.video_url` (single video)
- **v1 წესები**: ერთი პოსტი არის ან images-only ან video-only (mix disabled in composer)
- **Validation**: მხოლოდ `video/mp4` და `video/webm`, მაქსიმუმ 50MB
- **Storage**: `post-videos` public bucket + authenticated upload/delete policies
- **Playback performance**: `<video preload=\"metadata\" playsInline controls>` (no auto-download heavy payload)
- **UX**: upload progress bar + ქართულად toast/inline შეცდომები
- **Migration fix**: `0013_video_posts.sql` updated to use `jsonb_array_length(media_urls)` (Supabase `media_urls` არის `jsonb`)
- DB ცვლილებები: საჭიროა (`0013_video_posts.sql`)
- Manual Supabase steps: bucket/policies/columns მიგრაციით

**Polish (step-by-step #1-#5):**
- **#1** PostCard video: forced `aspect-video` removed → natural ratio + `max-h` guard
- **#2** Loading fallback overlay: placeholder + spinner სანამ video მზადაა
- **#3** Duration badge: metadata-based (`m:ss` / `h:mm:ss`), invalid duration-ზე graceful hide
- **#4** Mobile controls polish: badge moved away from control bar, mobile spacing improved
- **#5** Post detail polish: video/content/actions/comments spacing tuned for cleaner rhythm
- **Polish scope**: no new migration, no schema change, no upload-flow change

**Manual steps:**
1. Supabase SQL Editor-ში: `database/0013_video_posts.sql` გაშვება
   - თუ ადრე error იყო `array_length(integer, integer) does not exist`, იგივე SQL თავიდან გაუშვით (fix უკვე შიგნითაა)
2. გადაამოწმე რომ bucket `post-videos` შეიქმნა და public read მუშაობს
3. როლით `authenticated` მომხმარებელი უნდა ახერხებდეს upload/delete ოპერაციებს საკუთარ path-ზე

---

## რა არ არის ჯერ გაკეთებული (Phase 20+)

**დასრულებული:**
- [x] Dark mode toggle UI (Phase 11.1)
- [x] Search results page (Phase 11.2)
- [x] Follow/Friend system (Phase 12)
- [x] Google OAuth login (Phase 13.1 + fix)
- [x] Direct Messages (Phase 14)
- [x] Realtime Messages (Phase 15.1)
- [x] Realtime Notifications (Phase 16)
- [x] Comment Replies (Phase 16.1)
- [x] Messaging Polish — delete, optimistic send, Broadcast sync (Phase 16.2)
- [x] Feed Algorithm — 3-tab feed: circles / following / trending (Phase 17.1)
- [x] Image Optimization — next/image for post media (Phase 17.2)
- [x] Performance Optimization — bundle, lazy loading, memo, skeletons (Phase 17.3)
- [x] Typing Indicator — Realtime Presence "წერს..." (Phase 17.4)
- [x] Push Notifications — Web Push + VAPID, messages-only (Phase 18.1)
- [x] Video Uploads — one video per post (mp4/webm, progress UI) (Phase 19.1)

**შემდეგი:**
- [x] Push notifications v2 (reactions, comments, follows)
- [x] Video v2 Lite (validation, metadata, poster, playback polish)
- [ ] Video v2 Full Pipeline (implementation prep → step-by-step code phase)

---

# END
