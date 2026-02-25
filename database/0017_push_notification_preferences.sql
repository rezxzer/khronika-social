-- Phase 20 Follow-up (Step 1)
-- User-level push preferences for reaction/comment/follow.
-- Additive model: existing push_subscriptions flow remains unchanged.

create table if not exists public.push_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reaction_enabled boolean not null default true,
  comment_enabled boolean not null default true,
  follow_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_notification_preferences enable row level security;

create policy "push_pref_select_own"
  on public.push_notification_preferences for select
  using (user_id = auth.uid());

create policy "push_pref_insert_own"
  on public.push_notification_preferences for insert
  with check (user_id = auth.uid());

create policy "push_pref_update_own"
  on public.push_notification_preferences for update
  using (user_id = auth.uid());

create policy "push_pref_delete_own"
  on public.push_notification_preferences for delete
  using (user_id = auth.uid());

-- Seed existing users with default-true preferences (legacy behavior preserved).
insert into public.push_notification_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;
