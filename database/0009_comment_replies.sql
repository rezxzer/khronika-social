-- 0009_comment_replies.sql
-- Add parent_id to comments for reply-to-comment threading

alter table public.comments
  add column if not exists parent_id uuid references public.comments(id) on delete cascade;

create index if not exists idx_comments_parent_id on public.comments(parent_id);
