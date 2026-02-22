"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useBlocklist() {
  const { user, loading: authLoading } = useAuth();
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setBlockedIds([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("blocklist")
      .select("blocked_id")
      .eq("blocker_id", user.id);
    setBlockedIds(data?.map((r) => r.blocked_id) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) refresh();
  }, [authLoading, refresh]);

  return { blockedIds, loading, refresh };
}
