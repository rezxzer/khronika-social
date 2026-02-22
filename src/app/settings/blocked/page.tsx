"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, Ban, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface BlockedUser {
  blocked_id: string;
  created_at: string;
  profile: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function BlockedUsersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const fetchBlocked = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from("blocklist")
      .select(
        "blocked_id, created_at, profile:blocked_id(username, display_name, avatar_url)",
      )
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false });

    setBlocked((data as unknown as BlockedUser[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) fetchBlocked();
  }, [user, fetchBlocked]);

  async function handleUnblock(blockedId: string) {
    if (!user) return;
    setUnblocking(blockedId);

    const { error } = await supabase
      .from("blocklist")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", blockedId);

    if (error) {
      toast.error("განბლოკვა ვერ მოხერხდა");
    } else {
      setBlocked((prev) => prev.filter((b) => b.blocked_id !== blockedId));
      toast.success("მომხმარებელი განიბლოკა");
    }
    setUnblocking(null);
  }

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
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings/profile">
              <ArrowLeft className="h-4 w-4" />
              პარამეტრები
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="font-serif text-2xl font-bold">
            დაბლოკილი მომხმარებლები
          </h1>
          <p className="text-sm text-muted-foreground">
            დაბლოკილი მომხმარებლების პოსტები შენს ფიდში არ ჩანს.
          </p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : blocked.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed py-16 text-center text-muted-foreground">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <UserCheck className="h-6 w-6" />
            </div>
            <p className="text-lg font-medium">არავინ არის დაბლოკილი</p>
          </div>
        ) : (
          <div className="space-y-2">
            {blocked.map((b) => {
              const name =
                b.profile?.display_name ||
                b.profile?.username ||
                "მომხმარებელი";
              const initials = name.slice(0, 2).toUpperCase();
              return (
                <div
                  key={b.blocked_id}
                  className="flex items-center gap-3 rounded-xl border bg-card p-4"
                >
                  <Avatar className="h-9 w-9 ring-1 ring-seal/10">
                    <AvatarImage
                      src={b.profile?.avatar_url ?? undefined}
                    />
                    <AvatarFallback className="bg-seal-muted text-seal text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{name}</p>
                    {b.profile?.username && (
                      <p className="text-xs text-muted-foreground">
                        @{b.profile.username}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(b.blocked_id)}
                    disabled={unblocking === b.blocked_id}
                  >
                    {unblocking === b.blocked_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Ban className="h-4 w-4" />
                    )}
                    განბლოკვა
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
