-- 0016_video_assets_source_hash.sql
-- Phase 22 extra scope (Step 1): exact duplicate video prevention foundation

alter table if exists public.video_assets
add column if not exists source_file_sha256 text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'video_assets_source_file_sha256_format'
      and conrelid = 'public.video_assets'::regclass
  ) then
    alter table public.video_assets
    add constraint video_assets_source_file_sha256_format
    check (
      source_file_sha256 is null
      or source_file_sha256 ~ '^[0-9a-f]{64}$'
    );
  end if;
end
$$;

create unique index if not exists idx_video_assets_owner_source_hash_unique
  on public.video_assets (owner_id, source_file_sha256)
  where source_file_sha256 is not null;
