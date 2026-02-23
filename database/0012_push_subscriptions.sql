-- Push notification subscriptions (Web Push API)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "push_subs_select_own"
  on public.push_subscriptions for select
  using (user_id = auth.uid());

create policy "push_subs_insert_own"
  on public.push_subscriptions for insert
  with check (user_id = auth.uid());

create policy "push_subs_update_own"
  on public.push_subscriptions for update
  using (user_id = auth.uid());

create policy "push_subs_delete_own"
  on public.push_subscriptions for delete
  using (user_id = auth.uid());

create index if not exists idx_push_subs_user_id on public.push_subscriptions(user_id);
