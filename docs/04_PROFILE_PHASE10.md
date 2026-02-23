# Khronika — Phase 10: Profile Feature Plan

> შექმნილია: 2026-02-22
> სტატუსი: **დაგეგმილი (Plan)** — კოდი ჯერ არ დაწერილა
> ეს დოკუმენტი არის სრული გეგმა Profile ფუნქციისთვის.

---

## მიმდინარე მდგომარეობა

| კომპონენტი | სტატუსი | რა არის |
|---|---|---|
| `/settings/profile` | არსებობს | ფორმა: avatar, username, display_name, bio. ანგარიშის წაშლა **არ არის**. |
| `/u/[username]` | მინიმალური | ავატარი + სახელი + ბიო + join date. პოსტების სექცია placeholder-ია. |
| DB `profiles` table | არსებობს | id, username, display_name, avatar_url, bio, created_at |
| Friends / Follow | **არ არსებობს** | DB ცხრილი არ არის, კოდი არ არის |

---

## A) Public Profile გაუმჯობესება (`/u/[username]`)

### რა უნდა აჩვენოს

1. **Header**
   - ავატარი (დიდი, ring-2 ring-seal/10)
   - display_name + @username
   - ბიო (whitespace-pre-wrap)
   - შეერთების თარიღი
   - Accent strip (circle-style მაგვარი, username-based deterministic)

2. **Stats row** (3 მთვლელი)
   - პოსტების რაოდენობა: `SELECT count(*) FROM posts WHERE author_id = ?`
   - წრეები: `SELECT count(*) FROM circle_members WHERE user_id = ?`
     (სურვილისამებრ მხოლოდ public circles — join circles on is_private = false)
   - მიღებული რეაქციები: `SELECT count(*) FROM reactions JOIN posts ON reactions.post_id = posts.id WHERE posts.author_id = ?`
     - **შენიშვნა**: ეს query შეიძლება ნელი იყოს. v1-ში თუ ნელა გამოვა → placeholder "მალე" ან cache-ით.

3. **User-ის პოსტები** (რეალური data)
   - Latest posts by author, ordered created_at desc
   - **"მეტის ჩატვირთვა"** pagination (page size 20) — იგივე UX რაც /feed და /c/[slug]
   - Reuse `PostCard` component
   - Blocklist: თუ viewer-მა ეს user დაბლოკა → პოსტები/კონტენტი **არ ჩანს**

4. **User-ის წრეები** (tab ან section)
   - List public circles the user belongs to
   - Circle card: accent dot + name + member count
   - Private circles არ ჩანს

5. **Visitor actions** (logged in, not self)
   - "გაზიარება" (Share profile — Web Share API / clipboard)
   - "დაბლოკე" (blocklist insert → toast, same as PostCard logic)
   - "დაარეპორტე" (reports insert with target_type = 'user')
   - **თუ viewer-მა user დაბლოკა** → პროფილზე პოსტები/წრეები არ ჩანს, მხოლოდ header + "ეს მომხმარებელი დაბლოკილია"

6. **Self actions** (logged in user viewing own profile)
   - "პროფილის რედაქტირება" button → `/settings/profile`
   - Edit/Delete on own posts (already works via PostCard)

### Key files
- `src/app/u/[username]/page.tsx` — major rewrite
- `src/components/posts/post-card.tsx` — reuse (no changes needed)
- Possibly new: `src/hooks/use-user-stats.ts` (lightweight stats hook)

---

## B) Profile Settings გაუმჯობესება (`/settings/profile`)

### რა უნდა დაემატოს

1. **Email display** (read-only)
   - ამჟამინდელი auth email ჩანს ინფორმაციისთვის
   - Edit-ს არ საჭიროებს v1-ში

2. **ანგარიშის წაშლა** (Account Deletion)
   - ცალკე section ფორმის ქვემოთ
   - "ანგარიშის წაშლა" button (destructive variant)
   - **მკაცრი confirm flow**:
     1. Dialog იხსნება warning-ით
     2. User-მა უნდა ჩაწეროს "წაშლა" (ან "DELETE") text input-ში
     3. მხოლოდ მაშინ ხდება confirm button ხელმისაწვდომი
   - რას შლის:
     - Profile data (anonymize or delete)
     - Posts, comments, reactions (cascade)
     - Circle memberships
     - Auth account
   - Implementation:
     - API route: `src/app/api/account/delete/route.ts`
     - Uses `SUPABASE_SERVICE_ROLE_KEY` (server-only) for `auth.admin.deleteUser()`
     - JWT token header-ით ვერიფიკაცია (იგივე pattern რაც admin reports)
     - On success: sign out + redirect to "/"
   - **docs-ში Manual steps**: `SUPABASE_SERVICE_ROLE_KEY` აუცილებელი env var

