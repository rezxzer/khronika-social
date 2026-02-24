# Khronika — Phase 21/22: Video v2 Plan (Docs-first)

> შექმნილია: 2026-02-24
> სტატუსი: **Phase 21 Lite completed; Phase 22 Step 7 completed ✅; Phase 22 = partial/blocker**
> Blocker reason: **live external provider callback E2E not yet verified in real traffic**

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

## Phase 22 — Video v2 Full Pipeline (Implementation planning + Step 7 done)

### A) Current State (after Lite)
- Single-video model exists (`media_kind`, `video_url`)
- Lite improvements completed: validation, mapping consistency, poster/fallback, playback/error UX
- No async transcoding queue, no adaptive manifest, no processing lifecycle model

### B) Full Pipeline Goal
- Build asynchronous production-grade video pipeline:
  - ingest original
  - transcode/compress outputs
  - expose adaptive playback source
  - provide resilient status/retry/error handling

### C) Scope v1 (minimum production-worthy pipeline)
- Job lifecycle: `queued`, `processing`, `completed`, `failed`, `retrying`
- Output set: adaptive manifest + progressive fallback file
- Poster/thumbnail continuity
- Failure visibility + safe fallback playback path
- Observability baseline (processing logs + job diagnostics)

### D) Out-of-scope (first rollout)
- DRM
- Live streaming
- Per-title deep encoding optimization
- Multi-region media replication
- Complex admin console (beyond basic job visibility)

### E) Architecture Options

#### Option A — App-managed async jobs + storage outputs
- Pros: full control, minimal vendor lock-in
- Cons: highest ops burden (workers, ffmpeg runtime, retries, scaling)
- Complexity: High
- Cost/Ops impact: Medium-to-high ongoing maintenance
- Recommendation: not preferred for first production rollout

#### Option B — Queue-based orchestration + external processing service
- Pros: faster delivery, predictable reliability, built-in media processing primitives
- Cons: vendor dependency, usage-based pricing
- Complexity: Medium
- Cost/Ops impact: Medium (lower engineering ops, higher provider spend)
- Recommendation: **Preferred for v1 rollout (decision lock)**

### F) Data Model / DB Changes (planned)
- `video_assets` (new): one row per source video
  - fields: `id`, `post_id`, `owner_id`, `source_url`, `status`, `provider_job_id`, `manifest_url`, `fallback_url`, `poster_url`, `duration_sec`, `width`, `height`, `error_code`, `error_message`, timestamps
- `video_processing_events` (new, mandatory v1): append-only job event log for observability/ops
- Indexes:
  - `video_assets(post_id)` unique
  - `video_assets(status, updated_at)`
  - `video_assets(provider_job_id)` unique where not null
- Migration plan (ordered):
  1) create enums/status types
  2) create `video_assets`
  3) create event log table + indexes
  4) add/update RLS policies
  5) backfill helper for existing `posts.video_url` into `video_assets` (no destructive change)

### G) Storage Layout Plan
- Originals: `post-videos/original/{userId}/{postId}/{assetId}/source.ext`
- Transcoded outputs: `post-videos/processed/{assetId}/{profile}/{segment-or-file}`
- Posters: `post-videos/posters/{assetId}/poster.jpg`
- Path conventions:
  - immutable by asset version
  - logical pointer from DB (no hardcoded path assumptions in UI)

### H) Processing Pipeline Stages
1. Upload accepted
2. Job queued
3. Processing
4. Completed (manifest + fallback + poster metadata saved)
5. Failed (error code/message persisted)
6. Retry strategy:
   - automatic limited retries for transient failures
   - manual retry endpoint/admin action for terminal failures

### I) API / Server Routes Needed (planned)
- `POST /api/video-assets/create` (register source + queue)
- `POST /api/video-assets/webhook` (provider callback / signed)
- `POST /api/video-assets/retry` (authorized retry)
- `GET /api/video-assets/[postId]` (status for UI)

### J) UI Changes by Screen (planned)
- Composer:
  - show processing state after publish (non-blocking)
- Post Card:
  - render from `video_assets` status; fallback to legacy `video_url`
- Detail page:
  - richer state handling (processing/error/retry hint)
- Optional Admin/Ops:
  - minimal status list for failed jobs

### K) Security / Abuse / Limits
- File-type spoofing defense (server-side sniffing/verification callback)
- Size/duration hard limits enforced before queueing
- Auth checks on asset ownership and retries
- Rate limiting on asset-creation and retry endpoints

### L) Ops / Infra Requirements
- Env vars:
  - provider credentials/webhook secret
  - queue/worker auth keys
- Worker/queue:
  - scheduled poller or queue consumer
- Third-party:
  - managed video processing provider (recommended path)
- Monitoring:
  - job failure rate
  - processing latency percentile
  - queue backlog alerts

### M) Rollout Strategy (phased)
- Phase 1 internal:
  - staff/internal uploads only
  - verify webhook reliability and fallback behavior
- Phase 2 beta users:
  - limited cohort rollout with monitoring
- Fallback if processing fails:
  - default: show graceful unavailable state
  - optional: serve original progressive source only when available and policy/security checks pass

