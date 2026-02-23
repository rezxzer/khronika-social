-- 0004_storage_avatars.sql
-- Creates avatars bucket + storage policies

-- Create the bucket if it doesn't exist (public = true for avatar URLs to work)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read for avatars
CREATE POLICY "avatars_public_read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Authenticated users can upload only into their own folder: <uid>/...
CREATE POLICY "avatars_auth_upload_own_folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can update only their own objects
CREATE POLICY "avatars_owner_update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'avatars' AND owner = auth.uid())
WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

-- Authenticated users can delete only their own objects
CREATE POLICY "avatars_owner_delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'avatars' AND owner = auth.uid());
