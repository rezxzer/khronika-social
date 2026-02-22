"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

/**
 * Batch-fetch which posts the current user has liked,
 * and provide optimistic toggle per post.
 */
export function useReactions(userId: string | undefined) {
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  const fetchLiked = useCallback(
    async (postIds: string[]) => {
      if (!userId || postIds.length === 0) {
        setLikedMap({});
        return;
      }

      const { data } = await supabase
        .from("reactions")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds);

      const map: Record<string, boolean> = {};
      for (const id of postIds) map[id] = false;
      if (data) {
        for (const r of data) map[r.post_id] = true;
      }
      setLikedMap(map);
    },
    [userId],
  );

  const toggle = useCallback(
    async (
      postId: string,
      currentCount: number,
      setCount: (n: number) => void,
    ) => {
      if (!userId || toggling[postId]) return;

      const wasLiked = !!likedMap[postId];

      setLikedMap((prev) => ({ ...prev, [postId]: !wasLiked }));
      setCount(wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1);
      setToggling((prev) => ({ ...prev, [postId]: true }));

      const { error } = wasLiked
        ? await supabase
            .from("reactions")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", userId)
        : await supabase
            .from("reactions")
            .insert({ post_id: postId, user_id: userId });

      if (error) {
        setLikedMap((prev) => ({ ...prev, [postId]: wasLiked }));
        setCount(currentCount);
        toast.error("რეაქცია ვერ შეიცვალა");
      }

      setToggling((prev) => ({ ...prev, [postId]: false }));
    },
    [userId, likedMap, toggling],
  );

  return { likedMap, fetchLiked, toggle };
}