### N) QA Matrix (planned)
- Upload: valid/invalid/oversize/duration limits
- Processing: success, transient fail, terminal fail, retry path
- Playback: adaptive source + fallback source correctness
- Device coverage: mobile (375px) + desktop
- Regression: image-only/text-only and existing post flows

### O) Definition of Done (Full Pipeline v1)
- End-to-end async processing works for new video posts
- UI handles all lifecycle states without broken experience
- Retry/failure flows are operationally visible
- `tsc`/build/QA matrix pass
- Docs synced across source-of-truth files

### P) Top Risks + Mitigation
- Provider outage -> fallback source + retry queue
- Cost spikes -> rate limits + profile caps + monitoring alerts
- Queue backlog -> autoscaling workers + alert thresholds
- Migration drift -> additive schema + backward compatibility with Lite model

### Q) Final Recommendation (single path)
- Choose **Option B** for v1:
  - queue-based orchestration in app + external processing provider
  - fastest safe production path with controlled operational risk

## Implementation Progress Note

- Planning approval locked:
  1) Option B architecture
  2) `video_processing_events` included in v1 (mandatory)
  3) failure default behavior = graceful unavailable state
  4) optional original fallback only under policy/security checks
  5) implementation order = provider-agnostic foundation first, provider adapter second, gated rollout third
- Step 1 code completed:
  - `database/0015_video_pipeline_foundation.sql` added
  - `video_processing_status` enum + `video_assets` + `video_processing_events` + RLS skeleton
  - manual DB sanity verification passed in Supabase (enum/indexes/RLS/policies/trigger)
  - SQL checklist note: `pg_policies` column name is `policyname` in this environment
- Step 2 code completed (provider-agnostic contracts layer):
  - `src/lib/video-pipeline/types.ts` (lifecycle + error model types)
  - `src/lib/video-pipeline/status.ts` (transition/retry rules)
  - `src/lib/video-pipeline/contracts.ts` (request/response parsing, idempotency contract, webhook payload normalization interface)
  - routes (contract-side only):
    - `src/app/api/video-assets/create/route.ts`
    - `src/app/api/video-assets/[postId]/route.ts`
    - `src/app/api/video-assets/retry/route.ts`
  - out-of-scope respected: no queue worker logic, no provider signature handling, no UI changes
- Step 3 code completed (provider-agnostic orchestration skeleton):
  - `src/lib/video-pipeline/queue.ts` (dispatch trigger/entry orchestration)
  - `src/lib/video-pipeline/worker.ts` (claim/lock/status progression/event hooks)
  - `src/lib/video-pipeline/retry.ts` (retry/backoff policy skeleton)
  - create/retry routes now call non-blocking dispatch hooks
  - out-of-scope respected: no provider adapter, no webhook signature integration, no UI changes
- Step 4 code completed (provider adapter + webhook/callback handling):
  - `src/lib/video-pipeline/provider-adapter.ts` added as provider boundary (submit + callback verify/normalize)
  - `src/lib/video-pipeline/worker.ts` now invokes adapter submit path after claim/lock
  - `src/app/api/video-assets/webhook/route.ts` added for signed provider callback handling
  - callback → internal status mapping is guarded by `canTransitionStatus`
  - output persistence wired (`manifest/progressive/poster/thumbnail` + metadata fields)
  - security implemented: HMAC signature verification, timestamp replay window, nonce replay checks
  - idempotency implemented: duplicate callback paths return safe skip behavior
  - out-of-scope respected: no UI/feature-flag/admin changes in this step
- Step 5 code completed (UI lifecycle states integration; consumer-only):
  - `src/lib/video-pipeline/client.ts` added (`create/status` contract consumer helper)
  - composer lifecycle surface added after publish in:
    - `src/components/posts/feed-composer.tsx`
    - `src/components/posts/post-composer.tsx`
  - `src/components/posts/post-card.tsx` and `src/app/p/[id]/page.tsx` now read owner asset status and render lifecycle-aware UI states
  - ready path prefers processed outputs when available; legacy `posts.video_url` fallback retained
  - out-of-scope respected: no provider security changes, no queue/worker changes, no DB migration changes
- Step 6 code completed (server-focused retries/failure/ops polish):
  - `src/lib/video-pipeline/retry.ts`: jittered backoff + retry ETA helper
  - `src/lib/video-pipeline/worker.ts`: claim attempt increment + improved failure/retry traceability payloads + exhausted retry event
  - `src/app/api/video-assets/retry/route.ts`: concurrent status drift conflict handling (no contract break)
  - `src/app/api/video-assets/[postId]/events/route.ts`: owner-only ops/event visibility read endpoint
  - out-of-scope respected: UI redesign, provider signature rewrite, DB major expansion, feature flags/admin UI
- Step 7 closeout completed (QA / verification / docs finalization):
  - closeout matrix executed (create, processing, ready/failed, retry, events visibility, UI lifecycle regression)
  - minimal fix applied: retry path attempt double increment removed in `src/app/api/video-assets/retry/route.ts`
  - verification gates passed: `npx tsc --noEmit` ✅, `npm run build` ✅
  - final status: **Phase 22 remains partial/blocker** until live external provider callback E2E is verified in real traffic
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
- Step 8+ are intentionally not started.

# END
