"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useReactions } from "@/hooks/use-reactions";
import { supabase } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard, type PostData } from "@/components/posts/post-card";
import { FeedComposer } from "@/components/posts/feed-composer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, CircleDot } from "lucide-react";

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const { likedMap, fetchLiked, toggle } = useReactions(user?.id);

  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [circleIds, setCircleIds] = useState<string[]>([]);

  const fetchFeed = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: memberships } = await supabase
      .from("circle_members")
      .select("circle_id")
      .eq("user_id", user.id);

    const ids = memberships?.map((m) => m.circle_id) ?? [];
    setCircleIds(ids);

    if (ids.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles:author_id(id, username, display_name, avatar_url), comments(count), reactions(count)")
      .in("circle_id", ids)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      const mapped: PostData[] = data.map((p) => ({
        ...p,
        media_urls: (p.media_urls ?? []) as string[],
        profiles: p.profiles as unknown as PostData["profiles"],
        comment_count: (p.comments as unknown as { count: number }[])?.[0]?.count ?? 0,
        reaction_count: (p.reactions as unknown as { count: number }[])?.[0]?.count ?? 0,
      }));
      setPosts(mapped);
      await fetchLiked(mapped.map((p) => p.id));
    }

    setLoading(false);
  }, [user, fetchLiked]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchFeed();
  }, [user, fetchFeed]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <h1 className="font-serif text-2xl font-bold">ფიდი</h1>
          <p className="text-sm text-muted-foreground">
            შენი წრეების უახლესი პოსტები
          </p>
        </div>

        {circleIds.length > 0 && (
          <FeedComposer
            circleIds={circleIds}
            avatarUrl={profile?.avatar_url ?? null}
            onPosted={fetchFeed}
          />
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-seal/20 bg-seal-light/30 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-seal-muted">
              <CircleDot className="h-6 w-6 text-seal" />
            </div>
            <p className="text-lg font-medium">ჯერ ცარიელია</p>
            <p className="mt-1 text-sm text-muted-foreground">
              შეუერთდი წრეებს რომ ფიდში პოსტები გამოჩნდეს.
            </p>
            <Button variant="seal" size="sm" asChild className="mt-4 rounded-full px-6">
              <Link href="/circles">წრეების ნახვა</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                liked={!!likedMap[post.id]}
                onLikeToggle={toggle}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
