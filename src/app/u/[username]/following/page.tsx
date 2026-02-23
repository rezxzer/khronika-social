"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Loader2, ArrowLeft } from "lucide-react";

interface FollowingProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

const PAGE_SIZE = 30;

export default function FollowingPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();

  const [profiles, setProfiles] = useState<FollowingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const fetchTargetUser = useCallback(async () => {
    if (!username) return;
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();
    if (data) setTargetUserId(data.id);
    else setLoading(false);
  }, [username]);

  const fetchFollowing = useCallback(
    async (offset = 0, append = false) => {
      if (!targetUserId) return;
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      const { data } = await supabase
        .from("follows")
        .select("following_id, profiles:following_id(id, username, display_name, avatar_url)")
        .eq("follower_id", targetUserId)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (data) {
        const mapped = data
          .map((r) => r.profiles as unknown as FollowingProfile)
          .filter(Boolean);

        if (append) {
          setProfiles((prev) => {
            const ids = new Set(prev.map((p) => p.id));
            return [...prev, ...mapped.filter((p) => !ids.has(p.id))];
          });
        } else {
          setProfiles(mapped);
        }
        setHasMore(data.length === PAGE_SIZE);
      }

      setLoading(false);
      setLoadingMore(false);
    },
    [targetUserId],
  );

  useEffect(() => {
    fetchTargetUser();
  }, [fetchTargetUser]);

  useEffect(() => {
    if (targetUserId) fetchFollowing(0);
  }, [targetUserId, fetchFollowing]);

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/u/${username}`}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-serif text-xl font-bold">გამოწერილი</h1>
            <p className="text-sm text-muted-foreground">@{username}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed py-12 text-center text-muted-foreground">
            <Users className="mb-2 h-8 w-8" />
            <p className="font-medium">ჯერ არავინ გამოუწერია</p>
          </div>
        ) : (
          <div className="space-y-2">
            {profiles.map((p) => {
              const initials = (p.display_name || p.username || "?")
                .slice(0, 2)
                .toUpperCase();
              return (
                <Link
                  key={p.id}
                  href={`/u/${p.username}`}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-seal-muted text-seal text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {p.display_name || p.username || "მომხმარებელი"}
                    </p>
                    {p.username && (
                      <p className="text-sm text-muted-foreground">@{p.username}</p>
                    )}
                  </div>
                </Link>
              );
            })}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={() => fetchFollowing(profiles.length, true)}
                  disabled={loadingMore}
                  className="rounded-full px-8"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      იტვირთება...
                    </>
                  ) : (
                    "მეტის ჩატვირთვა"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
