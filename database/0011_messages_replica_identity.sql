-- 0011_messages_replica_identity.sql
-- Set REPLICA IDENTITY FULL so Realtime DELETE events include all columns
-- (by default only the primary key is sent, which breaks conversation_id filters)

ALTER TABLE public.messages REPLICA IDENTITY FULL;
