-- 0015_video_pipeline_foundation.sql
-- Phase 22 Step 1: provider-agnostic video pipeline DB foundation (additive, backward-compatible)

do $$ begin
  create type public.video_processing_status as enum (
    'uploading',
    'queued',
    'processing',
    'ready',
    'failed',
    'retrying',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.video_assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  status public.video_processing_status not null default 'queued',
  source_url text not null,
  source_storage_path text,
  provider text not null default 'external_v1',
  provider_job_id text,
  provider_request_id text,
  manifest_url text,
  progressive_url text,
  poster_url text,
  thumbnail_url text,
  duration_sec integer,
  width integer,
  height integer,
  bitrate_kbps integer,
  error_code text,
  error_message text,
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_assets_one_per_post unique (post_id),
  constraint video_assets_duration_non_negative check (duration_sec is null or duration_sec >= 0),
  constraint video_assets_width_non_negative check (width is null or width >= 0),
  constraint video_assets_height_non_negative check (height is null or height >= 0),
  constraint video_assets_attempt_non_negative check (attempt_count >= 0)
);

create table if not exists public.video_processing_events (
  id uuid primary key default gen_random_uuid(),
  video_asset_id uuid not null references public.video_assets(id) on delete cascade,
  event_type text not null,
  from_status public.video_processing_status,
  to_status public.video_processing_status,
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_video_assets_provider_job_unique
  on public.video_assets (provider_job_id)
  where provider_job_id is not null;

create index if not exists idx_video_assets_status_updated
  on public.video_assets (status, updated_at);

create index if not exists idx_video_assets_owner_created
  on public.video_assets (owner_id, created_at desc);

create index if not exists idx_video_processing_events_asset_created
  on public.video_processing_events (video_asset_id, created_at desc);

create or replace function public.set_video_assets_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists on_video_assets_set_updated_at on public.video_assets;
create trigger on_video_assets_set_updated_at
before update on public.video_assets
for each row execute procedure public.set_video_assets_updated_at();

alter table public.video_assets enable row level security;
alter table public.video_processing_events enable row level security;

drop policy if exists "video_assets_select_own" on public.video_assets;
create policy "video_assets_select_own"
on public.video_assets
for select
using (owner_id = auth.uid());

drop policy if exists "video_assets_insert_own_post" on public.video_assets;
create policy "video_assets_insert_own_post"
on public.video_assets
for insert
with check (
  owner_id = auth.uid()
  and exists (
    select 1
    from public.posts p
    where p.id = video_assets.post_id
      and p.author_id = auth.uid()
  )
);

drop policy if exists "video_processing_events_select_own_asset" on public.video_processing_events;
create policy "video_processing_events_select_own_asset"
on public.video_processing_events
for select
using (
  exists (
    select 1
    from public.video_assets va
    where va.id = video_processing_events.video_asset_id
      and va.owner_id = auth.uid()
  )
);
