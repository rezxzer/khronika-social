"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

export interface ConversationRow {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  created_at: string;
  other_user: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  last_message?: string;
  unread_count: number;
}

export function useConversations(userId?: string) {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (!convs || convs.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const otherIds = convs.map((c) =>
      c.participant_1 === userId ? c.participant_2 : c.participant_1,
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", otherIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p]),
    );

    const rows: ConversationRow[] = [];

    for (const c of convs) {
      const otherId =
        c.participant_1 === userId ? c.participant_2 : c.participant_1;
      const otherProfile = profileMap.get(otherId);
      if (!otherProfile) continue;

      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count: unread } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", c.id)
        .eq("is_read", false)
        .neq("sender_id", userId);

      rows.push({
        ...c,
        other_user: otherProfile,
        last_message: lastMsg?.content,
        unread_count: unread ?? 0,
      });
    }

    setConversations(rows);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`conversations:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<string, string> | undefined;
          if (
            row &&
            (row.participant_1 === userId || row.participant_2 === userId)
          ) {
            fetchConversations();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as { conversation_id: string };
          const isRelevant = conversations.some(
            (c) => c.id === msg.conversation_id,
          );
          if (isRelevant) {
            fetchConversations();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchConversations, conversations]);

  return { conversations, loading, refetch: fetchConversations };
}

export function useUnreadMessages(userId?: string) {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!userId) return;

    const { data: convs } = await supabase
      .from("conversations")
      .select("id")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

    if (!convs || convs.length === 0) {
      setCount(0);
      return;
    }

    const convIds = convs.map((c) => c.id);

    const { count: total } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .in("conversation_id", convIds)
      .eq("is_read", false)
      .neq("sender_id", userId);

    setCount(total ?? 0);
  }, [userId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`unread-messages:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchCount();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchCount();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchCount]);

  return { count, refetch: fetchCount };
}
