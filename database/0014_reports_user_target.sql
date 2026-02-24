-- 0014_reports_user_target.sql
-- Allow reporting user profiles directly from /u/[username]

alter type public.report_target_type add value if not exists 'user';
