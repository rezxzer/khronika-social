# Khronika — Phase 21: Video v2 Plan (Docs-first)

> შექმნილია: 2026-02-24
> სტატუსი: **Video v2 Lite completed (Step 1–5)**

---

## მიზანი

Video v1-დან გადავიდეთ უფრო production-ready მიმართულებით ისე, რომ არსებული სტაბილური flow არ დაირღვეს:
- ატვირთვის წესები/ვალიდაცია გამკაცრდეს
- metadata თანმიმდევრული გახდეს
- poster thumbnail სტრატეგია დავამატოთ
- playback/performance UX გამყარდეს

---

## არსებული baseline (reuse)

- Video v1 upload უკვე მუშაობს (`post-composer.tsx`, `feed-composer.tsx`)
- Video v1 polish დასრულებულია (#1-#5)
- DB schema: `media_urls` არის `jsonb`
- UI უკვე video-awareა:
  - `src/components/posts/post-card.tsx`
  - `src/app/p/[id]/page.tsx`
- Phase 20 push/notification scope დასრულებულია და არ უნდა აირიოს Video v2 scope-ში

---

## ვარიანტების ანალიზი

### 1) Video v2 Lite (რეკომენდებული Phase 21)

**იდეა:** არსებული upload flow დარჩეს, ხარისხი და სტაბილურობა გავაუმჯობესოთ მინიმალური რისკით.

**შედის:**
- stricter validation (mime/container, size policy, optional duration guard)
- metadata consistency (`duration`, dimensions, optional `poster_url` usage policy)
- poster strategy:
  - primary: lightweight frame capture/upload ან upload-time poster field
  - fallback: deterministic placeholder
- progressive playback polish (preload rules, loading/error UX, mobile controls sanity)

**არ შედის:**
- transcoding/compression jobs
- multi-rendition adaptive streaming rollout

**რატომ რეკომენდებულია ახლა:**
- სწრაფად დელივერდება
- დაბალი ოპერაციული რისკი
- არსებული ინფრასტრუქტურის მაქსიმალური reuse

---

### 2) Video v2 Full Pipeline (შემდეგი ეტაპი)

**იდეა:** სრული media pipeline ვიდეოებისთვის.

**შედის:**
- background transcoding/compression workers
- multiple renditions (e.g. 360p/720p/1080p)
- adaptive streaming (HLS-like delivery)
- asset versioning/storage path strategy
- job state tracking architecture

**რისკი/ღირებულება:**
- მაღალი engineering/ops complexity
- infrastructure + monitoring მოთხოვნები
- მეტი rollout რისკი

---

## Phase 21 რეკომენდებული exact scope

**Phase 21 = Video v2 Lite მხოლოდ.**

1. Validation hardening
2. Metadata consistency contract
3. Poster strategy (primary + fallback)
4. Playback UX polish
5. Manual QA matrix + docs sync

---

## DB / API / Storage ცვლილებები (Lite)

### DB
- Option A (preferred if needed): მცირე დამატება metadata-სთვის (მაგ. `video_duration_sec`, `video_poster_url`)
- Option B: schema unchanged + metadata derive-at-runtime policy

### API
- ახალი მძიმე media API არ არის საჭირო Lite-ში
- composer/upload path დარჩება existing Supabase storage pattern-ზე

### Storage
- `post-videos` reuse
- poster თუ დაემატება: ან იგივე bucket ქვეშ path convention, ან dedicated lightweight poster path

---

## UI ცვლილებები (Lite)

- Composer:
  - validation messages უფრო მკაფიო
  - metadata/poster status feedback
- PostCard:
  - poster-first preview
  - fallback placeholder
- Post detail:
  - stable initial render before metadata ready
  - error recovery message/state

---

## Manual steps / prerequisites

- Supabase:
  - `post-videos` bucket და policies უკვე აქტიური
  - DB migration მხოლოდ თუ Phase 21 Lite-ში metadata columns ავირჩიეთ
- Vercel/env:
  - ახალი env მოთხოვნა Lite-ში მოსალოდნელი არ არის
- Local tooling:
  - browser cross-check (mobile/desktop)
  - optional local ffmpeg მხოლოდ თუ poster generation server-side მიდგომა აირჩევა

---

## რისკები

- metadata drift (uploaded file vs stored metadata mismatch)
- poster missing/failed generation path
- mobile heavy ვიდეოებზე first paint lag
- scope creep Full Pipeline მიმართულებით

---

## Definition of Done (Phase 21 Lite)

- [x] Validation rules მკაფიოდ და სტაბილურად მუშაობს composer-ებში
- [x] Video metadata rendering თანმიმდევრულია feed/card/detail-ში
- [x] Poster strategy მუშაობს primary + fallback რეჟიმით
- [x] Playback UX მობაილ/დესკტოპზე სტაბილურია
- [x] No regressions existing v1 behavior-ში
- [x] Docs synced: `CONTEXT.md`, `00_MASTER_PLAN.md`, `01_PROGRESS.md`, `05_VIDEO_PHASE21.md`

## Final Step 5 Note (QA/Verification)

- Manual QA matrix გაიარა Lite scope-ის კრიტიკულ ბილიკებზე (validation, consistency, poster/fallback, playback/error, regression)
- Verification gates:
  - `npx tsc --noEmit` ✅
  - `npm run build` ✅
- Lite scope deliberately არ გაფართოვდა Full Pipeline მიმართულებით (transcoding/HLS/ffmpeg/db schema changes არა)

---

# END
