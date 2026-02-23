-- 0008_messages.sql
-- Direct messaging system for Khronika

-- Conversations (1-to-1 DMs)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_1 uuid not null references public.profiles(id) on delete cascade,
  participant_2 uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint unique_conversation unique (participant_1, participant_2),
  constraint no_self_conversation check (participant_1 <> participant_2)
);

create index if not exists idx_conversations_p1 on public.conversations(participant_1, last_message_at desc);
create index if not exists idx_conversations_p2 on public.conversations(participant_2, last_message_at desc);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at desc);
create index if not exists idx_messages_unread on public.messages(conversation_id, is_read) where is_read = false;

-- Enable RLS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- CONVERSATIONS: only participants can see their conversations
drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant"
on public.conversations
for select
using (participant_1 = auth.uid() or participant_2 = auth.uid());

drop policy if exists "conversations_insert_participant" on public.conversations;
create policy "conversations_insert_participant"
on public.conversations
for insert
with check (participant_1 = auth.uid() or participant_2 = auth.uid());

-- Allow updating last_message_at
drop policy if exists "conversations_update_participant" on public.conversations;
create policy "conversations_update_participant"
on public.conversations
for update
using (participant_1 = auth.uid() or participant_2 = auth.uid());

-- MESSAGES: only conversation participants can see messages
drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant"
on public.messages
for select
using (
  exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
  )
);

-- Only sender can insert (must be participant)
drop policy if exists "messages_insert_sender" on public.messages;
create policy "messages_insert_sender"
on public.messages
for insert
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
  )
);

-- Recipient can mark as read
drop policy if exists "messages_update_read" on public.messages;
create policy "messages_update_read"
on public.messages
for update
using (
  sender_id <> auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
  )
);
