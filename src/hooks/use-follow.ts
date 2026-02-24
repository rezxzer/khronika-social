"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { fireAndForgetPush } from "@/lib/push/client";

interface UseFollowOptions {
  currentUserId?: string;
  targetUserId?: string;
}

export function useFollow({ currentUserId, targetUserId }: UseFollowOptions) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchState = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);

    const promises: Promise<unknown>[] = [
      Promise.resolve(
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", targetUserId),
      ),
      Promise.resolve(
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", targetUserId),
      ),
    ];

    if (currentUserId && currentUserId !== targetUserId) {
      promises.push(
        Promise.resolve(
          supabase
            .from("follows")
            .select("follower_id")
            .eq("follower_id", currentUserId)
            .eq("following_id", targetUserId)
            .maybeSingle(),
        ),
      );
    }

    const [followersRes, followingRes, isFollowingRes] = (await Promise.all(
      promises,
    )) as [
      { count: number | null },
      { count: number | null },
      { data: unknown } | undefined,
    ];

    setFollowerCount(followersRes.count ?? 0);
    setFollowingCount(followingRes.count ?? 0);

    if (isFollowingRes) {
      setIsFollowing(!!isFollowingRes.data);
    }

    setLoading(false);
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const toggleFollow = useCallback(async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId)
      return;
    setToggling(true);

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId);

      if (!error) {
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      }
    } else {
      const { error } = await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: targetUserId,
      });

      if (!error) {
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
        if (targetUserId !== currentUserId) {
          void fireAndForgetPush(
            {
              recipientId: targetUserId,
              type: "follow",
            },
            "follow-add",
          );
        }
      }
    }

    setToggling(false);
  }, [currentUserId, targetUserId, isFollowing]);

  return {
    isFollowing,
    followerCount,
    followingCount,
    loading,
    toggling,
    toggleFollow,
    refetch: fetchState,
  };
}
