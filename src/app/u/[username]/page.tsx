"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useReactions } from "@/hooks/use-reactions";
import { supabase } from "@/lib/supabase/client";
import { shareOrCopy } from "@/lib/share";
import { getCircleAccent } from "@/lib/ui/circle-style";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard, type PostData } from "@/components/posts/post-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollow } from "@/hooks/use-follow";
import {
  CalendarDays,
  UserX,
  Settings,
  Share2,
  Ban,
  Flag,
  ShieldAlert,
  Loader2,
  FileText,
  Users,
  Heart,
  CircleDot,
  UserPlus,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/hooks/use-profile";

const PAGE_SIZE = 20;

interface UserCircle {
  id: string;
  name: string;
  slug: string;
  member_count: number;
}

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { likedMap, fetchLiked, toggle } = useReactions(user?.id);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [postCount, setPostCount] = useState(0);
  const [circleCount, setCircleCount] = useState(0);
  const [reactionCount, setReactionCount] = useState<number | null>(null);

  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [circles, setCircles] = useState<UserCircle[]>([]);
  const [circlesLoading, setCirclesLoading] = useState(true);

  const [isBlocked, setIsBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);

  const profileIdRef = useRef<string | null>(null);

  const isSelf = user?.id === profile?.id;

  const {
    isFollowing,
    followerCount,
    followingCount,
    toggling: followToggling,
    toggleFollow,
  } = useFollow({
    currentUserId: user?.id,
    targetUserId: profile?.id,
  });

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (error || !data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setNotFound(false);
    setProfile(data);
    profileIdRef.current = data.id;

    const [postsRes, publicCirclesRes] = await Promise.all([
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", data.id),
      supabase
        .from("circle_members")
        .select("circle_id, circles!inner(is_private)", {
          count: "exact",
          head: true,
        })
        .eq("user_id", data.id)
        .eq("circles.is_private", false),
    ]);

    setPostCount(postsRes.count ?? 0);
    setCircleCount(publicCirclesRes.count ?? 0);

    Promise.resolve(
      supabase
        .from("reactions")
        .select("*, posts!inner(author_id)", { count: "exact", head: true })
        .eq("posts.author_id", data.id),
    )
      .then(({ count: rxCount }) => {
        setReactionCount(rxCount ?? 0);
      })
      .catch(() => {
        setReactionCount(null);
      });

    if (user && user.id !== data.id) {
      const { data: blockRow } = await supabase
        .from("blocklist")
        .select("blocker_id")
        .eq("blocker_id", user.id)
        .eq("blocked_id", data.id)
        .maybeSingle();
      setIsBlocked(!!blockRow);
    }

    setLoading(false);
  }, [username, user]);

  const fetchPosts = useCallback(
    async (offset = 0, append = false) => {
      const pid = profileIdRef.current;
      if (!pid) return;
      if (offset === 0) setPostsLoading(true);
      else setLoadingMore(true);

      const { data, error } = await supabase
        .from("posts")
        .select(
          "*, profiles:author_id(id, username, display_name, avatar_url), comments(count), reactions(count)",
        )
        .eq("author_id", pid)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (!error && data) {
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

        setHasMore(data.length === PAGE_SIZE);
      }

      setPostsLoading(false);
      setLoadingMore(false);
    },
    [fetchLiked],
  );

  const fetchCircles = useCallback(async () => {
    const pid = profileIdRef.current;
    if (!pid) return;
    setCirclesLoading(true);

    const { data: memberships } = await supabase
      .from("circle_members")
      .select("circle_id, circles(id, name, slug, is_private)")
      .eq("user_id", pid);

    if (memberships) {
      const publicCircles = memberships
        .map((m) => m.circles as unknown as { id: string; name: string; slug: string; is_private: boolean })
        .filter((c) => c && !c.is_private);

      const withCounts: UserCircle[] = [];
      for (const c of publicCircles) {
        const { count } = await supabase
          .from("circle_members")
          .select("*", { count: "exact", head: true })
          .eq("circle_id", c.id);
        withCounts.push({ id: c.id, name: c.name, slug: c.slug, member_count: count ?? 0 });
      }
      setCircles(withCounts);
    }

    setCirclesLoading(false);
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile && !isBlocked) {
      fetchPosts(0, false);
      fetchCircles();
    }
  }, [profile, isBlocked, fetchPosts, fetchCircles]);

  async function handleBlock() {
    if (!user || !profile) return;
    setBlocking(true);

    if (isBlocked) {
      const { error } = await supabase
        .from("blocklist")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", profile.id);
      if (!error) {
        setIsBlocked(false);
        toast.success("მომხმარებელი განბლოკდა");
      } else {
        toast.error("განბლოკვა ვერ მოხერხდა");
      }
    } else {
      const { error } = await supabase.from("blocklist").insert({
        blocker_id: user.id,
        blocked_id: profile.id,
      });
      if (error) {
        if (error.code === "23505") {
          toast.info("უკვე დაბლოკილია");
          setIsBlocked(true);
        } else {
          toast.error("დაბლოკვა ვერ მოხერხდა");
        }
      } else {
        setIsBlocked(true);
        toast.success("მომხმარებელი დაიბლოკა");
      }
    }
    setBlocking(false);
  }

  async function handleReport() {
    if (!user || !profile || isSelf) return;
    setReporting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: "user",
      target_id: profile.id,
      reason: "მომხმარებლის პროფილზე საეჭვო/არასასურველი ქცევა",
    });
    if (error) {
      toast.error("რეპორტი ვერ გაიგზავნა");
    } else {
      toast.success("რეპორტი გაიგზავნა, მადლობა!");
    }
    setReporting(false);
  }

  const [startingChat, setStartingChat] = useState(false);

  async function handleMessage() {
    if (!user || !profile || isSelf) return;
    setStartingChat(true);

    const myId = user.id;
    const theirId = profile.id;
    const [p1, p2] = myId < theirId ? [myId, theirId] : [theirId, myId];

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("participant_1", p1)
      .eq("participant_2", p2)
      .maybeSingle();

    if (existing) {
      router.push(`/messages/${existing.id}`);
      return;
    }

    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ participant_1: p1, participant_2: p2 })
      .select("id")
      .single();

    if (created) {
      router.push(`/messages/${created.id}`);
    } else {
      toast.error("მესიჯის დაწყება ვერ მოხერხდა");
      setStartingChat(false);
    }
  }

  function handleDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setPostCount((c) => Math.max(0, c - 1));
  }

  function handleEdited(postId: string, content: string, type: PostData["type"]) {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content, type } : p)),
    );
  }

  if (loading || authLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (notFound || !profile) {
    return (
      <AppShell>
        <div className="flex min-h-[calc(100vh-16rem)] flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <UserX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-xl font-bold">მომხმარებელი ვერ მოიძებნა</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            @{username} არ არსებობს ან წაშლილია
          </p>
        </div>
      </AppShell>
    );
  }

  const initials = (profile.display_name || profile.username || "?")
    .slice(0, 2)
    .toUpperCase();
  const displayName = profile.display_name || profile.username || "მომხმარებელი";
  const joinDate = new Date(profile.created_at).toLocaleDateString("ka-GE", {
    year: "numeric",
    month: "long",
  });
  const accent = getCircleAccent(profile.username || profile.id);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Profile Header Card */}
        <div className="relative overflow-hidden rounded-xl border bg-card">
          <div className="h-2" style={accent.stripStyle} />
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Avatar className="h-20 w-20 shrink-0 ring-2 ring-seal/10">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback className="bg-seal-muted text-seal text-lg font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <h1 className="truncate font-serif text-xl font-bold sm:text-2xl">
                  {displayName}
                </h1>
                {profile.username && (
                  <p className="text-sm text-muted-foreground">@{profile.username}</p>
                )}
                <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  <span>შემოუერთდა {joinDate}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 flex-wrap gap-2">
                {isSelf ? (
                  <Button variant="outline" size="sm" asChild className="rounded-full">
                    <Link href="/settings/profile">
                      <Settings className="h-4 w-4" />
                      პროფილის რედაქტირება
                    </Link>
                  </Button>
                ) : user ? (
                  <>
                    <Button
                      variant={isFollowing ? "outline" : "seal"}
                      size="sm"
                      className="rounded-full"
                      onClick={toggleFollow}
                      disabled={followToggling}
                    >
                      {followToggling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isFollowing ? (
                        <UserCheck className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      {isFollowing ? "გამოწერილი" : "გამოწერა"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={handleMessage}
                      disabled={startingChat}
                    >
                      {startingChat ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">მესიჯი</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() =>
                        shareOrCopy({
                          title: displayName,
                          text: `${displayName} — ქრონიკის მომხმარებელი`,
                          path: `/u/${profile.username}`,
                        })
                      }
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:inline">გაზიარება</span>
                    </Button>
                    <Button
                      variant={isBlocked ? "seal" : "outline"}
                      size="sm"
                      className="rounded-full"
                      onClick={handleBlock}
                      disabled={blocking}
                    >
                      {blocking ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {isBlocked ? "განბლოკვა" : "დაბლოკვა"}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={handleReport}
                      disabled={reporting}
                    >
                      {reporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Flag className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">დაარეპორტე</span>
                    </Button>
                  </>
                ) : null}
              </div>
            </div>

            {profile.bio && (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-2">
          <Link
            href={`/u/${profile.username}/followers`}
            className="flex flex-col items-center rounded-xl border bg-card p-2.5 text-center transition-colors hover:bg-accent sm:p-3"
          >
            <span className="text-lg font-bold">{followerCount}</span>
            <span className="text-[10px] text-muted-foreground sm:text-xs">მიმდევარი</span>
          </Link>
          <Link
            href={`/u/${profile.username}/following`}
            className="flex flex-col items-center rounded-xl border bg-card p-2.5 text-center transition-colors hover:bg-accent sm:p-3"
          >
            <span className="text-lg font-bold">{followingCount}</span>
            <span className="text-[10px] text-muted-foreground sm:text-xs">გამოწერილი</span>
          </Link>
          <div className="flex flex-col items-center rounded-xl border bg-card p-2.5 text-center sm:p-3">
            <span className="text-lg font-bold">{postCount}</span>
            <span className="text-[10px] text-muted-foreground sm:text-xs">პოსტი</span>
          </div>
          <div className="flex flex-col items-center rounded-xl border bg-card p-2.5 text-center sm:p-3">
            <span className="text-lg font-bold">{circleCount}</span>
            <span className="text-[10px] text-muted-foreground sm:text-xs">წრე</span>
          </div>
          <div className="flex flex-col items-center rounded-xl border bg-card p-2.5 text-center sm:p-3">
            <span className="text-lg font-bold">
              {reactionCount !== null ? reactionCount : "—"}
            </span>
            <span className="text-[10px] text-muted-foreground sm:text-xs">რეაქცია</span>
          </div>
        </div>

        {/* Blocked State */}
        {isBlocked && !isSelf && (
          <div className="flex flex-col items-center rounded-xl border border-dashed py-12 text-center text-muted-foreground">
            <ShieldAlert className="mb-3 h-8 w-8" />
            <p className="font-medium">მომხმარებელი დაბლოკილია</p>
            <p className="mt-1 text-sm">
              კონტენტი მიუწვდომელია. განბლოკვისთვის დააჭირე ზემოთ.
            </p>
          </div>
        )}

        {/* Content (only if not blocked) */}
        {!isBlocked && (
          <>
            {/* Circles Section */}
            <div>
              <h2 className="mb-3 font-serif text-lg font-semibold">წრეები</h2>
              {circlesLoading ? (
                <div className="flex gap-2 overflow-x-auto">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-lg" />
                  ))}
                </div>
              ) : circles.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ჯერ წრეებს არ შეუერთდა
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {circles.map((c) => {
                    const ca = getCircleAccent(c.slug);
                    return (
                      <Link
                        key={c.id}
                        href={`/c/${c.slug}`}
                        className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent"
                      >
                        <div
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                          style={ca.chipStyle}
                        >
                          <CircleDot className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium">{c.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {c.member_count}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Posts Section */}
            <div>
              <h2 className="mb-3 font-serif text-lg font-semibold">პოსტები</h2>

              {postsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-xl" />
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed py-12 text-center text-muted-foreground">
                  <FileText className="mb-2 h-6 w-6" />
                  <p className="font-medium">ჯერ პოსტები არ არის</p>
                </div>
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

                  {hasMore && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        onClick={() => fetchPosts(posts.length, true)}
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
          </>
        )}
      </div>
    </AppShell>
  );
}
