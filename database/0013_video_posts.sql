-- Video posts v1
-- Keep existing image flow intact while adding one-video-per-post support.

alter table public.posts
  add column if not exists media_kind text not null default 'none'
    check (media_kind in ('none', 'image', 'video')),
  add column if not exists video_url text;

update public.posts
set media_kind = case
  when coalesce(array_length(media_urls, 1), 0) > 0 then 'image'
  else 'none'
end
where media_kind is null or media_kind = 'none';

-- v1 rule: video posts must not have image list.
alter table public.posts
  drop constraint if exists posts_media_kind_consistency;

alter table public.posts
  add constraint posts_media_kind_consistency
  check (
    (media_kind = 'video' and video_url is not null and coalesce(array_length(media_urls, 1), 0) = 0)
    or
    (media_kind = 'image' and video_url is null)
    or
    (media_kind = 'none' and video_url is null and coalesce(array_length(media_urls, 1), 0) = 0)
  );

-- Storage bucket for post videos
insert into storage.buckets (id, name, public)
values ('post-videos', 'post-videos', true)
on conflict (id) do nothing;

drop policy if exists "post_videos_upload_auth" on storage.objects;
create policy "post_videos_upload_auth"
on storage.objects
for insert
with check (
  bucket_id = 'post-videos'
  and auth.role() = 'authenticated'
);

drop policy if exists "post_videos_read_public" on storage.objects;
create policy "post_videos_read_public"
on storage.objects
for select
using (bucket_id = 'post-videos');

drop policy if exists "post_videos_delete_own" on storage.objects;
create policy "post_videos_delete_own"
on storage.objects
for delete
using (
  bucket_id = 'post-videos'
  and (storage.foldername(name))[1] is not null
  and auth.uid()::text = (storage.foldername(name))[2]
);
