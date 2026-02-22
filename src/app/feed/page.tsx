"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { useReactions } from "@/hooks/use-reactions";
import { useBlocklist } from "@/hooks/use-blocklist";
import { supabase } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard, type PostData } from "@/components/posts/post-card";
import { FeedComposer } from "@/components/posts/feed-composer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2, CircleDot, Compass } from "lucide-react";

const PAGE_SIZE = 20;

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const { likedMap, fetchLiked, toggle } = useReactions(user?.id);
  const { blockedIds, refresh: refreshBlocklist } = useBlocklist();

  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [circleIds, setCircleIds] = useState<string[]>([]);
  const circleIdsRef = useRef<string[]>([]);

  const fetchFeed = useCallback(async (offset = 0, append = false) => {
    if (!user) return;
    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    let ids = circleIdsRef.current;
    if (offset === 0) {
      const { data: memberships } = await supabase
        .from("circle_members")
        .select("circle_id")
        .eq("user_id", user.id);

      ids = memberships?.map((m) => m.circle_id) ?? [];
      setCircleIds(ids);
      circleIdsRef.current = ids;
    }

    if (ids.length === 0) {
      setPosts([]);
      setLoading(false);
      setLoadingMore(false);
      setHasMore(false);
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles:author_id(id, username, display_name, avatar_url), comments(count), reactions(count)")
      .in("circle_id", ids)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (!error && data) {
      const mapped: PostData[] = data.map((p) => ({
        ...p,
        media_urls: (p.media_urls ?? []) as string[],
        profiles: p.profiles as unknown as PostData["profiles"],
        comment_count: (p.comments as unknown as { count: number }[])?.[0]?.count ?? 0,
        reaction_count: (p.reactions as unknown as { count: number }[])?.[0]?.count ?? 0,
      }));

      if (append) {
        setPosts((prev) => {
          const existing = new Set(prev.map((p) => p.id));
          const newPosts = mapped.filter((p) => !existing.has(p.id));
          const all = [...prev, ...newPosts];
          fetchLiked(all.map((p) => p.id));
          return all;
        });
      } else {
        setPosts(mapped);
        await fetchLiked(mapped.map((p) => p.id));
      }

      setHasMore(data.length === PAGE_SIZE);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [user, fetchLiked]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchFeed(0, false);
  }, [user, fetchFeed]);

  function handleBlock(blockedUserId: string) {
    setPosts((prev) => prev.filter((p) => p.author_id !== blockedUserId));
    refreshBlocklist();
  }

  function handleLoadMore() {
    if (loadingMore) return;
    fetchFeed(posts.length, true);
  }

  const visiblePosts = posts.filter((p) => !blockedIds.includes(p.author_id));

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-5">
        <div>
          <h1 className="font-serif text-xl font-bold sm:text-2xl">ფიდი</h1>
          <p className="text-sm text-muted-foreground">
            შენი წრეების უახლესი პოსტები
          </p>
        </div>

        {circleIds.length > 0 && (
          <FeedComposer
            circleIds={circleIds}
            avatarUrl={profile?.avatar_url ?? null}
            onPosted={() => fetchFeed(0, false)}
          />
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-seal/20 bg-seal-light/30 py-12 text-center sm:py-16">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-seal-muted">
              <Compass className="h-7 w-7 text-seal" />
            </div>
            <h2 className="font-serif text-lg font-bold">შენი ფიდი ცარიელია</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              აღმოაჩინე საინტერესო წრეები და შეუერთდი თემებს — პოსტები აქ გამოჩნდება.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Button variant="seal" size="sm" asChild className="rounded-full px-6">
                <Link href="/circles/explore">
                  <Compass className="h-4 w-4" />
                  წრეების აღმოჩენა
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild className="rounded-full">
                <Link href="/circles">ყველა წრე</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {visiblePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                liked={!!likedMap[post.id]}
                onLikeToggle={toggle}
                currentUserId={user.id}
                onBlock={handleBlock}
              />
            ))}

            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
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
