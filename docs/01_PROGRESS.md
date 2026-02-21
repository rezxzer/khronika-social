# ქრონიკა — პროგრესის ტრეკერი

> ეს ფაილი აღწერს რა არის უკვე გაკეთებული და რა სტატუსშია.
> ყოველი Phase-ის შემდეგ აქ ვადასტურებთ.

---

## Phase 0 — Setup
**სტატუსი: ✅ დასრულებული**

| რა უნდა | სტატუსი | შენიშვნა |
|---|:---:|---|
| Next.js (App Router) + TypeScript | ✅ | v16.1.6 |
| TailwindCSS v4 | ✅ | @tailwindcss/postcss |
| shadcn/ui | ✅ | new-york style, components.json |
| Supabase env-ები | ✅ | `.env.local` + `.env.example` |
| Basic layout + Navbar | ✅ | max-width 1100px, sticky navbar |
| Landing page (`/`) | ✅ | hero + 3 feature card |

**ფაილები:**
- `src/app/layout.tsx` — Root layout
- `src/app/page.tsx` — Landing
- `src/app/globals.css` — Theme variables (light/dark ready)
- `src/components/navbar.tsx` — Navbar
- `src/lib/utils.ts` — `cn()` helper
- `src/lib/supabase/client.ts` — Supabase client
- `components.json` — shadcn/ui config

---

## Phase 1 — Auth + Profiles
**სტატუსი: ⏳ ნაწილობრივ (Auth მზადაა, Profile edit ჯერ არა)**

| რა უნდა | სტატუსი | შენიშვნა |
|---|:---:|---|
| Login page (`/login`) | ✅ | signInWithPassword, error handling |
| Register page (`/register`) | ✅ | signUp + email confirmation UI |
| `useAuth` hook | ✅ | user, loading, signOut |
| Navbar auth-aware | ✅ | logged in: ფიდი/წრეები/გასვლა; logged out: შესვლა/რეგისტრაცია |
| Feed scaffold (`/feed`) | ✅ | auth guard + empty state |
| Profile auto-create trigger | ✅ | `0001_init.sql` + `0003` patch |
| display_name metadata patch | ⚠️ | `0003_profile_metadata_patch.sql` — SQL Editor-ში გასაშვებია |
| `/settings/profile` edit | ❌ | ჯერ არ არის |
| Avatar upload | ❌ | ჯერ არ არის |

**ფაილები:**
- `src/hooks/use-auth.ts` — Auth state hook
- `src/app/login/page.tsx` — Login form
- `src/app/register/page.tsx` — Register form
- `src/app/feed/page.tsx` — Feed scaffold

---

## Phase 2 — Circles
**სტატუსი: ⏳ UI მზადაა, ტესტირება საჭიროა**

| რა უნდა | სტატუსი | შენიშვნა |
|---|:---:|---|
| Circle list (`/circles`) | ✅ | search + member count + privacy badge |
| Circle create (`/circles/new`) | ✅ | name, slug auto-gen, description, private toggle |
| Circle detail (`/c/[slug]`) | ✅ | Join/Leave + owner badge + private badge |
| Join public circle | ✅ | insert circle_members |
| Leave circle | ✅ | delete circle_members (owner ვერ ტოვებს) |
| Private circle UI | ✅ | "პირადი წრე" badge, join დამალული |

**ფაილები:**
- `src/app/circles/page.tsx` — Circles list
- `src/app/circles/new/page.tsx` — Create circle
- `src/app/c/[slug]/page.tsx` — Circle detail

---

## Phase 3 — Posts
**სტატუსი: ❌ ჯერ არ დაწყებულა**

| რა უნდა | სტატუსი |
|---|:---:|
| PostComposer (story/lesson/invite) | ❌ |
| ტექსტი + ფოტო ატვირთვა | ❌ |
| პოსტები circle page-ზე | ❌ |

---

## Phase 4 — Feed
**სტატუსი: ❌ ჯერ არ დაწყებულა**

| რა უნდა | სტატუსი |
|---|:---:|
| Feed: წევრი წრეების პოსტები | ❌ |
| Pagination / infinite scroll | ❌ |
| Post card (ავტორი, დრო, reactions) | ❌ |

---

## Phase 5 — Comments + Reactions
**სტატუსი: ❌ ჯერ არ დაწყებულა**

| რა უნდა | სტატუსი |
|---|:---:|
| `/p/[id]` post detail | ❌ |
| კომენტარი add/delete | ❌ |
| Reaction toggle | ❌ |

---

## Phase 6 — Notifications + Moderation
**სტატუსი: ❌ ჯერ არ დაწყებულა**

| რა უნდა | სტატუსი |
|---|:---:|
| Notification triggers (DB) | ✅ | `0002_rls.sql`-ში უკვე არის |
| `/notifications` page | ❌ |
| Report + block UI | ❌ |

---

## Database Migrations

| ფაილი | აღწერა | SQL Editor-ში გაშვებული? |
|---|---|:---:|
| `database/0001_init.sql` | ტაბლები, enums, indexes, profile trigger | ⬜ დასადასტურებელი |
| `database/0002_rls.sql` | RLS policies, helper functions, notification triggers | ⬜ დასადასტურებელი |
| `database/0003_profile_metadata_patch.sql` | Profile trigger patch (display_name from metadata) | ⬜ დასადასტურებელი |

---

## shadcn/ui კომპონენტები (დაინსტალირებული)

Button, Card, Input, Label, Badge, Switch, Skeleton, Textarea

---

## შემდეგი ნაბიჯები

1. **დაადასტურე:** SQL migrations გაშვებულია Supabase-ში (0001 → 0002 → 0003)
2. **დაადასტურე:** Register/Login მუშაობს (`npm run dev`)
3. **დაადასტურე:** Circle create/join/leave მუშაობს
4. **შემდეგ:** Phase 1 დასრულება (profile edit + avatar)
5. **შემდეგ:** Phase 3 — Posts
