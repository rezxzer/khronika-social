"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PostTypeBadge } from "@/components/ui/post-type-badge";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Heart,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface PostDetail {
  id: string;
  circle_id: string;
  author_id: string;
  type: "story" | "lesson" | "invite";
  content: string;
  media_urls: string[];
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

export default function PostDetailPage() {
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

    setPost(data as unknown as PostDetail);

    const [commentsRes, reactionsRes] = await Promise.all([
      supabase
        .from("comments")
        .select(
          "id, author_id, content, created_at, profiles:author_id(id, username, display_name, avatar_url)",
        )
        .eq("post_id", id)
        .order("created_at", { ascending: true }),
      supabase.from("reactions").select("user_id").eq("post_id", id),
    ]);

    if (commentsRes.data)
      setComments(commentsRes.data as unknown as Comment[]);
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

    const { error } = await supabase.from("comments").insert({
      post_id: post.id,
      author_id: user.id,
      content: commentText.trim(),
    });

    if (error) {
      toast.error("კომენტარი ვერ გაიგზავნა");
    } else {
      setCommentText("");
      toast.success("კომენტარი დაემატა");
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
    if (!user || !post) return;

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

      <article className="rounded-xl border bg-card p-6">
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
            </div>
          </div>
        </div>

        <div className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">
          {post.content}
        </div>

        {post.media_urls.length > 0 && (
          <div
            className="mt-4 grid gap-2"
            style={{
              gridTemplateColumns:
                post.media_urls.length === 1 ? "1fr" : "1fr 1fr",
            }}
          >
            {post.media_urls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                className="w-full rounded-lg border object-cover"
                loading="lazy"
              />
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 border-t pt-3">
          <button
            onClick={toggleReaction}
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
        </div>
      </article>

      {/* Comments section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          კომენტარები{" "}
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </h2>

        <form onSubmit={handleComment} className="flex gap-2">
          <Textarea
            ref={commentInputRef}
            placeholder="დაწერე კომენტარი..."
            rows={1}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
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
                    <p className="mt-0.5 text-sm">{c.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
