"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
import {
  Loader2,
  Compass,
  Users,
  Flame,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type FeedTab = "circles" | "following" | "trending";

const EMPTY_STATES: Record<FeedTab, { icon: typeof Compass; title: string; description: string; cta?: { href: string; label: string } }> = {
  circles: {
    icon: Compass,
    title: "შენი ფიდი ცარიელია",
    description: "აღმოაჩინე საინტერესო წრეები და შეუერთდი თემებს — პოსტები აქ გამოჩნდება.",
    cta: { href: "/circles/explore", label: "წრეების აღმოჩენა" },
  },
  following: {
    icon: Users,
    title: "გამოწერილების პოსტები არ არის",
    description: "გამოიწერე მომხმარებლები რომ მათი პოსტები აქ გამოჩნდეს.",
    cta: { href: "/search", label: "მომხმარებლების ძებნა" },
  },
  trending: {
    icon: Flame,
    title: "ტრენდული პოსტები ჯერ არ არის",
    description: "ბოლო 7 დღის ყველაზე პოპულარული პოსტები აქ გამოჩნდება.",
  },
};

const TABS: { key: FeedTab; label: string; icon: typeof CircleDot }[] = [
  { key: "circles", label: "ჩემი წრეები", icon: CircleDot },
  { key: "following", label: "გამოწერილები", icon: Users },
  { key: "trending", label: "ტრენდული", icon: Flame },
];

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const { likedMap, fetchLiked, toggle } = useReactions(user?.id);
  const { blockedIds, refresh: refreshBlocklist } = useBlocklist();

  const [tab, setTab] = useState<FeedTab>("circles");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [circleIds, setCircleIds] = useState<string[]>([]);
  const circleIdsRef = useRef<string[]>([]);
  const tabRef = useRef<FeedTab>("circles");

  const mapPosts = (data: Record<string, unknown>[]): PostData[] =>
    data.map((p) => ({
      ...(p as unknown as PostData),
      media_urls: ((p.media_urls as string[]) ?? []) as string[],
      profiles: p.profiles as unknown as PostData["profiles"],
      comment_count:
        (p.comments as unknown as { count: number }[])?.[0]?.count ?? 0,
      reaction_count:
        (p.reactions as unknown as { count: number }[])?.[0]?.count ?? 0,
    }));

  // --- Circles feed (existing) ---
  const fetchCirclesFeed = useCallback(
    async (offset: number, append: boolean) => {
      if (!user) return;

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
        if (!append) setPosts([]);
        setHasMore(false);
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select(
          "*, profiles:author_id(id, username, display_name, avatar_url), comments(count), reactions(count)",
        )
        .in("circle_id", ids)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (!error && data) {
        const mapped = mapPosts(data as unknown as Record<string, unknown>[]);
        applyPosts(mapped, append);
        setHasMore(data.length === PAGE_SIZE);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  // --- Following feed ---
  const fetchFollowingFeed = useCallback(
    async (offset: number, append: boolean) => {
      if (!user) return;

      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = follows?.map((f) => f.following_id) ?? [];
      if (followingIds.length === 0) {
        if (!append) setPosts([]);
        setHasMore(false);
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select(
          "*, profiles:author_id(id, username, display_name, avatar_url), comments(count), reactions(count)",
        )
        .in("author_id", followingIds)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (!error && data) {
        const mapped = mapPosts(data as unknown as Record<string, unknown>[]);
        applyPosts(mapped, append);
        setHasMore(data.length === PAGE_SIZE);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  // --- Trending feed ---
  const fetchTrendingFeed = useCallback(
    async (offset: number, append: boolean) => {
      if (!user) return;

      const weekAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { data: topReacted } = await supabase
        .from("reactions")
        .select("post_id, posts!inner(created_at)")
        .gte("posts.created_at", weekAgo);

      const countMap = new Map<string, number>();
      if (topReacted) {
        for (const r of topReacted) {
          countMap.set(r.post_id, (countMap.get(r.post_id) ?? 0) + 1);
        }
      }

      const rankedIds = [...countMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => id);

      if (rankedIds.length === 0) {
        const { data, error } = await supabase
          .from("posts")
          .select(
            "*, profiles:author_id(id, username, display_name, avatar_url), comments(count), reactions(count)",
          )
          .gte("created_at", weekAgo)
          .order("created_at", { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (!error && data) {
          const mapped = mapPosts(
            data as unknown as Record<string, unknown>[],
          );
          applyPosts(mapped, append);
          setHasMore(data.length === PAGE_SIZE);
        } else {
          if (!append) setPosts([]);
          setHasMore(false);
        }
        return;
      }

      const pageIds = rankedIds.slice(offset, offset + PAGE_SIZE);
      if (pageIds.length === 0) {
        if (!append) setPosts([]);
        setHasMore(false);
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select(
          "*, profiles:author_id(id, username, display_name, avatar_url), comments(count), reactions(count)",
        )
        .in("id", pageIds);

      if (!error && data) {
        const mapped = mapPosts(data as unknown as Record<string, unknown>[]);
        const ordered = pageIds
          .map((id) => mapped.find((p) => p.id === id))
          .filter(Boolean) as PostData[];
        applyPosts(ordered, append);
        setHasMore(offset + PAGE_SIZE < rankedIds.length);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user],
  );

  function applyPosts(mapped: PostData[], append: boolean) {
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
      fetchLiked(mapped.map((p) => p.id));
    }
  }

  const fetchFeed = useCallback(
    async (offset: number, append: boolean) => {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      const currentTab = tabRef.current;
      if (currentTab === "circles") await fetchCirclesFeed(offset, append);
      else if (currentTab === "following")
        await fetchFollowingFeed(offset, append);
      else await fetchTrendingFeed(offset, append);

      setLoading(false);
      setLoadingMore(false);
    },
    [fetchCirclesFeed, fetchFollowingFeed, fetchTrendingFeed],
  );

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchFeed(0, false);
  }, [user, fetchFeed]);

  function switchTab(newTab: FeedTab) {
    if (newTab === tab) return;
    setTab(newTab);
    tabRef.current = newTab;
    setPosts([]);
    setHasMore(true);
    setLoading(true);

    if (newTab === "circles") fetchCirclesFeed(0, false).then(done);
    else if (newTab === "following") fetchFollowingFeed(0, false).then(done);
    else fetchTrendingFeed(0, false).then(done);

    function done() {
      setLoading(false);
    }
  }

  function handleBlock(blockedUserId: string) {
    setPosts((prev) => prev.filter((p) => p.author_id !== blockedUserId));
    refreshBlocklist();
  }

  function handleDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function handleEdited(
    postId: string,
    content: string,
    type: PostData["type"],
  ) {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content, type } : p)),
    );
  }

  function handleLoadMore() {
    if (loadingMore) return;
    fetchFeed(posts.length, true);
  }

  const visiblePosts = useMemo(
    () => posts.filter((p) => !blockedIds.includes(p.author_id)),
    [posts, blockedIds],
  );

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const empty = EMPTY_STATES[tab];

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-5">
        <div>
          <h1 className="font-serif text-xl font-bold sm:text-2xl">ფიდი</h1>
          <p className="text-sm text-muted-foreground">
            {tab === "circles" && "შენი წრეების უახლესი პოსტები"}
            {tab === "following" && "გამოწერილი მომხმარებლების პოსტები"}
            {tab === "trending" && "ბოლო 7 დღის ტოპ პოსტები"}
          </p>
        </div>

        {/* Tab pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => switchTab(t.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-seal bg-seal text-seal-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-seal/40 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "circles" && circleIds.length > 0 && (
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
              <empty.icon className="h-7 w-7 text-seal" />
            </div>
            <h2 className="font-serif text-lg font-bold">{empty.title}</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              {empty.description}
            </p>
            {empty.cta && (
              <div className="mt-4">
                <Button
                  variant="seal"
                  size="sm"
                  asChild
                  className="rounded-full px-6"
                >
                  <Link href={empty.cta.href}>{empty.cta.label}</Link>
                </Button>
              </div>
            )}
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
                onDeleted={handleDeleted}
                onEdited={handleEdited}
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
