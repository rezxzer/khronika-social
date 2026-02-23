"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useUnreadCount } from "@/hooks/use-notifications";
import { supabase } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  BellOff,
  Heart,
  MessageCircle,
  UserPlus,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotificationRow {
  id: string;
  type: "comment" | "reaction" | "follow";
  entity_id: string;
  is_read: boolean;
  created_at: string;
  actor: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  post_id: string | null;
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

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select(
        "id, type, entity_id, is_read, created_at, actor:actor_id(id, username, display_name, avatar_url)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const rows = data as unknown as Array<{
      id: string;
      type: "comment" | "reaction" | "follow";
      entity_id: string;
      is_read: boolean;
      created_at: string;
      actor: NotificationRow["actor"];
    }>;

    const commentIds = rows
      .filter((n) => n.type === "comment")
      .map((n) => n.entity_id);

    let commentPostMap: Record<string, string> = {};
    if (commentIds.length > 0) {
      const { data: comments } = await supabase
        .from("comments")
        .select("id, post_id")
        .in("id", commentIds);
      if (comments) {
        for (const c of comments) commentPostMap[c.id] = c.post_id;
      }
    }

    const mapped: NotificationRow[] = rows.map((n) => ({
      ...n,
      post_id:
        n.type === "reaction"
          ? n.entity_id
          : n.type === "follow"
            ? null
            : commentPostMap[n.entity_id] ?? null,
    }));

    setNotifications(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const { refresh: refreshBadge } = useUnreadCount();

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notif-page:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  async function markAsRead(id: string) {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    refreshBadge();
  }

  async function markAllRead() {
    if (!user) return;
    setMarkingAll(true);
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      toast.error("ვერ მოინიშნა წაკითხულად");
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      refreshBadge();
      toast.success("ყველა წაკითხულად მოინიშნა");
    }
    setMarkingAll(false);
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold">შეტყობინებები</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} წაუკითხავი
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              disabled={markingAll}
            >
              {markingAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              ყველა წაკითხულად
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-seal/20 bg-seal-light/30 py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-seal-muted">
              <BellOff className="h-6 w-6 text-seal" />
            </div>
            <p className="text-lg font-medium">ჯერ შეტყობინებები არ არის</p>
            <p className="mt-1 text-sm text-muted-foreground">
              როცა ვინმე მოიწონებს ან დაკომენტარებს, აქ გამოჩნდება.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {notifications.map((n) => {
              const actorName =
                n.actor?.display_name || n.actor?.username || "ვიღაცა";
              const actorInitials = actorName.slice(0, 2).toUpperCase();
              const href =
                n.type === "follow"
                  ? n.actor?.username
                    ? `/u/${n.actor.username}`
                    : "#"
                  : n.post_id
                    ? n.type === "comment"
                      ? `/p/${n.post_id}?focus=comment`
                      : `/p/${n.post_id}`
                    : "#";

              return (
                <Link
                  key={n.id}
                  href={href}
                  onClick={() => {
                    if (!n.is_read) markAsRead(n.id);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-accent/50",
                    !n.is_read && "border-seal/20 bg-seal-light/20",
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0 ring-1 ring-seal/10">
                    <AvatarImage src={n.actor?.avatar_url ?? undefined} />
                    <AvatarFallback className="bg-seal-muted text-seal text-xs">
                      {actorInitials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{actorName}</span>{" "}
                      {n.type === "comment"
                        ? "დაკომენტარა შენს პოსტზე"
                        : n.type === "follow"
                          ? "გამოგიწერა"
                          : "მოიწონა შენი პოსტი"}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>

                  <div className="shrink-0">
                    {n.type === "comment" ? (
                      <MessageCircle className="h-4 w-4 text-seal" />
                    ) : n.type === "follow" ? (
                      <UserPlus className="h-4 w-4 text-seal" />
                    ) : (
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    )}
                  </div>

                  {!n.is_read && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-seal" />
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
