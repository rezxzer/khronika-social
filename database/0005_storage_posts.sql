-- 0005_storage_posts.sql
-- Storage bucket for post images

insert into storage.buckets (id, name, public)
values ('posts', 'posts', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload
drop policy if exists "posts_upload_auth" on storage.objects;
create policy "posts_upload_auth"
on storage.objects
for insert
with check (
  bucket_id = 'posts'
  and auth.role() = 'authenticated'
);

-- Allow public read
drop policy if exists "posts_read_public" on storage.objects;
create policy "posts_read_public"
on storage.objects
for select
using (bucket_id = 'posts');

-- Allow users to delete their own uploads
drop policy if exists "posts_delete_own" on storage.objects;
create policy "posts_delete_own"
on storage.objects
for delete
using (
  bucket_id = 'posts'
  and (storage.foldername(name))[1] IS NOT NULL
  and auth.uid()::text = (storage.foldername(name))[2]
);
