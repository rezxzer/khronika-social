"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const PAGE_SIZE = 50;

export function useMessages(conversationId?: string, currentUserId?: string) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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
  }, [fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const withoutOptimistic = prev.filter(
              (m) => !m.id.startsWith("optimistic-"),
            );
            return [...withoutOptimistic, newMsg];
          });

          if (currentUserId && newMsg.sender_id !== currentUserId) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then();
          }
        },
      )
      .on("broadcast", { event: "message_deleted" }, (payload) => {
        const deletedId = payload.payload?.id as string | undefined;
        if (deletedId) {
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, currentUserId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !currentUserId || !content.trim()) return false;
      setSending(true);

      const optimisticMsg: MessageRow = {
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      const { error } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: content.trim(),
        });

      if (error) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      } else {
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

  const deleteMessage = useCallback(
    async (messageId: string) => {
      const prev = messages;
      setMessages((p) => p.filter((m) => m.id !== messageId));

      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", currentUserId!);

      if (error) {
        setMessages(prev);
        return false;
      }

      if (channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "message_deleted",
          payload: { id: messageId },
        });
      }

      return true;
    },
    [messages, currentUserId],
  );

  return { messages, loading, sending, sendMessage, deleteMessage, refetch: fetchMessages };
}
