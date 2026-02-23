-- 0010_message_delete_policy.sql
-- Allow sender to delete their own messages

drop policy if exists "messages_delete_sender" on public.messages;
create policy "messages_delete_sender"
on public.messages
for delete
using (sender_id = auth.uid());
