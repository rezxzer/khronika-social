-- 0001_init.sql
-- Core schema for Khronika (Khronika Social)

create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.circle_role as enum ('owner','mod','member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.post_type as enum ('story','lesson','invite');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum ('comment','reaction');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_target_type as enum ('post','comment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.reaction_type as enum ('like');
exception when duplicate_object then null; end $$;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

-- Circles
create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);

-- Circle members
create table if not exists public.circle_members (
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.circle_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

-- Posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  type public.post_type not null default 'story',
  content text not null,
  media_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- Reactions
create table if not exists public.reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.reaction_type not null default 'like',
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Reports (insert-only for MVP)
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason text,
  created_at timestamptz not null default now()
);

-- Blocklist
create table if not exists public.blocklist (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type public.notification_type not null,
  entity_id uuid not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_circles_owner_id on public.circles(owner_id);
create index if not exists idx_circle_members_user_id on public.circle_members(user_id);

create index if not exists idx_posts_circle_created on public.posts(circle_id, created_at desc);
create index if not exists idx_posts_author_created on public.posts(author_id, created_at desc);

create index if not exists idx_comments_post_created on public.comments(post_id, created_at asc);

create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);

-- Auto-create profile row on new auth user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
