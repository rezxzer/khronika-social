"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useConversations } from "@/hooks/use-conversations";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { conversations, loading } = useConversations(user?.id);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-4">
        <h1 className="font-serif text-xl font-bold sm:text-2xl">
          მესიჯები
        </h1>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            <MessageSquare className="mb-3 h-8 w-8" />
            <p className="font-medium">ჯერ მესიჯები არ გაქვს</p>
            <p className="mt-1 text-sm">
              სხვა მომხმარებლის პროფილზე დააჭირე &quot;მესიჯი&quot; ღილაკს
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => {
              const name =
                conv.other_user.display_name ||
                conv.other_user.username ||
                "მომხმარებელი";
              const initials = name.slice(0, 2).toUpperCase();
              const hasUnread = conv.unread_count > 0;

              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-accent",
                    hasUnread && "border-seal/20 bg-seal-light/20",
                  )}
                >
                  <Avatar className="h-11 w-11 shrink-0 ring-1 ring-seal/10">
                    <AvatarImage src={conv.other_user.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-seal-muted text-seal text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={cn(
                          "truncate text-sm",
                          hasUnread ? "font-bold" : "font-medium",
                        )}
                      >
                        {name}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {timeAgo(conv.last_message_at)}
                      </span>
                    </div>
                    {conv.last_message && (
                      <p
                        className={cn(
                          "truncate text-xs",
                          hasUnread
                            ? "font-medium text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {conv.last_message}
                      </p>
                    )}
                  </div>

                  {hasUnread && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-seal px-1 text-[10px] font-bold text-seal-foreground">
                      {conv.unread_count > 9 ? "9+" : conv.unread_count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
