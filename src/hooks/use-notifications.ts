"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export function useUnreadCount() {
  const { user, loading: authLoading } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { count: c } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setCount(c ?? 0);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) refresh();
  }, [authLoading, user, refresh]);

  return { count, refresh };
}
