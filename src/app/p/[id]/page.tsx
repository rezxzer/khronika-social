"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PostTypeBadge } from "@/components/ui/post-type-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Heart,
  Send,
  Trash2,
  Share2,
  MoreHorizontal,
  Pencil,
  Reply,
  X,
  AlertCircle,
} from "lucide-react";
import { PostEditDialog } from "@/components/posts/post-edit-dialog";
import { shareOrCopy } from "@/lib/share";
import { fireAndForgetPush } from "@/lib/push/client";
import { normalizePostMedia, pickPrimaryPosterUrl } from "@/lib/post-media";
import { toast } from "sonner";

interface PostDetail {
  id: string;
  circle_id: string;
  author_id: string;
  type: "story" | "lesson" | "invite";
  content: string;
  media_urls: string[];
  media_kind: "none" | "image" | "video";
  video_url: string | null;
  created_at: string;
  profiles: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  circles: {
    name: string;
    slug: string;
  };
}

interface Comment {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  parent_author?: {
    display_name: string | null;
    username: string | null;
  } | null;
  profiles: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ახლახანს";
  if (mins < 60) return `${mins}წთ`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}სთ`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}დ`;
  return new Date(dateStr).toLocaleDateString("ka-GE", {
    day: "numeric",
    month: "short",
  });
}

function formatDuration(seconds: number): string | null {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function PostDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      }
    >
      <PostDetailContent />
    </Suspense>
  );
}

function PostDetailContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactionCount, setReactionCount] = useState(0);
  const [hasReacted, setHasReacted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeletePost, setConfirmDeletePost] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [videoState, setVideoState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [videoErrorText, setVideoErrorText] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const fetchPost = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("posts")
      .select(
        "*, profiles:author_id(id, username, display_name, avatar_url), circles:circle_id(name, slug)",
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      setPost(null);
      setLoading(false);
      return;
    }

    setPost(normalizePostMedia(data as unknown as PostDetail));
    setVideoState("loading");
    setVideoErrorText(null);
    setVideoDuration(null);

    if (user) {
      const { data: membership } = await supabase
        .from("circle_members")
        .select("user_id")
        .eq("circle_id", data.circle_id)
        .eq("user_id", user.id)
        .maybeSingle();
      setIsMember(!!membership);
    }

    const [commentsRes, reactionsRes] = await Promise.all([
      supabase
        .from("comments")
        .select(
          "id, author_id, content, created_at, parent_id, profiles:author_id(id, username, display_name, avatar_url), parent:parent_id(author_id, profiles:author_id(display_name, username))",
        )
        .eq("post_id", id)
        .order("created_at", { ascending: true }),
      supabase.from("reactions").select("user_id").eq("post_id", id),
    ]);

    if (commentsRes.data) {
      const mapped = commentsRes.data.map((c: Record<string, unknown>) => {
        const parent = c.parent as Record<string, unknown> | null;
        const parentProfiles = parent?.profiles as Record<string, unknown> | null;
        return {
          ...c,
          parent_id: c.parent_id as string | null,
          parent_author: parentProfiles
            ? {
                display_name: parentProfiles.display_name as string | null,
                username: parentProfiles.username as string | null,
              }
            : null,
          parent: undefined,
        };
      });
      setComments(mapped as unknown as Comment[]);
    }
    if (reactionsRes.data) {
      setReactionCount(reactionsRes.data.length);
      if (user)
        setHasReacted(reactionsRes.data.some((r) => r.user_id === user.id));
    }

    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    if (!authLoading) {
      if (!user) router.replace("/login");
      else fetchPost();
    }
  }, [authLoading, user, fetchPost, router]);

  useEffect(() => {
    if (!loading && searchParams.get("focus") === "comment") {
      setTimeout(() => commentInputRef.current?.focus(), 100);
    }
  }, [loading, searchParams]);

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !post || commentText.trim().length < 1) return;
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      post_id: post.id,
      author_id: user.id,
      content: commentText.trim(),
    };
    if (replyingTo) payload.parent_id = replyingTo.id;

    const { error } = await supabase.from("comments").insert(payload);

    if (error) {
      console.error("[comment] insert error:", error);
      toast.error("კომენტარი ვერ გაიგზავნა");
    } else {
      setCommentText("");
      setReplyingTo(null);
      toast.success("კომენტარი დაემატა");
      if (post.author_id !== user.id) {
        void fireAndForgetPush(
          {
            recipientId: post.author_id,
            type: "comment",
            link: `/p/${post.id}`,
          },
          "comment-create",
        );
      }
      await fetchPost();
    }
    setSubmitting(false);
  }

  async function handleDeleteComment(commentId: string) {
    if (!user) return;
    setDeletingId(commentId);

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("author_id", user.id);

    if (error) {
      toast.error("წაშლა ვერ მოხერხდა");
    } else {
      toast.success("კომენტარი წაიშალა");
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  async function toggleReaction() {
    if (!user || !post || reacting) return;
    setReacting(true);

    const wasReacted = hasReacted;
    setHasReacted(!wasReacted);
    setReactionCount((p) =>
      wasReacted ? Math.max(0, p - 1) : p + 1,
    );

    const { error } = wasReacted
      ? await supabase
          .from("reactions")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", user.id)
      : await supabase
          .from("reactions")
          .insert({ post_id: post.id, user_id: user.id });

    if (error) {
      setHasReacted(wasReacted);
      setReactionCount((p) =>
        wasReacted ? p + 1 : Math.max(0, p - 1),
      );
      toast.error("რეაქცია ვერ შეიცვალა");
    } else if (!wasReacted && post.author_id !== user.id) {
      void fireAndForgetPush(
        {
          recipientId: post.author_id,
          type: "reaction",
          link: `/p/${post.id}`,
        },
        "reaction-like-detail",
      );
    }
    setReacting(false);
  }

  async function handleDeletePost() {
    if (!post) return;
    setDeletingPost(true);
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", post.id);

    if (error) {
      toast.error("პოსტის წაშლა ვერ მოხერხდა");
      setDeletingPost(false);
    } else {
      toast.success("პოსტი წაიშალა");
      router.replace(`/c/${post.circles.slug}`);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          უკან
        </Button>
        <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <p className="text-lg font-medium">პოსტი ვერ მოიძებნა</p>
        </div>
      </div>
    );
  }

  const author = post.profiles;
  const normalizedPost = normalizePostMedia(post);
  const primaryPosterUrl = pickPrimaryPosterUrl(normalizedPost);
  const initials = (author.display_name || author.username || "?")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/c/${post.circles.slug}`}>
            <ArrowLeft className="h-4 w-4" />
            {post.circles.name}
          </Link>
        </Button>
      </div>

      <article className="rounded-xl border bg-card p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <Link href={author.username ? `/u/${author.username}` : "#"}>
            <Avatar className="h-10 w-10 ring-2 ring-seal/10">
              <AvatarImage src={author.avatar_url ?? undefined} />
              <AvatarFallback className="bg-seal-muted text-seal text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                href={author.username ? `/u/${author.username}` : "#"}
                className="text-sm font-semibold hover:underline"
              >
                {author.display_name || author.username || "მომხმარებელი"}
              </Link>
              <span className="text-xs text-muted-foreground">
                {timeAgo(post.created_at)}
              </span>
              <PostTypeBadge type={post.type} className="ml-auto" />

              {user?.id === post.author_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      რედაქტირება
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setConfirmDeletePost(true)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      წაშლა
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed">
          {post.content}
        </div>

        {normalizedPost.media_kind === "video" && normalizedPost.video_url ? (
          <div className="relative mt-5 overflow-hidden rounded-xl border bg-muted/30">
            {videoState !== "ready" && (
              <div className="absolute inset-0 z-10">
                {primaryPosterUrl ? (
                  <Image
                    src={primaryPosterUrl}
                    alt="ვიდეოს პრევიუ"
                    fill
                    sizes="(max-width: 640px) 100vw, 672px"
                    className="object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-seal-light/50 via-muted/45 to-seal-muted/50 backdrop-blur-[1px]">
                  {videoState === "error" ? (
                    <div className="flex items-center gap-2 rounded-full bg-background/90 px-3 py-1.5 text-xs text-destructive shadow-sm">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {videoErrorText ?? "ვიდეო ვერ ჩაიტვირთა"}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ვიდეო იტვირთება...
                    </div>
                  )}
                </div>
              </div>
            )}
            <video
              src={normalizedPost.video_url}
              poster={primaryPosterUrl ?? undefined}
              className={`relative z-0 block h-auto max-h-[72vh] w-full bg-black transition-opacity ${
                videoState === "ready" ? "opacity-100" : "opacity-0"
              }`}
              controls
              preload="metadata"
              playsInline
              controlsList="nodownload"
              onLoadedMetadata={(e) => {
                setVideoDuration(formatDuration(e.currentTarget.duration));
                setVideoState((prev) => (prev === "error" ? prev : "ready"));
              }}
              onCanPlay={() =>
                setVideoState((prev) => (prev === "error" ? prev : "ready"))
              }
              onLoadedData={() =>
                setVideoState((prev) => (prev === "error" ? prev : "ready"))
              }
              onError={() => {
                setVideoDuration(null);
                setVideoState("error");
                setVideoErrorText("ვიდეო ვერ ჩაიტვირთა");
              }}
            />
            {videoState === "ready" && videoDuration && (
              <span className="pointer-events-none absolute bottom-14 right-3 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white sm:bottom-2 sm:right-2">
                {videoDuration}
              </span>
            )}
          </div>
        ) : normalizedPost.media_urls.length > 0 && (
          <div
            className="mt-5 grid gap-2"
            style={{
              gridTemplateColumns:
                normalizedPost.media_urls.length === 1 ? "1fr" : "1fr 1fr",
            }}
          >
            {normalizedPost.media_urls.map((url, i) => (
              <div
                key={i}
                className="relative aspect-[4/3] overflow-hidden rounded-lg border"
              >
                <Image
                  src={url}
                  alt={`პოსტის ფოტო ${i + 1}`}
                  fill
                  sizes={
                    normalizedPost.media_urls.length === 1
                      ? "(max-width: 640px) 100vw, 672px"
                      : "(max-width: 640px) 50vw, 336px"
                  }
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center gap-4 border-t pt-3.5">
          <button
            onClick={toggleReaction}
            disabled={reacting}
            className="flex items-center gap-1.5 text-sm transition-colors hover:text-red-500"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${hasReacted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
            />
            <span
              className={
                hasReacted ? "text-red-500" : "text-muted-foreground"
              }
            >
              {reactionCount}
            </span>
          </button>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span>{comments.length}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              const snippet = post.content.slice(0, 60);
              const authorLabel = author.display_name || author.username || "";
              shareOrCopy({
                title: snippet || "პოსტი ქრონიკაში",
                text: `${authorLabel} — ${snippet}`,
                path: `/p/${post.id}`,
              });
            }}
            className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Share2 className="h-4 w-4" />
            <span>გაზიარება</span>
          </button>
        </div>
      </article>

      {/* Comments section */}
      <div className="space-y-5">
        <h2 className="text-lg font-semibold">
          კომენტარები{" "}
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </h2>

        {isMember ? (
          <div className="space-y-1">
            {replyingTo && (
              <div className="flex items-center gap-2 rounded-md bg-seal/5 px-3 py-1.5 text-xs text-muted-foreground">
                <Reply className="h-3 w-3 shrink-0 text-seal" />
                <span>
                  <span className="font-medium text-foreground">
                    {replyingTo.name}
                  </span>
                  -ს პასუხობ
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="ml-auto rounded-full p-0.5 transition-colors hover:bg-accent"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <form onSubmit={handleComment} className="flex gap-2">
              <Textarea
                ref={commentInputRef}
                placeholder={
                  replyingTo
                    ? `${replyingTo.name}-ს პასუხი...`
                    : "დაწერე კომენტარი..."
                }
                rows={1}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (commentText.trim().length > 0 && !submitting) {
                      handleComment(e as unknown as React.FormEvent);
                    }
                  }
                }}
                className="min-h-[40px] flex-1 resize-none"
              />
              <Button
                type="submit"
                variant="seal"
                size="icon"
                disabled={submitting || commentText.trim().length < 1}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground">
            კომენტარის დასაწერად{" "}
            <Link
              href={`/c/${post.circles.slug}`}
              className="font-medium text-seal underline underline-offset-2 hover:no-underline"
            >
              შეუერთდი წრეს
            </Link>
          </div>
        )}

        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            ჯერ კომენტარები არ არის — დაწერე პირველი!
          </p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => {
              const ci = (
                c.profiles.display_name ||
                c.profiles.username ||
                "?"
              )
                .slice(0, 2)
                .toUpperCase();
              const isOwn = user?.id === c.author_id;
              const isConfirming = confirmDeleteId === c.id;

              return (
                <div
                  key={c.id}
                  className="group flex items-start gap-3 rounded-lg border bg-card p-3"
                >
                  <Link
                    href={
                      c.profiles.username
                        ? `/u/${c.profiles.username}`
                        : "#"
                    }
                  >
                    <Avatar className="h-7 w-7 ring-1 ring-seal/10">
                      <AvatarImage
                        src={c.profiles.avatar_url ?? undefined}
                      />
                      <AvatarFallback className="bg-seal-muted text-seal text-[10px]">
                        {ci}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">
                        {c.profiles.display_name || c.profiles.username}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {timeAgo(c.created_at)}
                      </span>

                      {isOwn && !isConfirming && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(c.id)}
                          className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                          title="წაშლა"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      )}

                      {isOwn && isConfirming && (
                        <div className="ml-auto flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c.id)}
                            disabled={deletingId === c.id}
                            className="rounded px-2 py-0.5 text-[11px] font-medium text-destructive transition-colors hover:bg-destructive/10"
                          >
                            {deletingId === c.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "წაშლა"
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent"
                          >
                            გაუქმება
                          </button>
                        </div>
                      )}
                    </div>
                    {c.parent_id && c.parent_author && (
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Reply className="h-3 w-3" />
                        <span>
                          {c.parent_author.display_name ||
                            c.parent_author.username ||
                            "მომხმარებელი"}
                          -ს პასუხობს
                        </span>
                      </div>
                    )}
                    <p className="mt-0.5 text-sm">{c.content}</p>
                    {isMember && (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo({
                            id: c.id,
                            name:
                              c.profiles.display_name ||
                              c.profiles.username ||
                              "მომხმარებელი",
                          });
                          commentInputRef.current?.focus();
                        }}
                        className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-seal"
                      >
                        <Reply className="h-3 w-3" />
                        პასუხი
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {post && editOpen && (
        <PostEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          postId={post.id}
          initialContent={post.content}
          initialType={post.type}
          mediaUrls={normalizedPost.media_urls}
          mediaKind={normalizedPost.media_kind}
          videoUrl={normalizedPost.video_url}
          onSaved={(newContent, newType) => {
            setPost((prev) =>
              prev ? { ...prev, content: newContent, type: newType as typeof prev.type } : prev,
            );
          }}
        />
      )}

      <Dialog open={confirmDeletePost} onOpenChange={setConfirmDeletePost}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif">პოსტის წაშლა</DialogTitle>
            <DialogDescription>
              ნამდვილად გსურს ამ პოსტის წაშლა? ეს მოქმედება შეუქცევადია.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeletePost(false)}
              disabled={deletingPost}
            >
              გაუქმება
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeletePost}
              disabled={deletingPost}
            >
              {deletingPost ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "წაშლა"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
