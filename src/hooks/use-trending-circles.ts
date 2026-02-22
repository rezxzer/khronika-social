"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface TrendingCircle {
  id: string;
  name: string;
  slug: string;
  post_count: number;
}

export function useTrendingCircles(limit = 5) {
  const { user, loading: authLoading } = useAuth();
  const [circles, setCircles] = useState<TrendingCircle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    async function fetch() {
      setLoading(true);

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: recentPosts } = await supabase
        .from("posts")
        .select("circle_id")
        .gte("created_at", weekAgo);

      if (cancelled) return;

      if (!recentPosts || recentPosts.length === 0) {
        setCircles([]);
        setLoading(false);
        return;
      }

      const countMap = new Map<string, number>();
      for (const p of recentPosts) {
        countMap.set(p.circle_id, (countMap.get(p.circle_id) ?? 0) + 1);
      }

      const sorted = [...countMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      const circleIds = sorted.map(([id]) => id);

      const { data: circleData } = await supabase
        .from("circles")
        .select("id, name, slug")
        .in("id", circleIds);

      if (cancelled) return;

      if (circleData) {
        const result: TrendingCircle[] = sorted.map(([id, count]) => {
          const c = circleData.find((x) => x.id === id);
          return {
            id,
            name: c?.name ?? "",
            slug: c?.slug ?? "",
            post_count: count,
          };
        }).filter((c) => c.name);

        setCircles(result);
      }

      setLoading(false);
    }

    fetch();
    return () => { cancelled = true; };
  }, [user, authLoading, limit]);

  return { circles, loading };
}
