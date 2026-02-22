"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface MyCircle {
  id: string;
  name: string;
  slug: string;
}

export function useMyCircles(limit = 6) {
  const { user, loading: authLoading } = useAuth();
  const [circles, setCircles] = useState<MyCircle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCircles([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetch() {
      setLoading(true);
      const { data, error } = await supabase
        .from("circle_members")
        .select("circles(id, name, slug)")
        .eq("user_id", user!.id)
        .order("joined_at", { ascending: false })
        .limit(limit);

      if (!cancelled && !error && data) {
        const mapped = data
          .map((row) => (row.circles as unknown as MyCircle) ?? null)
          .filter(Boolean) as MyCircle[];
        setCircles(mapped);
      }
      if (!cancelled) setLoading(false);
    }

    fetch();
    return () => { cancelled = true; };
  }, [user, authLoading, limit]);

  return { circles, loading };
}
