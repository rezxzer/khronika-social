"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";

export interface OnboardingStep {
  id: string;
  label: string;
  done: boolean;
  href: string;
}

export function useOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const [circleCount, setCircleCount] = useState<number | null>(null);
  const [postCount, setPostCount] = useState<number | null>(null);
  const [fetched, setFetched] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;

    const [circleRes, postRes] = await Promise.all([
      supabase
        .from("circle_members")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", user.id),
    ]);

    setCircleCount(circleRes.count ?? 0);
    setPostCount(postRes.count ?? 0);
    setFetched(true);
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) refresh();
  }, [authLoading, user, refresh]);

  const loading = authLoading || profileLoading || !fetched;

  const profileComplete = !!(profile?.username && profile?.display_name);
  const joinedCircles = (circleCount ?? 0) >= 1;
  const createdPost = (postCount ?? 0) >= 1;

  const steps: OnboardingStep[] = [
    {
      id: "profile",
      label: "პროფილის შევსება",
      done: profileComplete,
      href: "/settings/profile",
    },
    {
      id: "circles",
      label: "წრეში შეერთება",
      done: joinedCircles,
      href: "/circles/explore",
    },
    {
      id: "post",
      label: "პირველი პოსტი",
      done: createdPost,
      href: "/feed",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  return { steps, doneCount, total: steps.length, allDone, loading, circleCount: circleCount ?? 0, refresh };
}
