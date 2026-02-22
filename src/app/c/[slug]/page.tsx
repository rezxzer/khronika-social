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
} from "lucide-react";
import { getCircleAccent } from "@/lib/ui/circle-style";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard, type PostData } from "@/components/posts/post-card";
import { PostComposer } from "@/components/posts/post-composer";
import { toast } from "sonner";

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

  const fetchPosts = useCallback(async () => {
    if (!circle) return;
    setPostsLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select("*, profiles:author_id(id, username, display_name, avatar_url), comments(count), reactions(count)")
      .eq("circle_id", circle.id)
      .order("created_at", { ascending: false })
      .limit(30);

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

    setPostsLoading(false);
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
    if (circle) fetchPosts();
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

  return (
    <AppShell>
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/circles">
          <ArrowLeft className="h-4 w-4" />
          წრეებზე დაბრუნება
        </Link>
      </Button>

      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className="h-2" style={accent.stripStyle} />
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={accent.chipStyle}
                >
                  <CircleDot className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl font-bold">{circle.name}</h1>
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
                <p className="text-muted-foreground">{circle.description}</p>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{memberCount} წევრი</span>
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
          <PostComposer circleId={circle.id} onPosted={fetchPosts} />
        )}

        {postsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : posts.filter((p) => !blockedIds.includes(p.author_id)).length === 0 ? (
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
            {posts
              .filter((p) => !blockedIds.includes(p.author_id))
              .map((post) => (
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
    </AppShell>
  );
}
