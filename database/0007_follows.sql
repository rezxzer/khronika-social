-- 0007_follows.sql
-- Follow system for Khronika

-- Extend notification_type enum to include 'follow'
alter type public.notification_type add value if not exists 'follow';

-- Follows table
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

-- Indexes for efficient count queries
create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);

-- Enable RLS
alter table public.follows enable row level security;

-- SELECT: authenticated users can see all follows
drop policy if exists "follows_select_auth" on public.follows;
create policy "follows_select_auth"
on public.follows
for select
using (auth.role() = 'authenticated');

-- INSERT: only self can follow (follower_id = auth.uid)
drop policy if exists "follows_insert_self" on public.follows;
create policy "follows_insert_self"
on public.follows
for insert
with check (follower_id = auth.uid());

-- DELETE: only self can unfollow
drop policy if exists "follows_delete_self" on public.follows;
create policy "follows_delete_self"
on public.follows
for delete
using (follower_id = auth.uid());

-- Notification trigger: notify user when someone follows them
create or replace function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, entity_id)
  values (new.following_id, new.follower_id, 'follow', new.follower_id);
  return new;
end;
$$;

drop trigger if exists on_follow_create_notify on public.follows;
create trigger on_follow_create_notify
after insert on public.follows
for each row execute procedure public.notify_on_follow();
