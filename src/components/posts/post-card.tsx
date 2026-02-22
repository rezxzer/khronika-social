"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostTypeBadge } from "@/components/ui/post-type-badge";
import { MessageCircle, Heart, Share2, MoreHorizontal } from "lucide-react";

export interface PostData {
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
  comment_count: number;
  reaction_count: number;
  circle_name?: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ახლახანს";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("ka-GE", { day: "numeric", month: "short" });
}

function extractTitle(content: string): { title: string; body: string } {
  const firstLine = content.split("\n")[0];
  if (firstLine.length <= 80 && content.length > firstLine.length) {
    return { title: firstLine, body: content.slice(firstLine.length).trim() };
  }
  if (content.length > 120) {
    return { title: content.slice(0, 60) + "...", body: content };
  }
  return { title: "", body: content };
}

interface PostCardProps {
  post: PostData;
  liked?: boolean;
  onLikeToggle?: (postId: string, currentCount: number, setCount: (n: number) => void) => void;
}

export function PostCard({ post, liked = false, onLikeToggle }: PostCardProps) {
  const router = useRouter();
  const author = post.profiles;
  const initials = (author.display_name || author.username || "?")
    .slice(0, 2)
    .toUpperCase();
  const authorName = author.display_name || author.username || "მომხმარებელი";
  const { title, body } = extractTitle(post.content);

  const [localCount, setLocalCount] = useState(post.reaction_count);

  function handleLikeClick(e: React.MouseEvent) {
    e.preventDefault();
    if (onLikeToggle) {
      onLikeToggle(post.id, localCount, setLocalCount);
    }
  }

  function handleCommentClick(e: React.MouseEvent) {
    e.preventDefault();
    router.push(`/p/${post.id}?focus=comment`);
  }

  return (
    <article className="rounded-xl border bg-card transition-all duration-200 hover:shadow-sm">
      <div className="p-5">
        {/* Header: avatar + author info */}
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
              <div className="min-w-0">
                <Link
                  href={author.username ? `/u/${author.username}` : "#"}
                  className="text-sm font-semibold hover:underline"
                >
                  {authorName}
                </Link>
                {post.circle_name && (
                  <span className="text-sm text-muted-foreground">
                    {" "}
                    in{" "}
                    <span className="font-medium text-foreground">
                      {post.circle_name}
                    </span>
                  </span>
                )}
              </div>
              <button
                type="button"
                className="ml-auto shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {timeAgo(post.created_at)}
              </span>
              <PostTypeBadge type={post.type} className="shrink-0" />
            </div>
          </div>
        </div>

        {/* Content */}
        <Link href={`/p/${post.id}`} className="group mt-3 block">
          {title && (
            <h3 className="font-serif text-base font-bold leading-snug group-hover:text-foreground/80">
              {title}
            </h3>
          )}
          {body && body !== post.content && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground group-hover:text-muted-foreground/80">
              {body}
            </p>
          )}
          {!title && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed group-hover:text-foreground/80">
              {body}
            </p>
          )}
        </Link>

        {/* Media */}
        {post.media_urls.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-hidden rounded-lg">
            {post.media_urls.slice(0, 3).map((url, i) => (
              <Link
                key={i}
                href={`/p/${post.id}`}
                className="relative flex-1"
              >
                <img
                  src={url}
                  alt=""
                  className="aspect-[4/3] w-full rounded-lg object-cover transition-opacity hover:opacity-90"
                  loading="lazy"
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1 border-t px-4 py-2">
        <button
          type="button"
          onClick={handleLikeClick}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
          />
          <span className={liked ? "text-red-500" : "text-muted-foreground"}>
            {localCount || ""}
          </span>
        </button>
        <button
          type="button"
          onClick={handleCommentClick}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{post.comment_count || ""}</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
        <button
          type="button"
          className="ml-auto rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