3. **UX გაუმჯობესება**
   - Success/error → sonner toasts (ნაწილობრივ უკვე არის inline alerts)
   - Loading states სრულად

### Key files
- `src/app/settings/profile/page.tsx` — extend
- `src/app/api/account/delete/route.ts` — new API route
- `src/lib/admin-server.ts` — reuse for service role client pattern

---

## C) Profile Completeness (Onboarding tie-in)

Right sidebar-ში უკვე არსებობს onboarding widget (`useOnboarding` hook):
- ✅ პროფილი შევსებულია (username + display_name)
- ✅ 1+ წრეს შეუერთდა
- ✅ 1+ პოსტი დაწერა

პირველი ნაბიჯი უკვე ლინკავს `/settings/profile`-ზე. ეს მუშაობს — მხოლოდ ვერიფიკაცია საჭირო.

---

## D) სამომავლო (Phase 11+, არა ახლა)

| ფუნქცია | აღწერა | DB ცვლილება? |
|---|---|---|
| Follow/Friend სისტემა | `follows` table: follower_id, following_id | **დიახ** |
| Cover image | Profile cover photo upload | profiles table + storage |
| Activity history | Recent activity log | შეიძლება materialized view |
| Badges | Onboarding, active member, circle owner | badges table ან computed |
| Privacy settings | Hide circles/posts from non-members | profiles table columns |
| Social links | Instagram, Facebook, etc. | profiles table jsonb column |

---

## Database

### Phase 10-ში schema ცვლილება არ სჭირდება (A + B)

ყველა data არსებული ცხრილებიდან:
- `profiles` — user info
- `posts` — user's posts (`WHERE author_id = profile.id`)
- `circle_members` + `circles` — user's circles
- `reactions` + `posts` — reactions received

### Account deletion-ისთვის
- `SUPABASE_SERVICE_ROLE_KEY` env var (server-only, უკვე გვაქვს admin-ისთვის)
- `auth.admin.deleteUser()` — cascade delete შეიძლება manual-ად: ჯერ posts/comments/reactions, მერე profile, მერე auth user
- ან soft-delete: `profiles.deleted_at` column + anonymize data + sign out

---

## Design Rules (reminder)

- Background: gold (#F0E2C8), cards: (#F7EDDA), text: (#1C1108)
- Accent: blue (#3B82F6) for buttons, active states
- Borders: muted gold (#D4C4A0)
- Typography: Source Serif 4 headings, Inter body
- All UI text in Georgian
- Sonner toasts for feedback
- Mobile-first: 375px+, no overflow

---

## პრიორიტეტები (impact → effort)

| # | რა | Impact | Effort | შენიშვნა |
|---|---|---|---|---|
| 1 | Public Profile + real posts | 🔴 მაღალი | საშუალო | პროფილი "ცოცხალი" ხდება |
| 2 | Account deletion | 🔴 მაღალი | დაბალი | GDPR/legal compliance |
| 3 | Profile stats | 🟡 საშუალო | დაბალი | გვერდი სრული ხდება |
| 4 | Block/Report on profile | 🟡 საშუალო | დაბალი | უკვე არსებული ლოგიკის reuse |
| 5 | Future items (follow, etc.) | 🟢 დაბალი | მაღალი | Phase 11+ |

---

## Definition of Done

- [ ] `/u/[username]` აჩვენებს real posts (paginated, load more)
- [ ] `/u/[username]` აჩვენებს user-ის public circles
- [ ] `/u/[username]` stats row: posts, circles, reactions
- [ ] Share profile + Block/Report visitor-ისთვის
- [ ] "პროფილის რედაქტირება" button self-ისთვის
- [ ] Blocked user-ის პროფილზე → კონტენტი დამალული
- [ ] `/settings/profile` — email display (read-only)
- [ ] `/settings/profile` — "ანგარიშის წაშლა" მკაცრი confirm-ით
- [ ] Account deletion API route (service role, server-only)
- [ ] Mobile 375px: ყველაფერი usable, no overflow
- [ ] `npm run build` passes
- [ ] Docs updated: CONTEXT.md, PROGRESS.md

---

# END
