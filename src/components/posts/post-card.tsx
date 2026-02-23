"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostTypeBadge } from "@/components/ui/post-type-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageCircle,
  Heart,
  Share2,
  MoreHorizontal,
  Flag,
  Ban,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { shareOrCopy } from "@/lib/share";
import { toast } from "sonner";

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
  return new Date(dateStr).toLocaleDateString("ka-GE", {
    day: "numeric",
    month: "short",
  });
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
  onLikeToggle?: (
    postId: string,
    currentCount: number,
    setCount: (n: number) => void,
  ) => void;
  currentUserId?: string;
  onBlock?: (blockedUserId: string) => void;
}

export function PostCard({
  post,
  liked = false,
  onLikeToggle,
  currentUserId,
  onBlock,
}: PostCardProps) {
  const router = useRouter();
  const author = post.profiles;
  const initials = (author.display_name || author.username || "?")
    .slice(0, 2)
    .toUpperCase();
  const authorName =
    author.display_name || author.username || "მომხმარებელი";
  const { title, body } = extractTitle(post.content);

  const [localCount, setLocalCount] = useState(post.reaction_count);

  const isSelf = currentUserId === post.author_id;

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

  async function handleReport() {
    if (!currentUserId) return;
    const { error } = await supabase.from("reports").insert({
      reporter_id: currentUserId,
      target_type: "post" as const,
      target_id: post.id,
    });
    if (error) {
      toast.error("რეპორტი ვერ გაიგზავნა");
    } else {
      toast.success("რეპორტი გაიგზავნა, მადლობა!");
    }
  }

  async function handleBlock() {
    if (!currentUserId) return;
    const { error } = await supabase.from("blocklist").insert({
      blocker_id: currentUserId,
      blocked_id: post.author_id,
    });
    if (error) {
      if (error.code === "23505") {
        toast.info("უკვე დაბლოკილია");
      } else {
        toast.error("დაბლოკვა ვერ მოხერხდა");
      }
    } else {
      toast.success(
        `${authorName} დაიბლოკა. მისი პოსტები აღარ გამოჩნდება.`,
      );
      onBlock?.(post.author_id);
    }
  }

  return (
    <article className="rounded-xl border bg-card transition-all duration-200 hover:shadow-sm">
      <div className="p-3 sm:p-5">
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

              {/* Overflow menu with report/block */}
              {currentUserId && !isSelf && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="ml-auto shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleReport}>
                      <Flag className="mr-2 h-4 w-4" />
                      დაარეპორტე
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleBlock}
                      className="text-destructive focus:text-destructive"
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      დაბლოკე მომხმარებელი
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {(isSelf || !currentUserId) && (
                <button
                  type="button"
                  className="ml-auto shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {timeAgo(post.created_at)}
              </span>
              <PostTypeBadge type={post.type} className="shrink-0" />
            </div>
          </div>
        </div>

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

        {post.media_urls.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2 overflow-hidden rounded-lg sm:grid-cols-3">
            {post.media_urls.slice(0, 3).map((url, i) => (
              <Link
                key={i}
                href={`/p/${post.id}`}
                className="relative"
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

      <div className="flex items-center gap-0.5 border-t px-2 py-1.5 sm:gap-1 sm:px-4 sm:py-2">
        <button
          type="button"
          onClick={handleLikeClick}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
          />
          <span
            className={liked ? "text-red-500" : "text-muted-foreground"}
          >
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
          onClick={(e) => {
            e.preventDefault();
            const snippet = post.content.slice(0, 60);
            shareOrCopy({
              title: snippet || "პოსტი ქრონიკაში",
              text: `${authorName} — ${snippet}`,
              path: `/p/${post.id}`,
            });
          }}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Share2 className="h-4 w-4" />
          <span>გაზიარება</span>
        </button>
      </div>
    </article>
  );
}
