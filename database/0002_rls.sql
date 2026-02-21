-- 0002_rls.sql
-- RLS policies + helper functions + triggers

-- Helper functions (owned by postgres when run in SQL editor)
create or replace function public.is_circle_member(p_circle_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circle_members cm
    where cm.circle_id = p_circle_id
      and cm.user_id = p_user_id
  );
$$;

create or replace function public.is_circle_mod(p_circle_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circle_members cm
    where cm.circle_id = p_circle_id
      and cm.user_id = p_user_id
      and cm.role in ('owner','mod')
  );
$$;

create or replace function public.can_access_circle(p_circle_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circles c
    where c.id = p_circle_id
      and (
        c.is_private = false
        or public.is_circle_member(p_circle_id, p_user_id)
      )
  );
$$;

-- Add owner as member automatically on circle creation
create or replace function public.add_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.circle_members (circle_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_circle_created_add_owner on public.circles;
create trigger on_circle_created_add_owner
after insert on public.circles
for each row execute procedure public.add_owner_membership();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.reports enable row level security;
alter table public.blocklist enable row level security;
alter table public.notifications enable row level security;

-- PROFILES
drop policy if exists "profiles_select_auth" on public.profiles;
create policy "profiles_select_auth"
on public.profiles
for select
using (auth.role() = 'authenticated');

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- CIRCLES
drop policy if exists "circles_select_access" on public.circles;
create policy "circles_select_access"
on public.circles
for select
using (
  is_private = false
  or public.is_circle_member(id)
);

drop policy if exists "circles_insert_owner" on public.circles;
create policy "circles_insert_owner"
on public.circles
for insert
with check (owner_id = auth.uid());

drop policy if exists "circles_update_owner" on public.circles;
create policy "circles_update_owner"
on public.circles
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "circles_delete_owner" on public.circles;
create policy "circles_delete_owner"
on public.circles
for delete
using (owner_id = auth.uid());

-- CIRCLE MEMBERS
drop policy if exists "circle_members_select_access" on public.circle_members;
create policy "circle_members_select_access"
on public.circle_members
for select
using (public.can_access_circle(circle_id));

-- Join public circles (self)
drop policy if exists "circle_members_insert_self_public" on public.circle_members;
create policy "circle_members_insert_self_public"
on public.circle_members
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.circles c
    where c.id = circle_id and c.is_private = false
  )
);

-- Mods can add members (private or public)
drop policy if exists "circle_members_insert_mod" on public.circle_members;
create policy "circle_members_insert_mod"
on public.circle_members
for insert
with check (
  public.is_circle_mod(circle_id)
  and role = 'member'
);

-- Self leave OR mod remove
drop policy if exists "circle_members_delete_self_or_mod" on public.circle_members;
create policy "circle_members_delete_self_or_mod"
on public.circle_members
for delete
using (
  user_id = auth.uid()
  or public.is_circle_mod(circle_id)
);

-- POSTS
drop policy if exists "posts_select_access" on public.posts;
create policy "posts_select_access"
on public.posts
for select
using (public.can_access_circle(circle_id));

drop policy if exists "posts_insert_member" on public.posts;
create policy "posts_insert_member"
on public.posts
for insert
with check (
  author_id = auth.uid()
  and public.is_circle_member(circle_id)
);

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
on public.posts
for update
using (author_id = auth.uid())
with check (author_id = auth.uid());

drop policy if exists "posts_delete_own_or_mod" on public.posts;
create policy "posts_delete_own_or_mod"
on public.posts
for delete
using (
  author_id = auth.uid()
  or public.is_circle_mod(circle_id)
);

-- COMMENTS
drop policy if exists "comments_select_access" on public.comments;
create policy "comments_select_access"
on public.comments
for select
using (
  exists (
    select 1
    from public.posts p
    where p.id = comments.post_id
      and public.can_access_circle(p.circle_id)
  )
);

drop policy if exists "comments_insert_member" on public.comments;
create policy "comments_insert_member"
on public.comments
for insert
with check (
  author_id = auth.uid()
  and exists (
    select 1
    from public.posts p
    where p.id = comments.post_id
      and public.is_circle_member(p.circle_id)
  )
);

drop policy if exists "comments_delete_own_or_mod" on public.comments;
create policy "comments_delete_own_or_mod"
on public.comments
for delete
using (
  author_id = auth.uid()
  or exists (
    select 1
    from public.posts p
    where p.id = comments.post_id
      and public.is_circle_mod(p.circle_id)
  )
);

-- REACTIONS
drop policy if exists "reactions_select_access" on public.reactions;
create policy "reactions_select_access"
on public.reactions
for select
using (
  exists (
    select 1
    from public.posts p
    where p.id = reactions.post_id
      and public.can_access_circle(p.circle_id)
  )
);

drop policy if exists "reactions_insert_member" on public.reactions;
create policy "reactions_insert_member"
on public.reactions
for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.posts p
    where p.id = reactions.post_id
      and public.is_circle_member(p.circle_id)
  )
);

drop policy if exists "reactions_delete_own" on public.reactions;
create policy "reactions_delete_own"
on public.reactions
for delete
using (user_id = auth.uid());

-- REPORTS (insert only)
drop policy if exists "reports_insert_auth" on public.reports;
create policy "reports_insert_auth"
on public.reports
for insert
with check (reporter_id = auth.uid());

-- BLOCKLIST
drop policy if exists "blocklist_select_self" on public.blocklist;
create policy "blocklist_select_self"
on public.blocklist
for select
using (blocker_id = auth.uid());

drop policy if exists "blocklist_insert_self" on public.blocklist;
create policy "blocklist_insert_self"
on public.blocklist
for insert
with check (blocker_id = auth.uid());

drop policy if exists "blocklist_delete_self" on public.blocklist;
create policy "blocklist_delete_self"
on public.blocklist
for delete
using (blocker_id = auth.uid());

-- NOTIFICATIONS
drop policy if exists "notifications_select_self" on public.notifications;
create policy "notifications_select_self"
on public.notifications
for select
using (user_id = auth.uid());

drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self"
on public.notifications
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Triggers to create notifications
create or replace function public.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_author uuid;
begin
  select author_id into v_post_author from public.posts where id = new.post_id;

  if v_post_author is not null and v_post_author <> new.author_id then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (v_post_author, new.author_id, 'comment', new.id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_comment_create_notify on public.comments;
create trigger on_comment_create_notify
after insert on public.comments
for each row execute procedure public.notify_on_comment();

create or replace function public.notify_on_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_post_author uuid;
begin
  select author_id into v_post_author from public.posts where id = new.post_id;

  if v_post_author is not null and v_post_author <> new.user_id then
    insert into public.notifications (user_id, actor_id, type, entity_id)
    values (v_post_author, new.user_id, 'reaction', new.post_id);
  end if;

  return new;
end;
$$;

drop trigger if exists on_reaction_create_notify on public.reactions;
create trigger on_reaction_create_notify
after insert on public.reactions
for each row execute procedure public.notify_on_reaction();
