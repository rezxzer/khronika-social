"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const PAGE_SIZE = 40;

export function useMessages(conversationId?: string, currentUserId?: string) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(PAGE_SIZE);

    setMessages((data as MessageRow[]) ?? []);
    setLoading(false);

    if (currentUserId && data && data.length > 0) {
      const unreadIds = data
        .filter((m) => !m.is_read && m.sender_id !== currentUserId)
        .map((m) => m.id);

      if (unreadIds.length > 0) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .in("id", unreadIds);
      }
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !currentUserId || !content.trim()) return false;
      setSending(true);

      const { data, error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: content.trim(),
        })
        .select()
        .single();

      if (!error && data) {
        setMessages((prev) => [...prev, data as MessageRow]);

        await supabase
          .from("conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId);
      }

      setSending(false);
      return !error;
    },
    [conversationId, currentUserId],
  );

  return { messages, loading, sending, sendMessage, refetch: fetchMessages };
}
