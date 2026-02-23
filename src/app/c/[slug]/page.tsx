"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useReactions } from "@/hooks/use-reactions";
import { useBlocklist } from "@/hooks/use-blocklist";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Lock,
  Globe,
  Users,
  LogIn,
  LogOut as LogOutIcon,
  Loader2,
  CircleDot,
  PenLine,
  Share2,
  UserPlus,
  Copy,
  Check,
} from "lucide-react";
import { getCircleAccent } from "@/lib/ui/circle-style";
import { shareOrCopy } from "@/lib/share";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard, type PostData } from "@/components/posts/post-card";
import { PostComposer } from "@/components/posts/post-composer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const PAGE_SIZE = 20;

interface CircleDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_private: boolean;
  owner_id: string;
  created_at: string;
}

export default function CircleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { likedMap, fetchLiked, toggle } = useReactions(user?.id);
  const { blockedIds, refresh: refreshBlocklist } = useBlocklist();

  const [circle, setCircle] = useState<CircleDetail | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const fetchCircle = useCallback(async () => {
    if (!slug) return;
    setLoading(true);

    const { data: circleData, error } = await supabase
      .from("circles")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !circleData) {
      setCircle(null);
      setLoading(false);
      return;
    }

    setCircle(circleData);

    const { count } = await supabase
      .from("circle_members")
      .select("*", { count: "exact", head: true })
      .eq("circle_id", circleData.id);

    setMemberCount(count ?? 0);

    if (user) {
      const { data: membership } = await supabase
        .from("circle_members")
        .select("user_id")
        .eq("circle_id", circleData.id)
        .eq("user_id", user.id)
        .maybeSingle();

      setIsMember(!!membership);
    }

    setLoading(false);
  }, [slug, user]);

  const fetchPosts = useCallback(async (offset = 0, append = false) => {
    if (!circle) return;
    if (offset === 0) setPostsLoading(true);
    else setLoadingMore(true);

    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles:author_id(id, username, display_name, avatar_url), comments(count), reactions(count)")
      .eq("circle_id", circle.id)
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

    setPostsLoading(false);
    setLoadingMore(false);
  }, [circle, fetchLiked]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login");
      } else {
        fetchCircle();
      }
    }
  }, [authLoading, user, fetchCircle, router]);

  useEffect(() => {
    if (circle) fetchPosts(0, false);
  }, [circle, fetchPosts]);

  async function handleJoin() {
    if (!circle || !user) return;
    setActionLoading(true);

    const { error } = await supabase.from("circle_members").insert({
      circle_id: circle.id,
      user_id: user.id,
      role: "member",
    });

    if (!error) {
      setIsMember(true);
      setMemberCount((prev) => prev + 1);
      toast.success("წრეს შეუერთდი!");
    } else {
      toast.error("შეერთება ვერ მოხერხდა");
    }

    setActionLoading(false);
  }

  async function handleLeave() {
    if (!circle || !user) return;
    if (circle.owner_id === user.id) return;
    setActionLoading(true);

    const { error } = await supabase
      .from("circle_members")
      .delete()
      .eq("circle_id", circle.id)
      .eq("user_id", user.id);

    if (!error) {
      setIsMember(false);
      setMemberCount((prev) => Math.max(0, prev - 1));
      toast.success("წრე დატოვე");
    } else {
      toast.error("დატოვება ვერ მოხერხდა");
    }

    setActionLoading(false);
  }

  function handleLoadMore() {
    if (loadingMore) return;
    fetchPosts(posts.length, true);
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!circle) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/circles">
            <ArrowLeft className="h-4 w-4" />
            წრეებზე დაბრუნება
          </Link>
        </Button>
        <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium">წრე ვერ მოიძებნა</p>
          <p className="mt-1 text-sm">
            ეს წრე არ არსებობს ან შენ არ გაქვს წვდომა.
          </p>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === circle.owner_id;
  const accent = getCircleAccent(circle.slug);
  const filteredPosts = posts.filter((p) => !blockedIds.includes(p.author_id));

  return (
    <AppShell>
    <div className="space-y-4 sm:space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/circles">
          <ArrowLeft className="h-4 w-4" />
          წრეებზე დაბრუნება
        </Link>
      </Button>

      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className="h-2" style={accent.stripStyle} />
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={accent.chipStyle}
                >
                  <CircleDot className="h-5 w-5" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-xl font-bold sm:text-2xl">{circle.name}</h1>
                  <Badge variant={circle.is_private ? "secondary" : "outline"}>
                    {circle.is_private ? (
                      <Lock className="mr-1 h-3 w-3" />
                    ) : (
                      <Globe className="mr-1 h-3 w-3" />
                    )}
                    {circle.is_private ? "პირადი" : "ღია"}
                  </Badge>
                </div>
              </div>
              {circle.description && (
                <p className="text-sm text-muted-foreground sm:text-base">{circle.description}</p>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {memberCount} წევრი
                </span>
                <button
                  type="button"
                  onClick={() => shareOrCopy({
                    title: circle.name,
                    text: circle.description || `${circle.name} — წრე ქრონიკაში`,
                    path: `/c/${circle.slug}`,
                  })}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="text-xs">გაზიარება</span>
                </button>
                {!circle.is_private && (
                  <button
                    type="button"
                    onClick={() => setInviteOpen(true)}
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-seal transition-colors hover:bg-seal-muted"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">მოწვევა</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              {circle.is_private && !isMember ? (
                <Badge variant="secondary" className="h-9 px-4 text-sm">
                  <Lock className="mr-1 h-3 w-3" />
                  პირადი წრე
                </Badge>
              ) : isMember ? (
                isOwner ? (
                  <Badge variant="outline" className="h-9 px-4 text-sm">
                    მფლობელი
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLeave}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <LogOutIcon className="h-4 w-4" />
                    )}
                    დატოვება
                  </Button>
                )
              ) : (
                <Button
                  size="sm"
                  onClick={handleJoin}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <LogIn className="h-4 w-4" />
                  )}
                  შეერთება
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">პოსტები</h2>

        {isMember && (
          <PostComposer circleId={circle.id} onPosted={() => fetchPosts(0, false)} />
        )}

        {postsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed py-12 text-center text-muted-foreground">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <PenLine className="h-5 w-5" />
            </div>
            <p className="font-medium">ჯერ პოსტები არ არის</p>
            <p className="mt-1 text-sm">
              {isMember
                ? "დაწერე პირველი პოსტი ამ წრეში!"
                : "შეუერთდი წრეს რომ პოსტები ნახო."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                liked={!!likedMap[post.id]}
                onLikeToggle={toggle}
                currentUserId={user?.id}
                onBlock={(id) => {
                  setPosts((prev) => prev.filter((p) => p.author_id !== id));
                  refreshBlocklist();
                }}
                onDeleted={(postId) => {
                  setPosts((prev) => prev.filter((p) => p.id !== postId));
                }}
                onEdited={(postId, content, type) => {
                  setPosts((prev) =>
                    prev.map((p) =>
                      p.id === postId ? { ...p, content, type } : p,
                    ),
                  );
                }}
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
    </div>

    {/* Invite Dialog */}
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">მეგობრის მოწვევა</DialogTitle>
          <DialogDescription>
            გააზიარე ეს ლინკი მეგობრებთან, რომ შემოუერთდნენ წრეს „{circle.name}".
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={`${typeof window !== "undefined" ? window.location.origin : ""}/c/${circle.slug}?ref=invite`}
            className="flex-1 text-sm"
            onFocus={(e) => e.target.select()}
          />
          <Button
            variant="seal"
            size="sm"
            onClick={async () => {
              const url = `${window.location.origin}/c/${circle.slug}?ref=invite`;
              try {
                await navigator.clipboard.writeText(url);
                setLinkCopied(true);
                toast.success("ლინკი დაკოპირდა");
                setTimeout(() => setLinkCopied(false), 2000);
              } catch {
                prompt("დააკოპირე ლინკი:", url);
              }
            }}
            className="shrink-0"
          >
            {linkCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        {typeof navigator !== "undefined" && !!navigator.share && (
          <Button
            variant="outline"
            onClick={() => {
              shareOrCopy({
                title: circle.name,
                text: `შემოუერთდი წრეს „${circle.name}" ქრონიკაში!`,
                path: `/c/${circle.slug}`,
              });
            }}
            className="w-full"
          >
            <Share2 className="mr-2 h-4 w-4" />
            სხვა აპით გაზიარება
          </Button>
        )}
      </DialogContent>
    </Dialog>
    </AppShell>
  );
}
