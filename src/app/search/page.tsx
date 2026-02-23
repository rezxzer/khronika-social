"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useReactions } from "@/hooks/use-reactions";
import { supabase } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard, type PostData } from "@/components/posts/post-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCircleAccent } from "@/lib/ui/circle-style";
import {
  Search,
  CircleDot,
  FileText,
  Users,
  Loader2,
} from "lucide-react";

interface CircleResult {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_private: boolean;
  member_count: number;
}

const PAGE_SIZE = 20;

export default function SearchPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="mx-auto max-w-2xl space-y-4 py-8">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-full" />
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </AppShell>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { likedMap, fetchLiked, toggle } = useReactions(user?.id);

  const initialQ = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [submitted, setSubmitted] = useState(initialQ);

  const [circles, setCircles] = useState<CircleResult[]>([]);
  const [circlesLoading, setCirclesLoading] = useState(false);

  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsOffset, setPostsOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const searchCircles = useCallback(async (q: string) => {
    if (!q.trim()) { setCircles([]); return; }
    setCirclesLoading(true);

    const { data } = await supabase
      .from("circles")
      .select("id, name, slug, description, is_private")
      .or(`name.ilike.%${q}%,slug.ilike.%${q}%,description.ilike.%${q}%`)
      .order("name")
      .limit(10);

    if (data) {
      const withCounts: CircleResult[] = [];
      for (const c of data) {
        const { count } = await supabase
          .from("circle_members")
          .select("*", { count: "exact", head: true })
          .eq("circle_id", c.id);
        withCounts.push({ ...c, member_count: count ?? 0 });
      }
      setCircles(withCounts);
    } else {
      setCircles([]);
    }
    setCirclesLoading(false);
  }, []);

  const searchPosts = useCallback(async (q: string, offset = 0, append = false) => {
    if (!q.trim()) { setPosts([]); return; }
    if (offset === 0) setPostsLoading(true);
    else setLoadingMore(true);

    const { data } = await supabase
      .from("posts")
      .select(
        "*, profiles:author_id(id, username, display_name, avatar_url), comments(count), reactions(count)",
      )
      .ilike("content", `%${q}%`)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (data) {
      const mapped: PostData[] = data.map((p) => ({
        ...p,
        media_urls: (p.media_urls ?? []) as string[],
        media_kind:
          (p.media_kind as "none" | "image" | "video" | undefined) ??
          (((p.media_urls ?? []).length > 0 ? "image" : "none") as
            | "none"
            | "image"),
        video_url: (p.video_url as string | null) ?? null,
        profiles: p.profiles as unknown as PostData["profiles"],
        comment_count:
          (p.comments as unknown as { count: number }[])?.[0]?.count ?? 0,
        reaction_count:
          (p.reactions as unknown as { count: number }[])?.[0]?.count ?? 0,
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
        if (mapped.length > 0) fetchLiked(mapped.map((p) => p.id));
      }

      setHasMorePosts(data.length === PAGE_SIZE);
      setPostsOffset(offset + data.length);
    }

    setPostsLoading(false);
    setLoadingMore(false);
  }, [fetchLiked]);

  useEffect(() => {
    if (submitted.trim()) {
      searchCircles(submitted);
      searchPosts(submitted, 0, false);
    }
  }, [submitted, searchCircles, searchPosts]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSubmitted(q);
    router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
  }

  function handleDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  function handleEdited(postId: string, content: string, type: PostData["type"]) {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content, type } : p)),
    );
  }

  return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="font-serif text-xl font-bold sm:text-2xl">ძებნა</h1>
          <p className="text-sm text-muted-foreground">
            მოძებნე წრეები და პოსტები
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ძებნა..."
              className="pl-9"
              autoFocus
            />
          </div>
          <Button type="submit" variant="seal" disabled={!query.trim()}>
            ძებნა
          </Button>
        </form>

        {!submitted && (
          <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            <Search className="mb-3 h-8 w-8" />
            <p className="font-medium">ჩაწერე საძებნი სიტყვა</p>
            <p className="mt-1 text-sm">
              მოძებნე წრეების სახელებში და პოსტების ტექსტში
            </p>
          </div>
        )}

        {submitted && (
          <>
            {/* Circles Results */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold">
                <CircleDot className="h-5 w-5 text-seal" />
                წრეები
              </h2>
              {circlesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : circles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  წრეები ვერ მოიძებნა
                </p>
              ) : (
                <div className="space-y-2">
                  {circles.map((c) => {
                    const accent = getCircleAccent(c.slug);
                    return (
                      <Link
                        key={c.id}
                        href={`/c/${c.slug}`}
                        className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent sm:p-4"
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                          style={accent.chipStyle}
                        >
                          <CircleDot className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{c.name}</p>
                          {c.description && (
                            <p className="line-clamp-1 text-sm text-muted-foreground">
                              {c.description}
                            </p>
                          )}
                        </div>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {c.member_count}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Posts Results */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold">
                <FileText className="h-5 w-5 text-seal" />
                პოსტები
              </h2>
              {postsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  პოსტები ვერ მოიძებნა
                </p>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      liked={!!likedMap[post.id]}
                      onLikeToggle={toggle}
                      currentUserId={user?.id}
                      onDeleted={handleDeleted}
                      onEdited={handleEdited}
                    />
                  ))}
                  {hasMorePosts && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        onClick={() => searchPosts(submitted, postsOffset, true)}
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
            </section>
          </>
        )}
      </div>
  );
}
