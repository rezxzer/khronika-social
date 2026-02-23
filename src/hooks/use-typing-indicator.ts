"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

const THROTTLE_MS = 2_000;
const TIMEOUT_MS = 3_000;

export function useTypingIndicator(
  conversationId: string | undefined,
  currentUserId: string | undefined,
) {
  const [otherTyping, setOtherTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTrackRef = useRef(0);

  useEffect(() => {
    if (!conversationId || !currentUserId) return;

    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ typing: boolean; user_id: string }>();
        let found = false;
        for (const key of Object.keys(state)) {
          if (key === currentUserId) continue;
          const presences = state[key];
          if (presences?.some((p) => p.typing)) {
            found = true;
            break;
          }
        }
        setOtherTyping(found);
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [conversationId, currentUserId]);

  const sendTyping = useCallback(() => {
    const ch = channelRef.current;
    if (!ch || !currentUserId) return;

    const now = Date.now();
    if (now - lastTrackRef.current < THROTTLE_MS) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        ch.untrack();
      }, TIMEOUT_MS);
      return;
    }
    lastTrackRef.current = now;

    ch.track({ typing: true, user_id: currentUserId });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      ch.untrack();
    }, TIMEOUT_MS);
  }, [currentUserId]);

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    channelRef.current?.untrack();
  }, []);

  return { otherTyping, sendTyping, stopTyping };
}
